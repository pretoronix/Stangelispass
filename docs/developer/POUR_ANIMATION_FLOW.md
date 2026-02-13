# Pour Animation Flow Diagram

## User Interaction Flow

```
User Taps "Log Beer"
        ↓
Check Device Capability (shouldShowAnimations)
        ↓
    ┌───┴───┐
    ↓       ↓
Modern   Low-End
Device   Device
    ↓       ↓
Full      Simple
Lottie    Fallback
    ↓       ↓
 2.5s      1.5s
    └───┬───┘
        ↓
  onComplete()
        ↓
Animation Dismissed
Beer Logged! ✅
```

## Timing Comparison

### Full Animation (PourAnimation)
- 0ms: Fade in + start Lottie + haptics begin
- 0-2000ms: Light haptic every 200ms
- 2500ms: Success haptic
- 2800ms: Fade out starts
- 3100ms: Complete

### Simple Fallback (SimplePourFeedback)
- 0ms: Success haptic + scale animation
- 500ms: Animation complete
- 1200ms: Fade out starts
- 1500ms: Complete

## Device Detection

```
shouldShowAnimations()
    ↓
Load user preference
    ↓
If disabled → false
    ↓
isLowEndDevice()
    ↓
Check: Year < 2020 OR RAM < 3GB
    ↓
If low-end → false
Otherwise → true
```

## Error Handling

```
User Action
    ↓
Show Animation (optimistic)
    ↓
Call addBeer()
    ↓
┌───┴───┐
↓       ↓
Success  Error
↓       ↓
Keep     Hide
playing  immediately
↓       ↓
Complete Show error
```

## Key Files

- `PourAnimation.tsx` - Full Lottie animation
- `SimplePourFeedback.tsx` - Simple fallback
- `deviceInfo.ts` - Device detection
- `add.tsx` - Integration point
- `settings.tsx` - User toggle
- `beer-pour.json` - Lottie asset

## Settings Integration

```
Settings Screen
    ↓
"Sensory Experience" Section
    ↓
"Pour Animation" Toggle
    ↓
Save to AsyncStorage
    ↓
Key: 'enable_pour_animation'
Value: 'true' | 'false'
```

---

**Key Insights:**
- Animation shown **optimistically** (before API completes)
- Device detection happens **once on mount**
- User preference **overrides** device capability
- Errors **immediately hide** animation
- All timers **cleaned up** on unmount
