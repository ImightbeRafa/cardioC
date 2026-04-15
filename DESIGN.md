# Cardio Costa Rica — Design System

## Brand Essence
> "Tu salud cardiovascular, en buenas manos. Esto es serio, honesto y funcional."

**Emotional Territory**: Professional Medical + Approachable Pastel
**Target Audience**: Costa Rican adults 35–70 with hypertension risk, diabetes, family history of cardiovascular disease, or those already on blood pressure medication. Practical people who value honesty over marketing fluff.
**Design Philosophy**: Clean utility meets approachable warmth. Every element earns its place through function, not decoration. Soft pastel colors and gently rounded corners convey trust and professionalism — like a modern clinic that feels welcoming, not intimidating. The site should feel like walking into a clean, well-lit pharmacy: organized, trustworthy, calming.

---

## Typography

**Display Font**: DM Serif Display — elegant serif headlines that convey authority and trustworthiness. Used for hero headlines, section titles, and stat callouts. Weight: 400.

**Body Font**: DM Sans — clean geometric sans-serif, highly legible at all sizes. Used for body text, descriptions, form labels, navigation, buttons. Weights: 400 (regular), 500 (medium), 700 (bold).

Google Fonts import:
```
https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap
```

### Type Scale
- Hero headline: 3.2rem / 400 / -0.01em / 1.1 (DM Serif Display)
- Section headline: 2.5rem / 400 / 0 / 1.15 (DM Serif Display)
- Subheading/label: 0.8rem / 700 / uppercase / 0.08em (DM Sans)
- Card title: 1.25rem / 700 / 1.3 (DM Sans)
- Body text: 1rem / 400 / 1.65 (DM Sans)
- Small/caption: 0.85rem / 500 / 1.5 (DM Sans)
- Price display: 2.2rem / 700 (DM Sans)
- Button text: 0.95rem / 700 / 0.04em (DM Sans)
- Stat number: 3rem / 400 (DM Serif Display)
- Spec value: 0.95rem / 400 (DM Sans)

---

## Color Palette

### CSS Variables
```css
:root {
  /* Primary — Soft Medical Blue */
  --primary: #7FB3D3;
  --primary-dark: #5A9ABF;
  --primary-light: #B5D5E8;
  --primary-faint: #EDF5FA;

  /* Accent — Soft Coral/Rose */
  --accent: #E87E7E;
  --accent-hover: #D96A6A;
  --accent-light: #FDE8E8;

  /* Text */
  --text: #2D3748;
  --text-muted: #718096;
  --text-light: #A0AEC0;

  /* Backgrounds */
  --bg: #FFFFFF;
  --bg-alt: #F7F9FB;
  --bg-card: #FFFFFF;
  --bg-elevated: #EDF2F7;
  --bg-dark: #2D3748;

  /* Borders — thin and light */
  --border: #E2E8F0;
  --border-light: #EDF2F7;

  /* System */
  --white: #FFFFFF;
  --success: #68D391;
  --error: #FC8181;
  --warning: #F6C85F;

  /* Shadows — soft with blur */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.10);
  --shadow-accent: 0 0 0 3px rgba(127, 179, 211, 0.3);
  --shadow-red: 0 0 0 3px rgba(232, 126, 126, 0.3);

  /* Overlay */
  --overlay: rgba(45, 55, 72, 0.6);

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}
```

