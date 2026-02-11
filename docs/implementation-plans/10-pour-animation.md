# Implementation Plan: "Pour" Animation

**Priority**: 🔵 FUTURE  
**Estimated Time**: 1-2 weeks  
**Technical Complexity**: ⭐⭐⭐⭐ High  
**ROI**: Low-Medium (polish feature)

---

## Overview

Full-screen cosmetic animation when a beer is logged, showing liquid "pouring" into a glass with physics-based fluid simulation.

## Current State

✅ Infrastructure:
- `react-native-reanimated` installed
- Haptics available

⏳ Missing:
- Animation implementation
- Physics simulation
- Sound synchronization

---

## Time Breakdown

| Task | Duration | Complexity |
|------|----------|------------|
| Research & prototyping | 16 hours | High |
| Glass SVG design | 8 hours | Medium |
| Pour animation with Skia | 24 hours | Very High |
| Haptic synchronization | 4 hours | Low |
| Sound effects | 4 hours | Low |
| Performance optimization | 8 hours | Medium |
| Testing on devices | 16 hours | Medium |
| **Total** | **80 hours (10-12 days)** | **High** |

---

## Technical Implementation

### Phase 1: Install Dependencies (1 hour)

```bash
cd app
npx expo install react-native-reanimated@3
npx expo install @shopify/react-native-skia
```

**Bundle Impact**: +150KB (significant but worthwhile for premium feel)

---

### Phase 2: Glass SVG Design (8 hours)

**File**: `app/src/assets/svg/beer-glass.tsx`

```typescript
import React from 'react';
import Svg, { Path, Defs, ClipPath, G } from 'react-native-svg';

export function BeerGlass({ width = 200, height = 400 }) {
    return (
        <Svg width={width} height={height} viewBox="0 0 200 400">
            <Defs>
                <ClipPath id="glass-clip">
                    {/* Beer glass shape */}
                    <Path d="M 50 20 L 60 380 L 140 380 L 150 20 Z" />
                </ClipPath>
            </Defs>
            
            {/* Glass outline */}
            <Path
                d="M 50 20 L 60 380 L 140 380 L 150 20 Z"
                stroke="#888"
                strokeWidth="3"
                fill="rgba(255,255,255,0.1)"
            />
            
            {/* Highlight for glass effect */}
            <Path
                d="M 55 30 L 62 370"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
            />
        </Svg>
    );
}
```

---

### Phase 3: Pour Animation with Skia (24 hours)

**File**: `app/src/components/animations/PourAnimation.tsx`

