# AI Study Hub — Design System

> Living document. Last distilled: 2026-06-29.
> Reflects all decisions from brand analysis, impeccable audit, polish, and animation passes.

---

## 1. Brand Identity

| Attribute | Value |
|---|---|
| **Product name** | AI Study Hub |
| **Tone** | Professional, proactive, clear, modern |
| **Vibe** | Minimalist, warm-white, highly readable |
| **Core message** | Intelligent study tool for ambitious students |
| **Primary audience** | Students (18–25), Tech recruiters |

---

## 2. Color Palette

All colors are defined in [`tailwind.config.js`](./tailwind.config.js) and referenced via semantic tokens.

### Brand Tokens
```js
primary:        '#007f7a'   // Teal — primary actions, links, accents
primary-hover:  '#006662'   // Darker teal — hover state for primary
```

### Semantic Surface Colors (Tailwind defaults used consistently)
| Role | Class | Hex |
|---|---|---|
| Page background | `bg-gray-50` | `#F9FAFB` |
| Card surface | `bg-white` | `#FFFFFF` |
| Card border | `border-gray-100` | `#F3F4F6` |
| Divider | `border-gray-200` | `#E5E7EB` |
| Primary text | `text-gray-800` | `#1F2937` |
| Secondary text | `text-gray-600` | `#4B5563` |
| Muted text | `text-gray-500` | `#6B7280` |
| Placeholder/label | `text-gray-400` | `#9CA3AF` |

### Semantic Status Colors
| Status | Background | Text | Rule |
|---|---|---|---|
| Success | `bg-emerald-50 / bg-emerald-100` | `text-emerald-700` | Use matching hue family |
| Warning | `bg-amber-50 / bg-amber-100` | `text-amber-700` | Use matching hue family |
| Danger | `bg-red-50 / bg-red-100` | `text-red-800` | Use `red-800` not `red-700` on `red-100` bg |
| Info | `bg-blue-50 / bg-blue-100` | `text-blue-700` | Use matching hue family |
| Admin/Role | `bg-purple-100` | `text-purple-800` | Use `purple-800` not `purple-700` on `purple-100` bg |
| Neutral badge | `bg-gray-100` | `text-gray-600` | Use `gray-600` not `gray-700` on `gray-100` bg |

> **Rule:** Gray text (`text-gray-*`) must NEVER be placed on a colored background (e.g., `bg-purple-100`, `bg-red-100`). Always use a shade from the same hue family. This was flagged by `/impeccable audit`.

### Auth Page Special
```css
/* Gradient background for auth flow */
bg-gradient-to-br from-[#e0f2f1] to-primary/30
/* Card: glassmorphism */
bg-white/80 backdrop-blur-xl border border-white/50
```

---

## 3. Typography

| Role | Tailwind Classes | Notes |
|---|---|---|
| Page title (H1) | `text-3xl font-bold text-gray-800` | Main page headings |
| Section title (H2) | `text-2xl font-bold text-gray-800` | Card/section headings |
| Card label | `text-sm font-medium text-gray-500` | Stat card labels |
| Stat number | `text-2xl font-bold text-gray-800` | Dashboard numbers |
| Body text | `text-sm text-gray-700 leading-relaxed` | Table cells, descriptions |
| Muted/helper | `text-xs text-gray-400` | Timestamps, sub-labels |
| Link | `text-primary text-sm font-medium` | Inline navigation links |
| Nav link | `text-sm font-medium text-gray-700 hover:text-primary` | Top navbar |

