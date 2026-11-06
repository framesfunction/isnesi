# ISNESI Design System

The rules this website's public pages follow. When a new page is added or an old
one is touched, apply these instead of inventing treatments. Reference
implementations: `src/components/public/kids-content.tsx` (cards, chips, art),
`src/components/public/story-card.tsx` (one-link cards),
`src/app/(public)/donate/page.tsx` (page shell).

## Brand tokens

Defined in `src/app/globals.css`; never hardcode hex values in components.

| Token | Meaning |
| --- | --- |
| `brand` / `brand-soft` | Primary deep blue; soft step for fills behind brand text |
| `leaf` / `leaf-soft` | Growth green; soft step for chip fills and calm panels |
| `coral` / `coral-soft` | Warm coral for action and alert moments |
| `sun` / `sun-soft` | Warm yellow for highlight CTAs and playful fills |
| `cream` | Warm page-tint background (body) |
| `ink` / `ink-muted` | Text colours on light backgrounds |
| `leaf-strong` (#1d6b35) / `coral-strong` (#c43e46) | AA-compliant (≥4.5:1) text/fill steps of leaf and coral |

## Contrast rules (WCAG AA)

- Small text on light fills uses `-strong` steps: `text-leaf-strong`,
  `text-coral-strong`. Plain `text-leaf` / `text-coral` are reserved for large
  display or decorative `aria-hidden` artwork (≥3:1 graphics).
- Small text on white/on-coral fills uses `text-ink`, never white on coral.
- White text only on `brand`, `leaf-strong`, or coral decorated with `text-ink`.
- Focus outlines stay the global amber (`#a35a00`); do not restyle per page.

## Page shell

1. `PageHero` — eyebrow (`text-leaf-strong`, uppercase tracking), `text-4xl`
   black title, muted description, optional breadcrumb, up to two actions
   (primary jump-link style, secondary outlined). One per page.
2. `Section` — one concern per section; title + description, consistent
   `py-14` rhythm, optional full-width band tint (`bg-sun-soft` et al.).
3. `CtaBand` — at most one per page, on Persuade pages (Home, About,
   Get involved, Donate, Partners, Kids' Corner, 404). Two actions; first is
   primary.

## Signature card

The single card recipe (Home, Impact, Stories, Partners, Kids' Corner, Contact
notes, Donate panels):

```
rounded-[1.75rem] border border-line bg-white
shadow-[0_12px_40px_rgba(24,36,67,0.06)]
transition-transform hover:-translate-y-1 focus-within:-translate-y-1
```

- Cards without links (data cards) may drop the hover lift but keep the frame.
- Decorative generative art may sit in a card header (`aria-hidden`, absolute
  shapes, `overflow-hidden`, group-hover scale). One field + one or two accents;
  colours follow the item's type (see chips).

## Chips and eyebrows

- One chip shape everywhere: `rounded-full px-3 py-1 text-xs font-black
uppercase tracking-[0.12em]` — only the tone changes by type
  (`STORY_TYPE_CHIP`, `KidsResourceCard`'s `TYPE_CHIP`).
- Eyebrows: `text-xs font-black uppercase tracking-[0.16em] text-leaf-strong`
  (see `PageHero`). Coral eyebrows are for alert-adjacent sections only.

## Buttons

- Primary: `bg-brand` pill with `shadow-[0_6px_0_var(--brand-strong)]` step;
  hover lifts, press flattens the shadow.
- Secondary: `border-2 border-line bg-white text-brand`, hover `bg-brand-soft`.
- Highlight (rare, e.g. CtaBand primary): `bg-sun text-ink` with stepped shadow.
- Reduce to `Button`/`buttonVariants` or the handwritten hero link pattern;
  never invent a third style.

## Empty states

`EmptyNote` (`empty-note.tsx`) is the only empty treatment: dashed frame, one
heading, one explanation, optionally a way onward. Never hide a section because
it is empty.

## Lists and pagination

- Story index pagination: `PublicPagination`, `?page=` param, clamped, server
  links; "Showing X–Y of Z" near the grid. No client fetching.
- Counts are honest and live ("5 organisations have recorded approval and
  public visibility"), never invented.

## Motion

- Hover lift: single `hover:-translate-y-1` on cards; arrows/icons may
  translate one step (`group-hover:translate-x-1`). No pulses, no parallax.
- Reduced motion respects browser settings via Tailwind defaults; avoid custom
  keyframes.

## Copy rules

- Say only what is recorded: age ranges, allocations, partner status, counts.
- When something is not yet available, say so plainly and offer the working
  path (Contact) instead of a disabled control.
- Sensitive topics (child safety, money) get their own panel, titled first,
  ordered last-but-visible.
