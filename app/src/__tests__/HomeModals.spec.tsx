import React from "react";
import { render } from "@testing-library/react-native";
import { HomeModals } from "@/components/home/HomeModals";

// Mock sub-components
jest.mock("@/components/features/MVPModal", () => ({
  MVPModal: jest.fn(() => null),
}));
jest.mock("@/components/features/QRScanner", () => ({
  QRScanner: jest.fn(() => null),
}));
jest.mock("@/components/home/StartRoundPrompt", () => ({
  StartRoundPrompt: jest.fn(() => null),
}));
jest.mock("@/components/features/InviteModal", () => ({
  InviteModal: jest.fn(() => null),
}));
jest.mock("@/components/notifications/BroadcastModal", () => ({
  BroadcastModal: jest.fn(() => null),
}));
jest.mock("@/components/animations/Confetti", () => ({
  Confetti: jest.fn(() => null),
}));

describe("HomeModals", () => {
  const defaultProps = {
    showRecap: false,
    setShowRecap: jest.fn(),
    winner: { name: "Alice", count: 5 },
    scanning: false,
    setScanning: jest.fn(),
    handleScan: jest.fn(),
    eventActions: {
      showStartRoundPrompt: false,
      pendingAction: null,
      startRoundName: "",
      setStartRoundName: jest.fn(),
      beerPrice: "5.0",
      setBeerPrice: jest.fn(),
      pendingJoinEventName: "",
      promptSubmitting: false,
      submitNamePrompt: jest.fn(),
      setShowStartRoundPrompt: jest.fn(),
    },
    activeEvent: { id: "e1", name: "Event 1" },
    currentUser: { id: "u1" },
    showInvite: false,
    setShowInvite: jest.fn(),
    showBroadcast: false,
    setShowBroadcast: jest.fn(),
    showConfetti: false,
    setShowConfetti: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<HomeModals {...defaultProps} />);
  });

  it("passes correct props to MVPModal", () => {
    const { MVPModal } = require("@/components/features/MVPModal");
    render(<HomeModals {...defaultProps} showRecap={true} />);
    expect(MVPModal.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        visible: true,
        winnerName: "Alice",
        totalBeers: 5,
      }),
    );
  });

  it("renders QRScanner when scanning is true", () => {
    const { QRScanner } = require("@/components/features/QRScanner");
    render(<HomeModals {...defaultProps} scanning={true} />);
    expect(QRScanner.mock.calls[0][0]).toEqual(
      expect.objectContaining({ onScan: defaultProps.handleScan }),
    );
  });

  it("passes correct props to StartRoundPrompt", () => {
    const { StartRoundPrompt } = require("@/components/home/StartRoundPrompt");
    const eventActions = {
      ...defaultProps.eventActions,
      showStartRoundPrompt: true,
    };
    render(<HomeModals {...defaultProps} eventActions={eventActions} />);
    expect(StartRoundPrompt.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        visible: true,
        beerPrice: "5.0",
      }),
    );
  });

  it("renders InviteModal with correct props", () => {
    const { InviteModal } = require("@/components/features/InviteModal");
    render(<HomeModals {...defaultProps} showInvite={true} />);
    expect(InviteModal.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        visible: true,
        eventId: "e1",
        eventName: "Event 1",
      }),
    );
  });

  it("renders BroadcastModal when showBroadcast is true and event is active", () => {
    const {
      BroadcastModal,
    } = require("@/components/notifications/BroadcastModal");
    render(<HomeModals {...defaultProps} showBroadcast={true} />);
    expect(BroadcastModal.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        visible: true,
        eventId: "e1",
        senderId: "u1",
      }),
    );
  });

  it("does not render BroadcastModal when activeEvent is null", () => {
    const {
      BroadcastModal,
    } = require("@/components/notifications/BroadcastModal");
    render(
      <HomeModals {...defaultProps} showBroadcast={true} activeEvent={null} />,
    );
    expect(BroadcastModal).not.toHaveBeenCalled();
  });

  it("triggers Confetti with correct trigger prop", () => {
    const { Confetti } = require("@/components/animations/Confetti");
    render(<HomeModals {...defaultProps} showConfetti={true} />);
    expect(Confetti.mock.calls[0][0]).toEqual(
      expect.objectContaining({ trigger: true }),
    );
  });
});
