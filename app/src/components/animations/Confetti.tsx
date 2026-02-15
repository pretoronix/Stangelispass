import React, { useRef, useEffect } from "react";
import ConfettiCannon from "react-native-confetti-cannon";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface ConfettiProps {
  trigger: boolean;
  count?: number;
  origin?: { x: number; y: number };
  explosionSpeed?: number;
  fallSpeed?: number;
  fadeOut?: boolean;
  autoStart?: boolean;
  colors?: string[];
  onAnimationEnd?: () => void;
}

/**
 * Confetti animation component for celebrations
 *
 * Usage:
 * ```tsx
 * const [showConfetti, setShowConfetti] = useState(false);
 *
 * <Confetti trigger={showConfetti} onAnimationEnd={() => setShowConfetti(false)} />
 * <Button onPress={() => setShowConfetti(true)} />
 * ```
 */
export const Confetti: React.FC<ConfettiProps> = ({
  trigger,
  count = 200,
  origin = { x: 0, y: 0 },
  explosionSpeed = 350,
  fallSpeed = 3000,
  fadeOut = true,
  autoStart = false,
  colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"],
  onAnimationEnd,
}) => {
  const confettiRef = useRef<any>(null);
  const previousTrigger = useRef(trigger);

  useEffect(() => {
    // Fire confetti when trigger changes from false to true
    if (trigger && !previousTrigger.current) {
      // Add haptic feedback
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => null);
      }

      // Start confetti
      confettiRef.current?.start();

      // Call onAnimationEnd after duration
      if (onAnimationEnd) {
        const duration = (fallSpeed / 1000) * 1.5; // Add 50% buffer
        setTimeout(onAnimationEnd, duration);
      }
    }

    previousTrigger.current = trigger;
  }, [trigger, fallSpeed, onAnimationEnd]);

  if (!trigger && !autoStart) {
    return null;
  }

  return (
    <ConfettiCannon
      ref={confettiRef}
      count={count}
      origin={origin}
      explosionSpeed={explosionSpeed}
      fallSpeed={fallSpeed}
      fadeOut={fadeOut}
      autoStart={autoStart}
      colors={colors}
    />
  );
};