**Font stack:** System default sans-serif (Tailwind's `font-sans`). No custom font loaded.

---

## 4. Spacing & Layout

| Token | Usage |
|---|---|
| `max-w-7xl mx-auto` | Admin page max width |
| `max-w-6xl mx-auto` | Document & Home page max width |
| `max-w-xl mx-auto` | Profile page max width |
| `p-6` | Standard page padding |
| `p-8` | Card/form inner padding |
| `gap-6` | Grid column gap |
| `gap-4` | Flex row gap (buttons, nav) |
| `mb-8` | Section bottom margin |
| `rounded-2xl` | Cards, panels |
| `rounded-xl` | Inputs, buttons, badges |
| `rounded-lg` | Small buttons |
| `rounded-full` | Icon buttons, avatars |

---

## 5. Component Patterns

### 5.1 Stat Cards
**Pattern:** Icon container + label + number. No side-tab borders.

```jsx
<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100
                flex items-center gap-4 hover-lift animate-fade-in-up stagger-N">
  <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
    <Icon size={24} />
  </div>
  <div>
    <p className="text-sm text-gray-500 font-medium">Label</p>
    <p className="text-2xl font-bold text-gray-800">Value</p>
  </div>
</div>
```

> ⛔ **Anti-pattern removed:** `border-l-4 border-l-*-500` — the most recognizable AI-generated UI tell. Never use.

### 5.2 Primary Button
```jsx
<button className="flex items-center gap-2 bg-primary hover:bg-primary-hover
                   text-white font-semibold px-4 py-2.5 rounded-xl
                   shadow-lg shadow-primary/30 transition-all active:scale-[0.98]
                   disabled:opacity-60 disabled:cursor-not-allowed">
  <Icon size={18} /> Label
</button>
```

### 5.3 Outline / Ghost Button
```jsx
<button className="flex items-center gap-2 px-4 py-2 border border-gray-200
                   text-gray-700 rounded-xl text-sm font-medium
                   hover:bg-gray-50 transition-colors">
  <Icon size={16} /> Label
</button>
```

### 5.4 Destructive Button
```jsx
<button className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600
                   hover:bg-red-100 rounded-lg transition-colors text-xs font-medium">
  <Trash2 size={14} /> Delete
</button>
```

### 5.5 Badge / Pill
```jsx
{/* Status badge — always use matching hue for text on colored bg */}
<span className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
  Active
</span>
```

### 5.6 Table
```jsx
<table className="w-full text-left border-collapse">
  <thead className="bg-gray-50/80 text-gray-600 text-sm">
    <tr><th className="px-6 py-4 font-medium">Column</th></tr>
  </thead>
  <tbody className="divide-y divide-gray-100 text-sm">
    <tr className="hover:bg-gray-50 transition-colors animate-fade-in-up stagger-N">
      <td className="px-6 py-4">...</td>
    </tr>
  </tbody>
</table>
```

### 5.7 Input Field
```jsx
<input
  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl
             focus:ring-2 focus:ring-primary focus:border-transparent
             outline-none transition-all shadow-sm"
/>
```

### 5.8 Modal / Dialog
```jsx
{/* Overlay */}
<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
  {/* Panel */}
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
    ...
  </div>
</div>
```

### 5.9 Dropdown Menu
```jsx
<div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl
                border border-gray-100 py-2 z-50 animate-fade-in-down origin-top-right">
```

### 5.10 Loading / Typing Indicator
```jsx
{/* Smooth pulse — NOT animate-bounce (removed as dated/tacky) */}
<div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
     style={{ animationDelay: '0s', animationDuration: '1.2s' }} />
<div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
     style={{ animationDelay: '0.3s', animationDuration: '1.2s' }} />
<div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
     style={{ animationDelay: '0.6s', animationDuration: '1.2s' }} />
```

---

## 6. Animation System

All keyframes are defined in [`tailwind.config.js`](./tailwind.config.js).
All utility classes are defined in [`src/index.css`](./src/index.css).

### 6.1 Keyframe Tokens

| Name | Behavior | Easing | Duration |
|---|---|---|---|
| `fade-in` | Opacity 0→1 | `ease-out` | 300ms |
| `fade-in-up` | Opacity 0→1 + Y+20→0 | `expo-out` | 450ms |
| `fade-in-up-slow` | Same, slower | `expo-out` | 650ms |
| `fade-in-down` | Opacity 0→1 + Y-12→0 + scale 0.97→1 | `expo-out` | 250ms |
| `scale-in` | Opacity 0→1 + scale 0.93→1 | `expo-out` | 300ms |
| `slide-in-right` | Opacity 0→1 + X+24→0 | `expo-out` | 400ms |
| `shimmer` | Background position sweep | `linear` | 1.6s ∞ |

### 6.2 Utility Classes

```css
/* Page-level entrance — use on root div of every page */
.page-enter { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }

/* Stagger delays for lists — add to nth child */
.stagger-1 { animation-delay: 60ms; }
.stagger-2 { animation-delay: 120ms; }
.stagger-3 { animation-delay: 180ms; }
.stagger-4 { animation-delay: 240ms; }
.stagger-5 { animation-delay: 300ms; }
.stagger-6 { animation-delay: 360ms; }

/* Card hover micro-lift */
.hover-lift { transition: transform 0.25s expo-out, box-shadow 0.25s expo-out; }
.hover-lift:hover { transform: translateY(-3px); box-shadow: 0 12px 32px -8px rgba(0,0,0,0.12); }

/* Shimmer skeleton loader */
.skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200%; animation: shimmer 1.6s linear infinite; }
```

### 6.3 Motion Library (AuthPage only)
`framer-motion` is used in [`AuthPage.jsx`](./src/pages/AuthPage.jsx) for multi-step form transitions:
- **Variant:** `{ hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -50 } }`
- **Easing:** `easeOut`, 400ms
- **Pattern:** `AnimatePresence mode="wait"` wraps all view states.

> All other pages use Tailwind CSS animations only. Do not import `framer-motion` into new pages.

### 6.4 Easing Philosophy
| Context | Easing | Why |
|---|---|---|
| Enter animations | `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) | Fast start, soft landing — feels physical |
| Exit animations | `ease-out` | Quick, non-distracting |
| Hover/micro | `0.25s ease-out` or `transition-all` | Immediate feedback |
| Loading spinner | `animate-spin` | Standard, universally understood |

> ⛔ **Anti-pattern removed:** `animate-bounce` — feels dated and elastic. Use `animate-pulse` with staggered delays for typing indicators.

---

## 7. Page Conventions

| Page | Entry animation | Key patterns |
|---|---|---|
| `HomePage` | `page-enter` | Hero banner `animate-fade-in-up`, stat cards `animate-fade-in-up stagger-N`, ArrowRight slides on hover (`group-hover:translate-x-1`) |
| `DashboardLayout` | — (persistent nav) | Dropdown uses `animate-fade-in-down origin-top-right` |
| `AdminPage` | `page-enter` | 4 stat cards `animate-fade-in-up stagger-1..4 hover-lift` |
| `DocumentPage` | `page-enter` | Header `animate-fade-in-up`, table rows `animate-fade-in-up stagger-N`, modal `animate-fade-in + animate-scale-in` |
| `ChatPage` | — | Sidebar `w-1/4`, chat bubble alignment by role |
| `AuthPage` | `framer-motion AnimatePresence` | Glassmorphism card, multi-step transitions |
| `ProfilePage` | — | Max-width `max-w-xl`, avatar with hover overlay |

---

## 8. Impeccable Audit Log

All issues found and resolved during `/impeccable audit` + `/impeccable polish`:

| File | Line | Anti-pattern | Status | Fix applied |
|---|---|---|---|---|
| `AdminPage.jsx` | 160, 167, 174, 181 | Side-tab border (`border-l-4`) | ✅ Fixed | Removed entirely |
| `AdminPage.jsx` | 292 | `text-gray-700 on bg-purple-100` | ✅ Fixed | Changed to `text-purple-800` |
| `AdminPage.jsx` | 418 | `text-gray-700 on bg-red-100` | ✅ Fixed | Changed to `text-red-800` |
| `ChatPage.jsx` | 196 | `animate-bounce` (dated) | ✅ Fixed | Replaced with staggered `animate-pulse` |

---

## 9. Do / Don't Quick Reference

| ✅ Do | ⛔ Don't |
|---|---|
| Use `hover-lift` on cards | Use `hover:shadow-md transition-all` alone (less polished) |
| Use `animate-fade-in-down` for dropdowns | Use plain `animate-fade-in` for dropdowns (no origin transform) |
| Use `stagger-N` on list items | Animate all items simultaneously |
| Use `animate-pulse` for loaders | Use `animate-bounce` (dated, tacky) |
| Use same hue family for text on colored bg (`text-red-800 on bg-red-100`) | Mix gray text on colored bg (`text-gray-700 on bg-red-100`) |
| Use full border on cards (`border border-gray-100`) | Use side-tab accent border (`border-l-4 border-l-*`) |
| Use `active:scale-[0.98]` on primary buttons | Leave buttons without press feedback |
| `page-enter` on every page root div | `animate-fade-in` directly (weaker, no translate) |
