# Potential Crash Causes in PourAnimation

## Issue 1: BlurView Platform Compatibility
Line 107: `<BlurView intensity={80} style={styles.blur}>`
- BlurView from expo-blur may crash on iOS simulator in certain scenarios
- Known issues with BlurView causing crashes on iOS 15+
- May fail silently or crash with no error

## Issue 2: Lottie Animation Ref
Line 49: `animationRef.current?.play();`
- If ref is null when play() is called
- Lottie may not be mounted yet when play() fires
- Race condition between Modal render and Lottie mount

## Issue 3: Multiple Timeouts
Lines 55-82: Multiple setTimeout calls running concurrently
- Haptic sequence creates 12 timeouts
- Animation timer creates another timeout
- If component unmounts mid-animation, timeouts may fire on unmounted component

## Issue 4: Reanimated Callback
Lines 89-93: Callback in withTiming
- Callback may execute after component unmount
- No null check on onComplete prop

## Issue 5: Modal + Animated.View
Lines 99-105: Modal with Animated.View
- iOS simulator sometimes has issues with Modal + complex animations
- Double animation layer (Modal animationType + Reanimated opacity)

## Issue 6: Dimensions.get('window')
Line 19: `const { width, height } = Dimensions.get('window');`
- Dimensions called at module level, not component level
- May get stale dimensions or cause issues on orientation change
