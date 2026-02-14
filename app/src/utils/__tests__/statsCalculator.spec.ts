import { calculateVelocity, prepareTrendData } from '../statsCalculator';

describe('utils/statsCalculator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T02:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calculateVelocity returns 0 for empty input', () => {
    expect(calculateVelocity([])).toBe(0);
  });

  it('calculateVelocity uses a minimum effective duration to avoid infinity', () => {
    const nowIso = new Date('2020-01-01T02:00:00.000Z').toISOString();
    // Start == now -> diffHours == 0 -> effectiveHours == 0.1
    const v = calculateVelocity([nowIso], nowIso);
    expect(v).toBeCloseTo(10, 6); // 1 / 0.1
  });

  it('prepareTrendData produces cumulative buckets up to now', () => {
    const timestamps = [
      '2020-01-01T00:00:00.000Z',
      '2020-01-01T01:00:00.000Z',
    ];
    const data = prepareTrendData(timestamps);
    expect(data).toEqual([
      { value: 1, label: '0h' },
      { value: 2, label: '1h' },
      { value: 2, label: '2h' },
    ]);
  });
});

