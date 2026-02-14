import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useNotifications } from '@/hooks/useNotifications';
import * as notifications from '@/services/notifications';

// Mock the notification service
jest.mock('@/services/notifications');

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not register when userId is null', () => {
    const { result } = renderHook(() => useNotifications(null));
    
    expect(result.current.token).toBeNull();
    expect(result.current.isRegistered).toBe(false);
    expect(notifications.registerForPushNotificationsAsync).not.toHaveBeenCalled();
  });

  it('should register device token when userId is provided', async () => {
    const mockToken = 'ExponentPushToken[abc123]';
    (notifications.registerForPushNotificationsAsync as jest.Mock).mockResolvedValue(mockToken);

    const { result } = renderHook(() => useNotifications('user-123'));

    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    expect(notifications.registerForPushNotificationsAsync).toHaveBeenCalledWith('user-123');
    expect(result.current.token).toBe(mockToken);
  });

  it('should handle registration failure gracefully', async () => {
    (notifications.registerForPushNotificationsAsync as jest.Mock).mockRejectedValue(
      new Error('Permission denied')
    );

    const { result } = renderHook(() => useNotifications('user-123'));

    await waitFor(() => {
      expect(result.current.isRegistered).toBe(false);
    });

    expect(result.current.token).toBeNull();
  });

  it('should unregister when user changes to null', async () => {
    const mockToken = 'ExponentPushToken[abc123]';
    (notifications.registerForPushNotificationsAsync as jest.Mock).mockResolvedValue(mockToken);

    const { result, rerender } = renderHook<
      { token: string | null; isRegistered: boolean; unregister: () => Promise<boolean> },
      { userId: string | null }
    >(
      ({ userId }) => useNotifications(userId),
      { initialProps: { userId: 'user-123' } }
    );

    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    // Change user to null
    await act(async () => {
      rerender({ userId: null });
    });

    await waitFor(() => {
      expect(result.current.isRegistered).toBe(false);
    });

    expect(result.current.token).toBeNull();
  });

  it('should support manual unregistration', async () => {
    const mockToken = 'ExponentPushToken[abc123]';
    (notifications.registerForPushNotificationsAsync as jest.Mock).mockResolvedValue(mockToken);
    (notifications.unregisterPushToken as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useNotifications('user-123'));

    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    // Manually unregister
    await act(async () => {
      await result.current.unregister();
    });

    await waitFor(() => {
      expect(result.current.token).toBeNull();
      expect(result.current.isRegistered).toBe(false);
    });

    expect(notifications.unregisterPushToken).toHaveBeenCalledWith('user-123', mockToken);
  });
});
