# App Size Reduction Plan

## Current State Analysis

**Workspace Size**: 971 MB total (502 MB node_modules)  
**Assets**: 80 KB (4 PNG icons)  
**Target**: Bundle size optimization (actual app download size)  
**Approach**: Conservative - Safe optimizations only

---

## 📊 Bundle Size Contributors

### Heavy Dependencies Identified

1. **react-native-gifted-charts** - Chart library for velocity metrics
2. **lottie-react-native** - Pour animation (premium feature)
3. **expo-av** - Audio playback (bottle sound)
4. **react-native-view-shot** - Screenshot/sharing
5. **react-native-qrcode-svg** - QR codes (essential)

---

## 🎯 Recommended Optimization Strategy

### Phase 1: Easy Wins (2-4 hours)
**Estimated Savings: 8-15% | Risk: Very Low**

- [ ] Verify Hermes engine enabled (30-40% reduction)
- [ ] Optimize PNG assets to WebP (~50KB savings)
- [ ] Add production build flags to app.json
- [ ] Enable ProGuard (Android) / bitcode (iOS)
- [ ] Remove console.log in production builds

### Phase 2: Import Optimizations (2-3 hours)  
**Estimated Savings: 3-5% | Risk: Low**

- [ ] Use specific icon imports from @expo/vector-icons
- [ ] Use modular date-fns imports
- [ ] Configure metro.config.js for tree-shaking
- [ ] Audit unused dependencies

### Phase 3: Feature Analysis (Optional)
**Potential Savings: 10-15% | Risk: Medium**

- [ ] Make pour animation opt-in (saves lottie bundle)
- [ ] Consider removing audio if unused
- [ ] Replace chart library with custom SVG
- [ ] Lazy load Profile/History screens

### Phase 4: Advanced (Future)
**Potential Savings: 15-20% | Risk: Higher**

- [ ] Custom lightweight chart component
- [ ] Platform-specific bundles
- [ ] Dynamic imports for animations
- [ ] Remove expo-av, use native audio

---

## 📈 Expected Results

| Phase | Effort | Savings | Risk | User Impact |
|-------|--------|---------|------|-------------|
| 1 | 2-4 hrs | 8-15% | Very Low | None |
| 2 | 2-3 hrs | 3-5% | Low | None |
| 3 | 1-2 days | 10-15% | Medium | Opt-in features |
| 4 | 1-2 weeks | 15-20% | High | Possible bugs |

**Total Potential**: 36-55% size reduction (all phases)

---

## 🔍 Analysis Commands

```bash
# Measure current bundle
eas build --platform android --profile production
eas build --platform ios --profile production

# Analyze dependencies
npx cost-of-modules
npm list --depth=0

# Bundle visualization
npx react-native-bundle-visualizer
```

---

## ✅ Recommendation

**Start with Phase 1** - Safe optimizations that require minimal code changes and deliver 8-15% reduction with zero user impact. Measure results before proceeding to Phase 2.

Given your "just exploring" context, the app is already well-architected with no obvious bloat. Modern best practices are in place.
