import { useCallback, useEffect, useState } from "react";
import { getPacePreset, setPacePreset } from "@/utils/pacePreset";

export const usePacePreset = () => {
  const [savedPace, setSavedPace] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getPacePreset().then((pace) => {
      setSavedPace(pace);
      setLoaded(true);
    });
  }, []);

  const savePace = useCallback(async (pace: number) => {
    const normalized = Number.isFinite(pace) ? Number(pace.toFixed(1)) : 0;
    if (!normalized || normalized <= 0) return;
    setSavedPace(normalized);
    await setPacePreset(normalized);
  }, []);

  const clearSavedPace = useCallback(async () => {
    setSavedPace(null);
    await setPacePreset(null);
  }, []);

  return { savedPace, loaded, savePace, clearSavedPace };
};
