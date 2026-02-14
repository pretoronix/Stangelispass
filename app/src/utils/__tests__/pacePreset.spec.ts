import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPacePreset, setPacePreset } from '../pacePreset';
import { reportError } from '@/utils/logger';

describe('utils/pacePreset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no value stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await expect(getPacePreset()).resolves.toBeNull();
  });

  it('returns parsed number when stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('2.5');
    await expect(getPacePreset()).resolves.toBe(2.5);
  });

  it('returns null when stored value is not numeric', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('nope');
    await expect(getPacePreset()).resolves.toBeNull();
  });

  it('setPacePreset stores the value', async () => {
    await setPacePreset(3);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('pace_preset_bph', '3');
  });

  it('setPacePreset null removes the value', async () => {
    await setPacePreset(null);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('pace_preset_bph');
  });

  it('reports error on load failure', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(getPacePreset()).resolves.toBeNull();
    expect(reportError).toHaveBeenCalled();
  });
});

