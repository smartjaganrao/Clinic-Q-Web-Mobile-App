# SmartQFlow - World-Class Design System

## 🎨 Design Vision
A premium, minimal healthcare booking app inspired by Linear, Figma, and Vercel.

---

## **Component Architecture**

### **1. Header (Ultra-Minimal)**
- **Height**: 64px (h-16)
- **Layout**: Logo | Search (flex-1) | User Menu
- **Remove**: Locate Me, QR Check-in buttons (move to filters/mobile)
- **Search**: Full-width, centered, no distractions
- **User Menu**: Avatar dropdown only

### **2. Left Sidebar (Desktop Only, 256px)**
- **Show on**: lg: 1024px and above
- **Sections**:
  - **Navigation** (highlighted current tab)
  - **Filters** (Specialty, Distance, Availability, Fee, Rating)
  - **Quick Actions** (Locate Me, QR Check-in as compact buttons)
  - **Reset Filters button**
- **Style**: Clean, spacious, professional
- **Interaction**: Smooth hover states, active highlights

### **3. Main Content Area**
- **Max-width**: 1280px (max-w-7xl)
- **Padding**: Balanced spacing, not cramped
- **Grid**: 3-4 columns on desktop (responsive)
- **Cards**: Optimized for readability and action

### **4. Clinic/Doctor Cards (New Design)**
- **Height**: Auto (content-driven)
- **Structure**:
  ```
  ┌─────────────────────────────────┐
  │ [Logo] Clinic Name       ★ 4.8  │
  │        Address           (124)  │
  ├─────────────────────────────────┤
  │ Doctor 1  Doctor 2  Doctor 3    │
  │ (large avatars)                 │
  ├─────────────────────────────────┤
  │ ⏱ 15 min wait                   │
  │ 📍 2.5 km away                  │
  │ 💰 ₹500 consultation            │
  ├─────────────────────────────────┤
  │ [BOOK APPOINTMENT] [JOIN QUEUE] │
  └─────────────────────────────────┘
  ```
- **Key Info**:
  - Clinic name + logo (top)
  - Address truncated
  - Rating badge (top-right)
  - Doctor avatars (larger, 80px)
  - Key metrics (wait, distance, fee)
  - Prominent CTAs

### **5. Color Palette**
- **Primary**: `#2563eb` (Blue - trust, medical)
- **Success**: `#10b981` (Green - available, open)
- **Warning**: `#f59e0b` (Amber - wait time)
- **Error**: `#ef4444` (Red - closed, unavailable)
- **Neutral**: Slate 50-900 (professional grays)

### **6. Typography**
- **Font Stack**: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`
- **Headings**: Font weight 700-900, letter-spacing -0.02em
- **Body**: Font weight 400-500, line-height 1.5
- **Labels**: Font weight 600, size 12px, uppercase, tracking

### **7. Spacing System**
- **Header**: 16px padding
- **Sidebar**: 24px padding
- **Content**: 16px padding between cards
- **Internal Card**: 16px padding
- **Gap**: 24px between sections

### **8. Shadows & Depth**
- **Cards**: `shadow-sm` (0 1px 2px 0 rgba...)
- **Hover**: `shadow-md` (0 4px 6px -1px rgba...)
- **Modals**: `shadow-2xl` (0 25px 50px -12px rgba...)

### **9. Interactions**
- **Hover**: Subtle background color change, shadow increase
- **Active**: Highlight with primary color
- **Loading**: Spinner with animated border
- **Transitions**: 150ms cubic-bezier(0.4, 0, 0.2, 1)

---

## **Layout Breakdown**

### **Desktop (lg: 1024px+)**
```
┌────────────────────────────────────────────────┐
│ Header (64px)                                  │
├──────────────────┬──────────────────────────────┤
│ Sidebar (256px)  │ Main Content (max-w-7xl)    │
│                  │                              │
│ Navigation       │ Clinic Card Grid (3-4 col)  │
│ Filters          │                              │
│ Actions          │                              │
│                  │                              │
└──────────────────┴──────────────────────────────┘
```

### **Tablet (md: 768px)**
```
┌────────────────────────────────┐
│ Header (64px)                  │
├────────────────────────────────┤
│ Content (full-width)           │
│ Card Grid (2 columns)          │
│ Filters (collapsible)          │
│                                │
└────────────────────────────────┘
```

### **Mobile (< 768px)**
```
┌──────────────────┐
│ Header (64px)    │
├──────────────────┤
│ Tabs (scroll)    │
├──────────────────┤
│ Content (1 col)  │
│                  │
│ Filters (modal)  │
│                  │
└──────────────────┘
```

---

## **Component Variants**

### **Button Styles**
1. **Primary**: Solid blue, white text
2. **Secondary**: Outline, blue text
3. **Tertiary**: Ghost, subtle text
4. **Danger**: Solid red

### **Card States**
- **Default**: White background, subtle shadow
- **Hover**: Slight shadow increase, slight scale
- **Active**: Primary border, highlight
- **Disabled**: Opacity 50%, no interaction

### **Filter States**
- **Unselected**: Gray background
- **Selected**: Blue background, white text
- **Disabled**: Gray opacity

---

## **Responsive Breakpoints**
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1023px (md)
- **Desktop**: 1024px - 1279px (lg)
- **Large Desktop**: 1280px+ (xl)

---

## **Micro-interactions**
1. **Search Focus**: Input expands slightly, shadow increases
2. **Card Hover**: Shadow grows, subtle scale
3. **Button Click**: Ripple effect, scale down slightly
4. **Filter Change**: Cards re-render with subtle fade
5. **Modal Open**: Blur background, slide-in animation

---

## **Accessibility Requirements**
- WCAG AA compliant
- Proper color contrast (4.5:1 minimum)
- Keyboard navigation support
- Screen reader labels
- Focus indicators visible
- No motion sickness triggers

---

## **Performance Targets**
- Lighthouse: 90+
- First Paint: < 1s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- Card rendering: Virtualized for 100+ items

---

## **Implementation Phases**

### **Phase 1: Header & Sidebar** ✅ (Current)
- Ultra-minimal header
- Left sidebar with navigation and filters
- Clean, premium styling

### **Phase 2: Cards Redesign** (Next)
- New card hierarchy
- Better visual design
- Larger doctor avatars
- Prominent CTAs

### **Phase 3: Interactions** (Following)
- Micro-interactions
- Smooth transitions
- Loading states
- Empty states

### **Phase 4: Polish & Optimization** (Final)
- Dark mode support
- Performance optimization
- Accessibility audit
- Cross-browser testing

---

## **Design Tokens** (Tailwind Config)

```json
{
  "colors": {
    "primary": {
      "50": "#eff6ff",
      "600": "#2563eb",
      "700": "#1d4ed8"
    },
    "slate": {
      "50": "#f8fafc",
      "100": "#f1f5f9",
      "600": "#475569",
      "900": "#0f172a"
    }
  },
  "spacing": {
    "header": "64px",
    "sidebar": "256px",
    "gap": "24px",
    "radius": "8px"
  }
}
```

---

Generated: 2026-06-04 | Version: 1.0
