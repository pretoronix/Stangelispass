import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLiveBeerLogPreference, setLiveBeerLogPreference } from '../beerLogPreferences';
import { reportError } from '@/utils/logger';

describe('utils/beerLogPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defaults to false when unset', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await expect(getLiveBeerLogPreference()).resolves.toBe(false);
  });

  it('reads true/false correctly', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');
    await expect(getLiveBeerLogPreference()).resolves.toBe(true);

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('false');
    await expect(getLiveBeerLogPreference()).resolves.toBe(false);
  });

  it('persists preference', async () => {
    await setLiveBeerLogPreference(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('enable_live_beer_log_updates', 'true');

    await setLiveBeerLogPreference(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('enable_live_beer_log_updates', 'false');
  });

  it('reports error on load failure', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(getLiveBeerLogPreference()).resolves.toBe(false);
    expect(reportError).toHaveBeenCalled();
  });
});

