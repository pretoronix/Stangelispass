/**
 * Stats Calculation for Stängelispass
 */

/**
 * Calculates drinking velocity (Beers per hour)
 * @param beerTimestamps List of ISO timestamps
 * @param eventStartTime Optional event start time (falls back to first beer)
 * @returns Velocity in beers/hour
 */
export const calculateVelocity = (
  beerTimestamps: string[],
  eventStartTime?: string,
): number => {
  if (!beerTimestamps.length) return 0;

  const now = new Date();
  const sorted = [...beerTimestamps].sort();
  const start = new Date(eventStartTime || sorted[0] || now.toISOString());

  // Difference in hours
  const diffMs = now.getTime() - start.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // Minimum 0.1 hours (6 mins) to prevent infinity/skew
  const effectiveHours = Math.max(0.1, diffHours);

  return beerTimestamps.length / effectiveHours;
};

/**
 * Prepares data for trends chart
 * @param beerTimestamps List of ISO timestamps
 * @returns Array of {value, label} for charts
 */
export const prepareTrendData = (beerTimestamps: string[]) => {
  if (!beerTimestamps.length) return [];

  const sorted = [...beerTimestamps].sort();
  const start = new Date(sorted[0] || new Date().toISOString());

  // Group by hour from start
  const dataPoints: { value: number; label: string }[] = [];

  // We want a cumulative count over time
  let cumulative = 0;

  // Create hourly buckets (up to now)
  const now = new Date();
  const totalHours = Math.ceil(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60),
  );

  for (let i = 0; i <= totalHours; i++) {
    const bucketTime = new Date(start.getTime() + i * 3600000);
    const countInBucket = beerTimestamps.filter((t) => {
      const time = new Date(t);
      return time <= bucketTime;
    }).length;

    dataPoints.push({
      value: countInBucket,
      label: `${i}h`,
    });
  }

  return dataPoints;
};
