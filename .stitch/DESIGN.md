# Yearworm Design System — Extracted from Stitch

## Creative North Star: "The Neon Hearth"

A cozy living room illuminated by soft, colored glow of a television and record player. Intentional depth and atmospheric perspective. Floating, frosted elements with asymmetric card stacking and overlapping typography.

---

## Color Palette

### Core Brand Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#28dfb5` | Team A, action elements, CTAs |
| `secondary` | `#d0bcff` | Team B, competitive balance |
| `tertiary` | `#f3c01a` | Tokens, rewards, currency, winning moments |

### Override Colors (Source)
| Token | Hex |
|-------|-----|
| `overridePrimaryColor` | `#00d4aa` |
| `overrideSecondaryColor` | `#8b5cf6` |
| `overrideTertiaryColor` | `#ffca28` |
| `overrideNeutralColor` | `#0a0e1a` |

### Full Material Design 3 Palette

#### Surface Colors
| Token | Hex |
|-------|-----|
| `background` | `#0f131f` |
| `surface` | `#0f131f` |
| `surface_bright` | `#353946` |
| `surface_dim` | `#0f131f` |
| `surface_tint` | `#28dfb5` |
| `surface_variant` | `#313442` |
| `surface_container` | `#1b1f2c` |
| `surface_container_high` | `#262a37` |
| `surface_container_highest` | `#313442` |
| `surface_container_low` | `#171b28` |
| `surface_container_lowest` | `#0a0e1a` |

#### Primary Colors
| Token | Hex |
|-------|-----|
| `primary` | `#28dfb5` |
| `primary_container` | `#00120c` |
| `primary_fixed` | `#55fcd0` |
| `primary_fixed_dim` | `#28dfb5` |
| `on_primary` | `#00382b` |
| `on_primary_container` | `#008c6f` |
| `on_primary_fixed` | `#002118` |
| `on_primary_fixed_variant` | `#00513f` |
| `inverse_primary` | `#006b55` |

#### Secondary Colors
| Token | Hex |
|-------|-----|
| `secondary` | `#d0bcff` |
| `secondary_container` | `#571bc1` |
| `secondary_fixed` | `#e9ddff` |
| `secondary_fixed_dim` | `#d0bcff` |
| `on_secondary` | `#3c0091` |
| `on_secondary_container` | `#c4abff` |
| `on_secondary_fixed` | `#23005c` |
| `on_secondary_fixed_variant` | `#5516be` |

#### Tertiary Colors
| Token | Hex |
|-------|-----|
| `tertiary` | `#f3c01a` |
| `tertiary_container` | `#140d00` |
| `tertiary_fixed` | `#ffdf93` |
| `tertiary_fixed_dim` | `#f3c01a` |
| `on_tertiary` | `#3e2e00` |
| `on_tertiary_container` | `#997700` |
| `on_tertiary_fixed` | `#241a00` |
| `on_tertiary_fixed_variant` | `#594400` |

#### Error Colors
| Token | Hex |
|-------|-----|
| `error` | `#ffb4ab` |
| `error_container` | `#93000a` |
| `on_error` | `#690005` |
| `on_error_container` | `#ffdad6` |

#### On-Surface Colors
| Token | Hex |
|-------|-----|
| `on_background` | `#dfe2f3` |
| `on_surface` | `#dfe2f3` |
| `on_surface_variant` | `#c7c6cc` |
| `outline` | `#909096` |
| `outline_variant` | `#46464c` |

#### Inverse Colors
| Token | Hex |
|-------|-----|
| `inverse_surface` | `#dfe2f3` |
| `inverse_on_surface` | `#2c303d` |
| `inverse_primary` | `#006b55` |

---

## Typography

### Font Families
| Role | Font | Usage |
|------|------|-------|
| Display & Headlines | **Plus Jakarta Sans** | Vibe setters, editorial voice, game prompts |
| Body | **Be Vietnam Pro** | Game rules, settings, metadata, UI labels |
| Labels | **Be Vietnam Pro** | Chips, tags, small UI elements |

### Type Scale
| Token | Size | Usage |
|-------|------|-------|
| `display-lg` | `3.5rem` (56px) | Score announcements |
| `display-md` | `2.8rem` (45px) | Hero statements |
| `display-sm` | `2.25rem` (36px) | Section headers |
| `headline-lg` | `2rem` (32px) | Page titles |
| `headline-md` | `1.75rem` (28px) | Game prompts |
| `headline-sm` | `1.5rem` (24px) | Card section headers |
| `title-lg` | `1.375rem` (22px) | Card headers |
| `title-md` | `1rem` (16px) | Subtitles |
| `title-sm` | `0.875rem` (14px) | Small titles |
| `body-lg` | `1rem` (16px) | Primary body text |
| `body-md` | `0.875rem` (14px) | Default body text |
| `body-sm` | `0.75rem` (12px) | Fine print |
| `label-lg` | `0.875rem` (14px) | Button labels |
| `label-md` | `0.75rem` (12px) | Input labels |
| `label-sm` | `0.6875rem` (11px) | Micro labels |

### Typography Rules
- Headlines: tight letter-spacing (-0.02em)
- Never use pure #FFFFFF — use `on_surface` (#dfe2f3) for text
- Display font roundness creates "friendly" feel
- Body font remains clean and neutral

---

