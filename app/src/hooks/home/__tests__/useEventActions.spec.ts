import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useEventActions } from '@/hooks/home/useEventActions';
import { addUser, joinEvent } from '@/services/supabase';
import { reportError } from '@/utils/logger';

jest.mock('@/services/supabase', () => ({
  addUser: jest.fn(),
  joinEvent: jest.fn(),
}));

describe('useEventActions', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    (addUser as jest.Mock).mockResolvedValue({ id: 'u1', name: 'X', is_admin: true });
    (joinEvent as jest.Mock).mockResolvedValue({ ok: true });
  });

  it('submits start_round and calls startEvent with validated price', async () => {
    const setCurrentUser = jest.fn();
    const startEvent = jest.fn().mockResolvedValue(undefined);
    const refresh = jest.fn();

    const { result } = renderHook(() => useEventActions(setCurrentUser, startEvent, refresh));

    act(() => {
      result.current.openNamePrompt('start_round');
      result.current.setStartRoundName('Alice');
      result.current.setBeerPrice('6.50');
    });

    await act(async () => {
      await result.current.submitNamePrompt();
    });

    expect(setCurrentUser).toHaveBeenCalledWith(expect.objectContaining({ id: 'u1' }));
    expect(startEvent).toHaveBeenCalledWith('Night Out', 'day', 6.5);
    expect(refresh).toHaveBeenCalled();
  });

  it('blocks start_round when user is not admin', async () => {
    (addUser as jest.Mock).mockResolvedValueOnce({ id: 'u2', name: 'NoAdmin', is_admin: false });

    const setCurrentUser = jest.fn();
    const startEvent = jest.fn().mockResolvedValue(undefined);
    const refresh = jest.fn();

    const { result } = renderHook(() => useEventActions(setCurrentUser, startEvent, refresh));

    act(() => {
      result.current.openNamePrompt('start_round');
      result.current.setStartRoundName('NoAdmin');
    });

    await act(async () => {
      await result.current.submitNamePrompt();
    });

    expect(alertSpy).toHaveBeenCalledWith('Admin Required', expect.any(String));
    expect(startEvent).not.toHaveBeenCalled();
  });

  it('blocks start_round when price is invalid', async () => {
    const setCurrentUser = jest.fn();
    const startEvent = jest.fn().mockResolvedValue(undefined);
    const refresh = jest.fn();

    const { result } = renderHook(() => useEventActions(setCurrentUser, startEvent, refresh));

    act(() => {
      result.current.openNamePrompt('start_round');
      result.current.setStartRoundName('Alice');
      result.current.setBeerPrice('0');
    });

    await act(async () => {
      await result.current.submitNamePrompt();
    });

    expect(alertSpy).toHaveBeenCalledWith('Invalid Price', expect.any(String));
    expect(startEvent).not.toHaveBeenCalled();
  });

  it('submits join_event and calls joinEvent when eventId provided', async () => {
    const setCurrentUser = jest.fn();
    const startEvent = jest.fn().mockResolvedValue(undefined);
    const refresh = jest.fn();

    const { result } = renderHook(() => useEventActions(setCurrentUser, startEvent, refresh));

    act(() => {
      result.current.openNamePrompt('join_event', 'My Event', 'evt1');
      result.current.setStartRoundName('Bob');
    });

    await act(async () => {
      await result.current.submitNamePrompt();
    });

    expect(joinEvent).toHaveBeenCalledWith('evt1', 'u1');
    expect(alertSpy).toHaveBeenCalledWith('Joined!', expect.stringContaining('My Event'));
    expect(refresh).toHaveBeenCalled();
  });

  it('reports joinEvent errors but still completes', async () => {
    (joinEvent as jest.Mock).mockRejectedValueOnce('fail');

    const setCurrentUser = jest.fn();
    const startEvent = jest.fn().mockResolvedValue(undefined);
    const refresh = jest.fn();

    const { result } = renderHook(() => useEventActions(setCurrentUser, startEvent, refresh));

    act(() => {
      result.current.openNamePrompt('join_event', 'My Event', 'evt1');
      result.current.setStartRoundName('Bob');
    });

    await act(async () => {
      await result.current.submitNamePrompt();
    });

    expect(reportError).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Joined!', expect.any(String));
  });

  it('does nothing when name is empty', async () => {
    const setCurrentUser = jest.fn();
    const startEvent = jest.fn().mockResolvedValue(undefined);
    const refresh = jest.fn();

    const { result } = renderHook(() => useEventActions(setCurrentUser, startEvent, refresh));

    act(() => {
      result.current.openNamePrompt('start_round');
      result.current.setStartRoundName('   ');
    });

    await act(async () => {
      await result.current.submitNamePrompt();
    });

    expect(addUser).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.promptSubmitting).toBe(false));
  });
});