### Color Usage Rules
- Backgrounds alternate between `--bg` (#FFF) and `--bg-alt` (#F7F9FB).
- Blue (`--primary`) is for trust: informational CTAs, links, data elements, stats.
- Coral (`--accent`) is for urgency: "Comprar ahora", alerts, price highlights.
- Thin 1px borders in `--border` on cards, inputs, and containers.
- Footer and testimonials section use `--bg-dark` with inverted text.
- Subtle geometric shapes (circles, dots) at low opacity for background texture.

---

## Spacing System

**Base unit**: 8px

| Token | Value | Use |
|-------|-------|-----|
| --spacing-2xs | 4px | Tight icon gaps, badge padding |
| --spacing-xs | 8px | Inline element gaps |
| --spacing-sm | 16px | Card inner padding, form field gaps |
| --spacing-md | 24px | Between related elements |
| --spacing-lg | 32px | Between card groups, section sub-blocks |
| --spacing-xl | 48px | Between major elements within a section |
| --spacing-2xl | 64px | Section padding (mobile) |
| --spacing-3xl | 96px | Section padding (desktop) |

**Section vertical padding**: 96px desktop / 64px mobile
**Container max-width**: 1200px with 24px horizontal padding (mobile: 16px)

---

## Component Styles

### Buttons
- **Primary (Buy)**: `background: var(--accent)`, white text, `border: 1px solid var(--accent)`, `padding: 14px 36px`, `border-radius: var(--radius-md)`, `font-weight: 700`, `letter-spacing: 0.04em`, `font-family: DM Sans`
  - Hover: `box-shadow: var(--shadow-md)`, `transform: translateY(-1px)`, `background: var(--accent-hover)`
  - Transition: `all 200ms ease`

- **Secondary**: `background: var(--primary-dark)`, white text, same radius and sizing
  - Hover: `box-shadow: var(--shadow-md)`, `transform: translateY(-1px)`

- **Outline**: `background: transparent`, `color: var(--text)`, `border: 1px solid var(--border)`, same sizing
  - Hover: `background: var(--bg-alt)`, `border-color: var(--primary-light)`

- **Minimum touch target**: 48px height

### Cards
- Background: `var(--bg-card)`
- Border: `1px solid var(--border)`
- Border-radius: `var(--radius-lg)` (12px)
- Shadow: `var(--shadow-sm)`
- Padding: `24px`
- Hover: `box-shadow: var(--shadow-md)`, `transform: translateY(-2px)` — gentle lift
- Highlight variant: `background: var(--primary-faint)`, `border-color: var(--primary-light)`

### Form Inputs
- Height: `48px`
- Border: `1px solid var(--border)`
- Border-radius: `var(--radius-md)` (8px)
- Background: `var(--white)`
- Padding: `12px 16px`
- Font: DM Sans 0.95rem
- Focus: `box-shadow: var(--shadow-accent)`, `border-color: var(--primary)`
- Label: DM Sans 0.8rem / 700 / uppercase / `letter-spacing: 0.06em`
- Error: `border-color: var(--error)`, `box-shadow: var(--shadow-red)`

### Navigation/Header
- Position: `sticky` top
- Height: `72px`
- Background: `var(--bg)` with `box-shadow: var(--shadow-sm)`
- Logo: "Cardio Costa Rica" in DM Serif Display 1.25rem, "Costa Rica" in `var(--primary-dark)`
- Nav links: DM Sans 0.85rem / 600 / hover: `color: var(--primary-dark)`
- CTA in header: Coral button "Comprar" with `border-radius: var(--radius-md)`
- Mobile: hamburger → slide-down menu with soft background

### Section Labels/Eyebrows
- Font: DM Sans, 0.8rem, 700
- Text-transform: uppercase
- Letter-spacing: 0.08em
- Color: `var(--primary-dark)` or `var(--accent)`
- Margin-bottom: 16px

---

## Visual Rhythm Rules

1. **Alternating density**: Hero (spacious) → Stats strip (compact) → Benefits (medium bento) → Product (spacious) → Steps (compact) → Testimonials (spacious/dark) → Education (medium) → Order (dense) → CTA (compact) → Footer

2. **Background alternation**: White → Faint blue → Cream → White → Cream → Dark → White → Cream → Blue → Dark

3. **Soft visual separation**: Sections separated by background color changes and generous spacing rather than hard borders

4. **Typography hierarchy per section**: One DM Serif Display headline + body in DM Sans + supporting labels in DM Sans uppercase

5. **CTA repetition**: Buy CTA appears in Hero, Product, Order form, Final CTA = 4 opportunities

6. **Maximum text width**: Body text: 60ch. Headlines: 18ch.

7. **Subtle geometric patterns**: Low-opacity circles and shapes as section background accents for depth

---

## Photography & Imagery Direction
- Style: Product-on-white and product-in-use (wrist shots). Clinical, honest photography.
- Color temperature: Neutral to slightly cool
- Product images: White or light gray backgrounds, rounded corners (8px), thin borders
- Placeholder: `background: var(--bg-alt); border: 1px solid var(--border); border-radius: var(--radius-md);`

---

## Responsive Strategy
- Breakpoints: `480px`, `768px`, `1024px`, `1280px`
- Mobile-first: Yes
- Key changes: grids collapse to single column, fonts scale down, padding reduces from 96px to 64px

---

## Transitions & Motion

Clean and subtle — professional sites move gracefully.

- **Scroll reveals**: `fade-up` — translate 20px up, fade in. Duration: 400ms. One reveal per element.
- **Hover**: `translateY(-1px to -2px)` + shadow grows (200ms, ease)
- **Links**: color transition 200ms
- **Easing**: `cubic-bezier(0.2, 0, 0, 1)`
- **IntersectionObserver threshold**: `0.15`

---

## Design Principles (Do / Don't)

**DO**:
- Use gently rounded corners (6-12px) on all interactive elements
- Use soft blurred shadows for depth
- Use thin 1px borders in light gray
- Use subtle geometric background shapes at low opacity
- Keep typography clean and well-spaced
- Maintain pastel color harmony throughout

**DON'T**:
- Don't use hard/offset shadows
- Don't use thick black borders
- Don't use sharp 0px corners
- Don't use aggressive uppercase on everything
- Don't stack sections with identical backgrounds
- Don't use more than 2 animation types
