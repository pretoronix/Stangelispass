import AsyncStorage from "@react-native-async-storage/async-storage";
import { reportError } from "@/utils/logger";

const PACE_PRESET_KEY = "pace_preset_bph";

export async function getPacePreset(): Promise<number | null> {
  try {
    const stored = await AsyncStorage.getItem(PACE_PRESET_KEY);
    if (!stored) return null;
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : null;
  } catch (error) {
    reportError(new Error("Failed to load pace preset"), {
      scope: "pace_preset",
      action: "load",
      metadata: {
        cause: error instanceof Error ? error.message : String(error),
      },
    });
    return null;
  }
}

export async function setPacePreset(value: number | null): Promise<void> {
  try {
    if (value === null) {
      await AsyncStorage.removeItem(PACE_PRESET_KEY);
      return;
    }
    await AsyncStorage.setItem(PACE_PRESET_KEY, value.toString());
  } catch (error) {
    reportError(new Error("Failed to save pace preset"), {
      scope: "pace_preset",
      action: "save",
      metadata: {
        cause: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