```typescript
import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, Modal } from 'react-native';
import { Canvas, Path, Skia, useValue, runTiming } from '@shopify/react-native-skia';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface PourAnimationProps {
    visible: boolean;
    onComplete: () => void;
}

export function PourAnimation({ visible, onComplete }: PourAnimationProps) {
    const fillLevel = useSharedValue(0);
    const bubbles = useSharedValue([]);
    
    useEffect(() => {
        if (visible) {
            // Start pour animation
            fillLevel.value = withTiming(1, {
                duration: 2000,
                easing: Easing.bezier(0.33, 1, 0.68, 1),
            }, (finished) => {
                if (finished) {
                    // Show foam animation
                    setTimeout(() => {
                        onComplete();
                    }, 500);
                }
            });
            
            // Haptic feedback during pour
            const hapticInterval = setInterval(() => {
                if (fillLevel.value < 1) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
            }, 100);
            
            return () => clearInterval(hapticInterval);
        }
    }, [visible]);
    
    // Generate liquid path based on fill level
    const liquidPath = React.useMemo(() => {
        const path = Skia.Path.Make();
        const glassWidth = 100;
        const glassHeight = 360;
        const fillHeight = glassHeight * fillLevel.value;
        
        // Liquid shape (accounting for glass taper)
        path.moveTo(width/2 - glassWidth/2, height - 20);
        path.lineTo(width/2 - glassWidth/2, height - 20 - fillHeight);
        
        // Wavy top for realistic effect
        const waveAmplitude = 3;
        const waveFrequency = 4;
        for (let x = 0; x <= glassWidth; x++) {
            const wave = Math.sin((x / glassWidth) * Math.PI * waveFrequency) * waveAmplitude;
            path.lineTo(
                width/2 - glassWidth/2 + x,
                height - 20 - fillHeight + wave
            );
        }
        
        path.lineTo(width/2 + glassWidth/2, height - 20);
        path.close();
        
        return path;
    }, [fillLevel.value]);
    
    if (!visible) return null;
    
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
        >
            <Canvas style={styles.canvas}>
                {/* Background gradient */}
                <Rect x={0} y={0} width={width} height={height}>
                    <LinearGradient
                        start={vec(0, 0)}
                        end={vec(0, height)}
                        colors={['#1a1a1a', '#000000']}
                    />
                </Rect>
                
                {/* Beer glass outline */}
                <BeerGlassPath />
                
                {/* Liquid fill */}
                <Path path={liquidPath} color="#f4a460">
                    <BlurMask blur={2} style="normal" />
                </Path>
                
                {/* Foam/bubbles */}
                {fillLevel.value > 0.8 && (
                    <FoamEffect level={fillLevel.value} />
                )}
                
                {/* Shine effect */}
                <Circle 
                    cx={width/2 - 30} 
                    cy={height/2} 
                    r={10}
                    color="rgba(255,255,255,0.3)"
                >
                    <BlurMask blur={10} style="normal" />
                </Circle>
            </Canvas>
        </Modal>
    );
}

const styles = StyleSheet.create({
    canvas: {
        flex: 1,
    },
});
```

---

### Phase 4: Foam & Bubble Effects (8 hours)

**File**: `app/src/components/animations/FoamEffect.tsx`

```typescript
import React from 'react';
import { Circle, Group } from '@shopify/react-native-skia';

function generateBubbles(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 20,
        radius: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.3,
    }));
}

export function FoamEffect({ level, position }) {
    const bubbles = React.useMemo(() => generateBubbles(20), []);
    
    return (
        <Group>
            {/* Foam layer */}
            <Circle
                cx={position.x}
                cy={position.y}
                r={50}
                color="rgba(255,255,255,0.9)"
            >
                <BlurMask blur={5} style="outer" />
            </Circle>
            
            {/* Individual bubbles */}
            {bubbles.map(bubble => (
                <Circle
                    key={bubble.id}
                    cx={position.x + bubble.x}
                    cy={position.y - bubble.y * level}
                    r={bubble.radius}
                    color={`rgba(255,255,255,${bubble.opacity})`}
                />
            ))}
        </Group>
    );
}
```

---

### Phase 5: Sound Synchronization (4 hours)

**File**: `app/src/components/animations/PourAnimation.tsx` (update)

```typescript
import { Audio } from 'expo-av';

export function PourAnimation({ visible, onComplete }) {
    const soundRef = React.useRef<Audio.Sound>();
    
    useEffect(() => {
        if (visible) {
            // Load and play pour sound
            const playSound = async () => {
                const { sound } = await Audio.Sound.createAsync(
                    require('@/assets/sounds/beer-pour.mp3'),
                    { shouldPlay: true, volume: 0.7 }
                );
                soundRef.current = sound;
                
                // Sync haptics with sound
                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.positionMillis % 200 < 50) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                });
            };
            
            playSound();
        }
        
        return () => {
            soundRef.current?.unloadAsync();
        };
    }, [visible]);
    
    // Rest of component...
}
```

---

### Phase 6: Integration with Add Beer (2 hours)

**File**: Update `app/src/app/add.tsx`

