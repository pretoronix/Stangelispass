# Viral UX - Visual Design Mockups

## MVP Recap Modal Design

```
┌────────────────────────────────────┐
│         BLURRED BACKDROP           │
│                                    │
│   ┌────────────────────────────┐  │
│   │  GOLD GRADIENT CARD        │  │
│   │  ┏━━━━━━━━━━━━━━━━━━━━━┓  │  │
│   │  ┃                     ┃  │  │
│   │  ┃      🏆  TROPHY     ┃  │  │
│   │  ┃                     ┃  │  │
│   │  ┃ 🍺 Brewmaster of    ┃  │  │
│   │  ┃    the Night        ┃  │  │
│   │  ┃                     ┃  │  │
│   │  ┃  ╔═══════════════╗  ┃  │  │
│   │  ┃  ║  JOHN SMITH   ║  ┃  │  │
│   │  ┃  ║   12 beers    ║  ┃  │  │
│   │  ┃  ╚═══════════════╝  ┃  │  │
│   │  ┃                     ┃  │  │
│   │  ┃  Friday Night Out   ┃  │  │
│   │  ┃  Feb 11, 2026       ┃  │  │
│   │  ┃                     ┃  │  │
│   │  ┃  ┌───────────────┐  ┃  │  │
│   │  ┃  │ #1 John  12🍺 │  ┃  │  │
│   │  ┃  │ #2 Sarah  9🍺 │  ┃  │  │
│   │  ┃  │ #3 Mike   7🍺 │  ┃  │  │
│   │  ┃  └───────────────┘  ┃  │  │
│   │  ┃                     ┃  │  │
│   │  ┃  [📤 Share] [Close] ┃  │  │
│   │  ┃                     ┃  │  │
│   │  ┗━━━━━━━━━━━━━━━━━━━━━┛  │  │
│   └────────────────────────────┘  │
│                                    │
└────────────────────────────────────┘
```

### Color Palette
```
Gradient:
  Top:    #FFD700 (Gold)
  Middle: #FFA500 (Orange)
  Bottom: #FF6B35 (Red-Orange)

Text: #FFFFFF (White)
Backdrop: rgba(0,0,0,0.5)
Button Green: #4CAF50
```

---

## Wall of Fame Screen

```
┌────────────────────────────────────┐
│  🏆 Wall of Fame                   │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Friday Night Out             │ │
│  │ Feb 11, 2026                 │ │
│  │                              │ │
│  │ 🏆  John Smith               │ │
│  │     12 beers                 │ │
│  │                              │ │
│  │ [🍺 Clink! (23)]             │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Saturday Brunch              │ │
│  │ Feb 10, 2026                 │ │
│  │                              │ │
│  │ 🏆  Sarah Jones              │ │
│  │     8 beers                  │ │
│  │                              │ │
│  │ [🍺 Clink! (17)]             │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Thursday Happy Hour          │ │
│  │ Feb 8, 2026                  │ │
│  │                              │ │
│  │ 🏆  Mike Johnson             │ │
│  │     6 beers                  │ │
│  │                              │ │
│  │ [🍺 Clink! (12)]             │ │
│  └──────────────────────────────┘ │
│                                    │
└────────────────────────────────────┘
```

---

## Animation Sequences

### Modal Entry Animation
```
Frame 1 (0ms):    scale: 0,   opacity: 0
Frame 2 (50ms):   scale: 0.3, opacity: 0.5
Frame 3 (100ms):  scale: 0.7, opacity: 0.8
Frame 4 (200ms):  scale: 1.1, opacity: 1    (overshoot)
Frame 5 (300ms):  scale: 0.95, opacity: 1   (bounce back)
Frame 6 (400ms):  scale: 1.0, opacity: 1    (settle)
```

### Clink Button Animation
```
Tap:
  1. Scale to 0.95 (50ms)
  2. Trigger haptic feedback
  3. Scale to 1.05 (100ms, spring)
  4. Number increments
  5. Settle to 1.0 (150ms)
```

