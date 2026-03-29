# Stitch Design System Restyle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle all Yearworm React components to match the Stitch "Neon Hearth" design system HTML references.

**Architecture:** Two-phase approach — Home Screen first (low-risk, mostly polish), then Game Board (major layout restructure from flex to 12-col grid). Each phase ends with a Playwright visual test and user review.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4 with design tokens in globals.css, Framer Motion, @dnd-kit

---

## Phase 1: Home Screen

### Task 1: Add TopAppBar + BottomNavBar to Home Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Import and add layout components to home page**

Add TopAppBar at the top and BottomNavBar at the bottom of the home page. The home page currently has no shared navigation. Add padding-bottom to account for fixed bottom nav.

```tsx
// Add imports at top
import TopAppBar from '@/components/layout/TopAppBar';
import BottomNavBar from '@/components/layout/BottomNavBar';

// In the return JSX, wrap with:
<div className="relative min-h-screen selection:bg-primary/30">
  <TopAppBar />
  <BottomNavBar />
  {/* ... existing content ... */}
</div>
```

- [ ] **Step 2: Verify home page renders with nav bars**

Run dev server and check with Playwright that TopAppBar and BottomNavBar are visible.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add TopAppBar and BottomNavBar to home page"
```

### Task 2: Polish Home Page Classes to Match Stitch

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Fix class discrepancies**

The home page is already very close to Stitch. Fix these specific differences:
- Quick Play card: change `glass-card` → add `glass-panel` equivalent styling (glass-card adds border-radius which glass-panel doesn't have built-in)
- Change `font-display` → `font-headline` in subtitle paragraph (Stitch uses `font-headline`)
- Add `shadow-[0_12px_32px_rgba(40,223,181,0.08)]` to Quick Play card (matching Stitch `shadow-primary-glow`)
- Add bottom nav shadow: `shadow-[0_-8px_32px_rgba(0,0,0,0.3)]` to BottomNavBar

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: polish home screen classes to match Stitch design"
```

### Task 3: Update TopAppBar to Match Stitch

**Files:**
- Modify: `src/components/layout/TopAppBar.tsx`

- [ ] **Step 1: Add shadow and border from Stitch**

Stitch header has: `shadow-[0_12_32px_rgba(40,223,181,0.08)]` and uses search + account_circle buttons (not settings/help/account). Update to match.

- [ ] **Step 2: Commit**

### Task 4: Update BottomNavBar to Match Stitch

**Files:**
- Modify: `src/components/layout/BottomNavBar.tsx`

- [ ] **Step 1: Add shadow, active scale, and padding from Stitch**

Stitch bottom nav has: `shadow-[0_-8px_32px_rgba(0,0,0,0.3)]`, `rounded-t-[2.5rem]`, `pb-6 pt-3`, `active:scale-90 duration-300`, `border-t border-white/5`, text-[9px] labels.

- [ ] **Step 2: Commit**

### Task 5: Playwright Test Home Screen

- [ ] **Step 1: Start dev server and take screenshot**

Navigate to localhost:3000, take full-page screenshot, verify:
- TopAppBar visible with Yearworm logo
- Hero section with neon glow title
- Bento grid cards (Quick Play, Create, Join, Stats)
- Featured Eras grid
- BottomNavBar with 4 tabs

---

## Phase 2: Game Board

### Task 6: Restructure Game Page to 12-Column Grid

**Files:**
- Modify: `src/app/game/[gameId]/page.tsx`

- [ ] **Step 1: Replace vertical stack layout with Stitch 3-column grid**

Change from:
```
sticky top bar (ScoreBoard + TurnIndicator)
flex-1 (GameBoard with inline audio)
```

To Stitch layout:
```
<TopAppBar /> (fixed header)
<main class="flex-1 pt-24 pb-28 px-4 md:px-8 grid grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
  <section class="col-span-12 md:col-span-3"> Team A column </section>
  <section class="col-span-12 md:col-span-6"> Center column </section>
  <section class="col-span-12 md:col-span-3"> Team B column </section>
</main>
```

Move ScoreBoard panels into their respective team columns. Move TurnIndicator and AudioPlayer into center column.

- [ ] **Step 2: Commit**

### Task 7: Restyle ScoreBoard as Integrated Team Panels

**Files:**
- Modify: `src/components/game/ScoreBoard.tsx`

- [ ] **Step 1: Update TeamPanel to match Stitch team info card**