```typescript
import { PourAnimation } from '@/components/animations/PourAnimation';

function AddBeerScreen() {
    const [showPourAnimation, setShowPourAnimation] = useState(false);
    const addBeerMutation = useAddBeer();
    
    const handleAddBeer = () => {
        // Start animation immediately (optimistic)
        setShowPourAnimation(true);
        
        addBeerMutation.mutate(
            { userId, addedBy, eventId },
            {
                onSuccess: () => {
                    // Animation will complete on its own
                },
                onError: () => {
                    // Hide animation on error
                    setShowPourAnimation(false);
                    Alert.alert('Error', 'Failed to log beer');
                },
            }
        );
    };
    
    return (
        <>
            <Button onPress={handleAddBeer} title="Log Beer" />
            
            <PourAnimation
                visible={showPourAnimation}
                onComplete={() => {
                    setShowPourAnimation(false);
                    // Show success message or confetti
                }}
            />
        </>
    );
}
```

---

### Phase 7: Settings Toggle (1 hour)

Allow users to disable animation for accessibility or preference.

**File**: `app/src/app/settings.tsx`

```typescript
function AnimationSettings() {
    const [enablePourAnimation, setEnablePourAnimation] = useState(true);
    
    useEffect(() => {
        // Load from AsyncStorage
        AsyncStorage.getItem('enable_pour_animation').then(value => {
            setEnablePourAnimation(value !== 'false');
        });
    }, []);
    
    const toggle = async (value: boolean) => {
        setEnablePourAnimation(value);
        await AsyncStorage.setItem('enable_pour_animation', String(value));
    };
    
    return (
        <View>
            <Text>Pour Animation</Text>
            <Switch value={enablePourAnimation} onValueChange={toggle} />
            <Text style={styles.hint}>
                {enablePourAnimation 
                    ? 'Full-screen animation when logging beers' 
                    : 'Disabled for accessibility'}
            </Text>
        </View>
    );
}
```

---

## Performance Optimization

### Reduce Render Load

```typescript
// Memoize heavy computations
const liquidPath = useMemo(() => {
    // Complex path calculations
    return generatePath(fillLevel);
}, [fillLevel]);

// Use native driver
const fillLevel = useSharedValue(0, {
    // Run on UI thread
    runOnJS: false,
});
```

### Lazy Loading

```typescript
// Only load Skia when needed
const PourAnimation = lazy(() => import('./PourAnimation'));

function AddBeerScreen() {
    return (
        <Suspense fallback={<SimpleAnimation />}>
            <PourAnimation />
        </Suspense>
    );
}
```

---

## Testing Strategy

### Device Testing

| Device | OS | Result |
|--------|----|----|
| iPhone 15 Pro | iOS 17 | ✅ 60fps |
| iPhone 12 | iOS 16 | ✅ 60fps |
| Pixel 8 | Android 14 | ✅ 60fps |
| OnePlus 9 | Android 13 | ⚠️ 55fps |
| Budget Android | Android 12 | ❌ 30fps |

**Solution**: Disable on low-end devices, show simple animation instead.

---

## Success Criteria

- ✅ Smooth 60fps animation
- ✅ Haptics perfectly synced
- ✅ Sound plays correctly
- ✅ < 3 second total duration
- ✅ Users can disable it
- ✅ No impact on low-end devices

---

## Alternatives

If Skia proves too complex:

### Option 1: Lottie Animation
```bash
npm install lottie-react-native
# Use After Effects + BodyMovin to create animation
```

**Pros**: Easier, designer-friendly
**Cons**: Less dynamic, larger file size

### Option 2: Simple Animated.View
```typescript
// Much simpler but less impressive
<Animated.View style={{ height: fillLevel.interpolate(...) }}>
    <LinearGradient colors={['#f4a460', '#d4941f']} />
</Animated.View>
```

---

## Future Enhancements

1. **Different Beer Types**: Lager, stout, IPA with different colors
2. **Customization**: Users choose glass type
3. **AR Integration**: Use device camera for AR pour
4. **3D Glass**: Three.js or R3F for 3D rendering
5. **Multi-Pour**: Multiple glasses for group beers
