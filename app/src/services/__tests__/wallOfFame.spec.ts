import {
  getWallOfFame,
  createWallOfFameEntry,
  addToast,
  removeToast,
  getUserToasts,
  getToastCount,
} from '@/services/wallOfFame';
import { reportError } from '@/utils/logger';

const mockFrom = jest.fn();

jest.mock('../supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

describe('wallOfFame (services)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getWallOfFame transforms winner/event/toasts fields', async () => {
    mockFrom.mockReturnValueOnce({
      select: () => ({
        order: () =>
          Promise.resolve({
            data: [
              {
                id: 'w1',
                event_id: 'e1',
                winner_id: 'u1',
                total_stängeli: 7,
                image_url: null,
                created_at: '2026-01-01T00:00:00.000Z',
                winner: { name: 'Alice' },
                event: { name: 'Round 1' },
                toasts: [{}, {}, {}],
              },
            ],
            error: null,
          }),
      }),
    });

    const rows = await getWallOfFame();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        id: 'w1',
        winner_name: 'Alice',
        event_name: 'Round 1',
        toast_count: 3,
      })
    );
  });

  it('getWallOfFame returns [] on error', async () => {
    mockFrom.mockReturnValueOnce({
      select: () => ({
        order: () => Promise.resolve({ data: null, error: new Error('db') }),
      }),
    });

    const rows = await getWallOfFame();

    expect(rows).toEqual([]);
    expect(reportError).toHaveBeenCalled();
  });

  it('createWallOfFameEntry returns inserted row', async () => {
    mockFrom.mockReturnValueOnce({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'w2' }, error: null }),
        }),
      }),
    });

    const created = await createWallOfFameEntry({
      event_id: 'e1',
      winner_id: 'u1',
      total_stängeli: 10,
      image_url: 'https://example.com/img.png',
    });

    expect(created).toEqual({ id: 'w2' });
  });

  it('createWallOfFameEntry returns null on error', async () => {
    mockFrom.mockReturnValueOnce({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('insert failed') }),
        }),
      }),
    });

    const created = await createWallOfFameEntry({
      event_id: 'e1',
      winner_id: 'u1',
      total_stängeli: 10,
    });

    expect(created).toBeNull();
    expect(reportError).toHaveBeenCalled();
  });

  it('addToast returns false on unique constraint violation', async () => {
    mockFrom.mockReturnValueOnce({
      insert: () => Promise.resolve({ error: { code: '23505' } }),
    });

    const ok = await addToast('w1', 'u1');

    expect(ok).toBe(false);
    // "already toasted" is expected, not an error report
    expect(reportError).not.toHaveBeenCalled();
  });

  it('addToast returns true on success and false on other errors', async () => {
    mockFrom
      .mockReturnValueOnce({
        insert: () => Promise.resolve({ error: null }),
      })
      .mockReturnValueOnce({
        insert: () => Promise.resolve({ error: { code: '999', message: 'boom' } }),
      });

    await expect(addToast('w1', 'u1')).resolves.toBe(true);
    await expect(addToast('w2', 'u2')).resolves.toBe(false);
    expect(reportError).toHaveBeenCalled();
  });

  it('removeToast returns true on success and false on error', async () => {
    mockFrom
      .mockReturnValueOnce({
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: new Error('nope') }),
          }),
        }),
      });

    await expect(removeToast('w1', 'u1')).resolves.toBe(true);
    await expect(removeToast('w2', 'u2')).resolves.toBe(false);
  });

  it('getUserToasts returns ids and [] on error', async () => {
    mockFrom
      .mockReturnValueOnce({
        select: () => ({
          eq: () => Promise.resolve({ data: [{ wall_id: 'w1' }, { wall_id: 'w2' }], error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: () => ({
          eq: () => Promise.resolve({ data: null, error: new Error('no') }),
        }),
      });

    await expect(getUserToasts('u1')).resolves.toEqual(['w1', 'w2']);
    await expect(getUserToasts('u2')).resolves.toEqual([]);
  });

  it('getToastCount returns count and 0 on error', async () => {
    mockFrom
      .mockReturnValueOnce({
        select: () => ({
          eq: () => Promise.resolve({ count: 5, error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: () => ({
          eq: () => Promise.resolve({ count: null, error: new Error('no') }),
        }),
      });

    await expect(getToastCount('w1')).resolves.toBe(5);
    await expect(getToastCount('w2')).resolves.toBe(0);
  });
});