Stitch team panel: `glass-panel rounded-xl border border-primary/20 bg-primary/5`, with team label (uppercase xs), score as `3xl font-black`, tokens as filled/unfilled material icons. Inactive team gets `opacity-80`.

Remove the side-by-side `flex gap-3` wrapper — panels will be placed separately in the grid columns. Export TeamPanel individually.

- [ ] **Step 2: Commit**

### Task 8: Restyle GameBoard DraggableSongCard to Match Stitch Mystery Card

**Files:**
- Modify: `src/components/game/GameBoard.tsx`

- [ ] **Step 1: Resize and restyle mystery card**

Change from 120×120 square to Stitch's taller card:
- Size: `w-52 h-64` (208×256)
- Style: `glass-panel rounded-2xl border-2 border-primary/20`
- Inner: circular `?` icon in `w-20 h-20 rounded-full bg-primary/5` container
- Label: `"Place In Timeline"` in `text-[10px] font-bold tracking-[0.2em] text-primary uppercase bg-primary/10 px-3 py-1 rounded-full`
- Add shimmer overlay animation
- Hover: `hover:border-primary/40`
- Cursor: `cursor-grab active:cursor-grabbing`

- [ ] **Step 2: Commit**

### Task 9: Restyle Timeline Placed Cards to Match Stitch

**Files:**
- Modify: `src/components/game/Timeline.tsx`

- [ ] **Step 1: Update PlacedCard to Stitch glass-panel style**

Stitch card: `glass-panel p-5 rounded-xl shadow-lg border border-primary/10` with:
- Year badge: `px-3 py-1.5 bg-primary text-on-primary font-headline font-black text-sm rounded-lg shadow-[0_4px_12px_rgba(40,223,181,0.3)]`
- Check icon: `material-symbols-outlined text-primary text-xl` with FILL 1
- Song title: `font-headline font-bold text-on-surface leading-tight text-lg`
- Artist: `text-sm text-on-surface-variant font-medium`
- Progress bar: `w-full h-1 bg-primary/10 rounded-full overflow-hidden` with filled bg-primary

Replace the small image-based cards with these larger glass-panel text cards.

- [ ] **Step 2: Update DropZone styling**

Match Stitch: `h-14 border-2 border-dashed border-primary/20 rounded-lg` with centered "Drop Here" text.

- [ ] **Step 3: Update team color references**

Replace hardcoded `#00d4aa` → design token `var(--color-primary)` / Tailwind `primary`.
Replace hardcoded `#8b5cf6` → design token `var(--color-secondary)` / Tailwind `secondary`.

- [ ] **Step 4: Commit**

### Task 10: Restyle ChallengeModal to Match Stitch

**Files:**
- Modify: `src/components/game/ChallengeModal.tsx`

- [ ] **Step 1: Update to Stitch challenge overlay style**

Stitch: `glass-panel rounded-2xl p-6 border border-tertiary/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)]`
- Header: warning icon (FILL 1) + "Challenge? (1 token)" in `font-headline font-bold text-lg text-tertiary`
- Challenge button: `bg-tertiary text-on-tertiary font-bold rounded-xl shadow-[0_0_20px_rgba(243,192,26,0.3)]`
- Let it stand: `bg-surface-bright/40 text-on-surface font-bold rounded-xl border border-white/5`
- Both buttons: `flex-1 py-3.5 active:scale-95 transition-transform`

Use tertiary color scheme instead of team colors.

- [ ] **Step 2: Commit**

### Task 11: Restyle TurnIndicator to Match Stitch

**Files:**
- Modify: `src/components/game/TurnIndicator.tsx`

- [ ] **Step 1: Update to match Stitch center column header**

Stitch: `text-center mt-4` with:
- Sub-label: `text-xs font-bold text-primary/60 tracking-[0.2em] uppercase mb-1`
- Headline: `text-primary font-headline font-black tracking-tighter text-5xl vibe-glow uppercase italic`

Already close — verify classes match exactly.

- [ ] **Step 2: Commit**

### Task 12: Playwright Test Game Board

- [ ] **Step 1: Navigate to a demo game and take screenshots**

Start a quick play demo game, verify:
- 3-column grid layout (Team A | Center | Team B)
- Team panels with scores and tokens in glass-panel style
- Turn indicator centered with vibe-glow
- Play button with SVG progress ring
- Mystery card with glass-panel and shimmer
- Challenge modal with tertiary styling
- Timeline cards with glass-panel and year badges

---

## Deployment

After each phase passes Playwright tests:
- Commit all changes
- Push to master (auto-deploys to Vercel)
- Notify user for manual testing
