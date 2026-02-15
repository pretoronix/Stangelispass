describe("services/audio", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("loadSound reports errors when player creation fails", async () => {
    const expoAudio = require("expo-audio");
    const { reportError } = require("@/utils/logger");

    expoAudio.createAudioPlayer.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    const { audioService } = require("@/services/audio");
    await audioService.loadSound();

    expect(reportError).toHaveBeenCalled();
  });

  test("playPsst is a no-op when muted", async () => {
    const expoAudio = require("expo-audio");
    const { audioService } = require("@/services/audio");

    audioService.setMuted(true);
    await audioService.playPsst();

    // Constructor preloads sound on native platforms.
    expect(expoAudio.createAudioPlayer).toHaveBeenCalled();

    const player = expoAudio.createAudioPlayer.mock.results[0].value;
    expect(player.play).not.toHaveBeenCalled();
  });

  test("playPsst seeks to 0 and plays when unmuted", async () => {
    const expoAudio = require("expo-audio");
    const { audioService } = require("@/services/audio");

    audioService.setMuted(false);
    await audioService.playPsst();

    const player = expoAudio.createAudioPlayer.mock.results[0].value;
    expect(player.seekTo).toHaveBeenCalledWith(0);
    expect(player.play).toHaveBeenCalled();
  });

  test("playPsst reloads on play failure", async () => {
    const expoAudio = require("expo-audio");

    expoAudio.createAudioPlayer
      .mockImplementationOnce(() => ({
        play: jest.fn(() => {
          throw new Error("fail");
        }),
        seekTo: jest.fn(),
        release: jest.fn(),
      }))
      .mockImplementationOnce(() => ({
        play: jest.fn(),
        seekTo: jest.fn(),
        release: jest.fn(),
      }));

    const { audioService } = require("@/services/audio");
    audioService.setMuted(false);
    await audioService.playPsst();

    expect(expoAudio.createAudioPlayer).toHaveBeenCalledTimes(2);
    const recovered = expoAudio.createAudioPlayer.mock.results[1].value;
    expect(recovered.seekTo).toHaveBeenCalledWith(0);
    expect(recovered.play).toHaveBeenCalled();
  });
});