### Trophy Icon Animation
```
On Modal Show:
  1. Rotate -10° (100ms)
  2. Rotate +10° (200ms)
  3. Rotate -5° (300ms)
  4. Rotate 0° (400ms, settle)
  + Continuous subtle float up/down
```

---

## Interaction States

### Share Button States
```
Default:
  ┌───────────────┐
  │ 📤 Share      │  Green (#4CAF50)
  └───────────────┘

Pressed:
  ┌───────────────┐
  │ 📤 Share      │  Darker green, scale 0.95
  └───────────────┘

Loading:
  ┌───────────────┐
  │ ⏳ Saving...  │  Spinner animation
  └───────────────┘

Success:
  ┌───────────────┐
  │ ✅ Shared!    │  Brief confirmation
  └───────────────┘
```

### Clink Button States
```
Default:
  ┌────────────────┐
  │ 🍺 Clink! (23) │  Cream background
  └────────────────┘

Pressed:
  ┌────────────────┐
  │ 🍺 Clink! (23) │  Scaled, haptic fires
  └────────────────┘

Already Clinked:
  ┌────────────────┐
  │ ✨ Clinked (24)│  Gray, disabled
  └────────────────┘
```

---

## Responsive Layouts

### Mobile (320px - 400px)
```
┌──────────────────┐
│   Compact Card   │
│   Smaller text   │
│   Stacked btns   │
└──────────────────┘
```

### Tablet (400px - 600px)
```
┌────────────────────────┐
│     Standard Card      │
│     Normal spacing     │
│   Side-by-side btns    │
└────────────────────────┘
```

### Desktop/Web (600px+)
```
┌──────────────────────────────┐
│      Max-width Card          │
│      Larger elements         │
│      Generous spacing        │
└──────────────────────────────┘
```

---

## Screenshot Optimization

### Dimensions
- **Aspect Ratio**: 9:16 (Instagram Story)
- **Resolution**: 1080x1920px
- **Format**: PNG (lossless)
- **Quality**: 100%

### Social Media Specs
```
Instagram Story:   1080x1920px ✅ Optimized
Instagram Post:    1080x1080px (crop top/bottom)
Twitter:           1200x675px  (crop & scale)
WhatsApp:          Any         ✅ Works well
```

---

## Haptic Patterns

### Modal Appears
```
Type: Success notification
Duration: ~200ms
Pattern: ─━─━─  (two strong pulses)
```

### Share Success
```
Type: Light impact
Duration: ~50ms
Pattern: ─  (single tap)
```

### Clink Action
```
Type: Heavy impact
Duration: ~100ms
Pattern: ━━  (strong solid)
```

### Real-time Clink (remote)
```
Type: Medium impact
Duration: ~70ms
Pattern: ─━─  (acknowledgment)
```

---

## Typography Scale

```
Hero (Winner Name):  32pt / Bold
Title (Brewmaster):  24pt / Bold
Subtitle (Event):    18pt / Semibold
Body (Leaderboard):  16pt / Regular
Caption (Date):      14pt / Regular
Small (Clink count): 12pt / Medium
```

---

## Spacing System

```
XXS: 4px   - Tight spacing
XS:  8px   - Element padding
SM:  12px  - Small gaps
MD:  16px  - Standard spacing
LG:  24px  - Section spacing
XL:  32px  - Large gaps
XXL: 48px  - Major sections
```

---

## Shadow & Elevation

### MVP Card
```
Shadow Color: #000
Offset: 0, 10px
Opacity: 0.3
Radius: 20px
Elevation: 10 (Android)
```

### Wall Cards
```
Shadow Color: #000
Offset: 0, 2px
Opacity: 0.1
Radius: 8px
Elevation: 3 (Android)
```

---

## Border Radius

```
Small:  8px  - Buttons, inputs
Medium: 12px - Buttons
Large:  16px - Cards
XLarge: 24px - Modal
Circle: 50%  - Avatar, icons
```

---

**Design System Complete** ✨