## Spacing Scale

Scale factor: **3** (generous spacing)

| Token | Value | Rem |
|-------|-------|-----|
| `spacing.1` | `0.25rem` | 4px |
| `spacing.2` | `0.5rem` | 8px |
| `spacing.3` | `0.75rem` | 12px |
| `spacing.4` | `1rem` | 16px |
| `spacing.5` | `1.25rem` | 20px |
| `spacing.6` | `1.5rem` | 24px |
| `spacing.8` | `2rem` | 32px |
| `spacing.10` | `2.5rem` | 40px |
| `spacing.12` | `3rem` | 48px |
| `spacing.16` | `4rem` | 64px |
| `spacing.20` | `5rem` | 80px |
| `spacing.24` | `6rem` | 96px |

---

## Border Radii

Roundness: **ROUND_FULL** (maximum roundness)

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | `0.5rem` (8px) | Minimum visible radius |
| `md` | `1rem` (16px) | Inputs, secondary elements |
| `lg` | `2rem` (32px) | Cards, main surfaces |
| `xl` | `3rem` (48px) | Primary buttons (pill shape) |
| `full` | `9999px` | Circular elements |

### Rules
- Minimum radius for any visible surface: `sm` (0.5rem)
- Aim for `lg` (2rem) for main surfaces
- No sharp corners allowed

---

## Shadows & Elevation

### Tonal Layering (Primary Method)
| Level | Surface | Usage |
|-------|---------|-------|
| Level 0 (Floor) | `surface_dim` (#0f131f) | Page background |
| Level 1 (Sub-section) | `surface_container_low` (#171b28) | Section backgrounds |
| Level 2 (Active) | `surface_container_high` (#262a37) + glassmorphism | Cards, interactive elements |

### Tinted Glow Shadows
- **Value:** `0px 12px 32px`
- **Color:** 8% opacity of `primary` or `secondary` (context-dependent)
- Mimics neon light spilling onto dark walls
- Never use black shadows

### Ghost Border (Accessibility Fallback)
- `outline_variant` (#46464c) at **15% opacity**
- Subtle "catch-light" on frosted glass edges

---

## Glassmorphism Recipe

```css
.glass {
  background: rgba(49, 52, 66, 0.6); /* surface_variant at 60% */
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(70, 70, 76, 0.15); /* outline_variant at 15% */
}
```

- Use `surface_variant` (#313442) at 60% opacity
- Backdrop blur: 20px to 40px
- Apply to all primary game surfaces

---

## Component Styles

### Buttons
- **Primary:** Full `xl` (3rem) radius. Teal-to-DarkTeal gradient (#28dfb5 → #008c6f at 45°). Outer glow on hover.
- **Secondary:** Glassmorphic background (`surface_bright` at 20% opacity) with `primary` or `secondary` text.
- **Min height:** `spacing.12` (3rem / 48px) — thumb-optimized for landscape mobile.

### Game Cards
- **Background:** Glassmorphic (frosted glass effect)
- **Radius:** `rounded-lg` (2rem) for friendly, toy-like feel
- **Spacing:** `spacing.6` (1.5rem) vertical whitespace between header and content
- **No dividers** — use whitespace

### Tokens & Chips
- **Color:** `tertiary` (#f3c01a) gold
- **Glow:** 4px blur of `tertiary_fixed` (#ffdf93)
- Physical, shining objects feel

### Input Fields
- **Background:** `surface_container_highest` (#313442)
- **Radius:** `rounded-md` (1rem)
- **Focus:** Border transitions from 0% to 40% `primary` teal
- No bottom line, minimalist

### CTA Gradient
```css
background: linear-gradient(45deg, #28dfb5, #008c6f);
```

---

## Do's and Don'ts

### Do
- Use landscape orientation for side-by-side Team A vs Team B layouts
- Use `spacing.16` or `spacing.20` for breathability around game prompts
- Use play-head progress bars and vinyl-inspired circular containers
- Use asymmetric spacing for editorial feel

### Don't
- Use pure #FFFFFF — use `on_surface` (#dfe2f3)
- Use sharp corners (min `sm` / 0.5rem)
- Use standard Material Design shadows (too grey/heavy)
- Use 1px solid borders for sections — use tonal separation instead

---

## Screen Inventory

| # | Screen Name | Dimensions | Visibility |
|---|-------------|-----------|------------|
| 1 | Home Screen | 1280×1404 | Visible |
| 2 | Game Setup - Teams | 1280×1024 | Visible |
| 3 | Game Setup - Settings | 1280×1038 | Visible |
| 4 | Standard Game Board | 1280×1024 | Visible |
| 5 | Refined Game Board | 1280×1024 | Visible |
| 6 | Win Screen | 1280×1024 | Visible |
| 7 | Home Screen v1 | 1280×1024 | Hidden |
| 8 | Full Screen Game Board | 1280×1024 | Hidden |
| 9 | Game Setup Wizard | 1280×1024 | Hidden |
| 10 | Complete Game Board | 1280×1024 | Hidden |
| 11 | Game Board | 1280×1024 | Hidden |

### Reference Images (no HTML)
| # | Title | Dimensions |
|---|-------|-----------|
| 12 | Reference 1 | 776×726 |
| 13 | Reference 2 | 812×942 |
| 14 | Reference 3 | 757×533 |
