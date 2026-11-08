---
target: src/app/(public)/page.tsx
total_score: 21
max_score: 28
na_heuristics: 7,9,10
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\VENTIZ\\apps\\ISNESI\\src\\app\\(public)\\page.tsx"
target_fingerprint: "sha256:8f57126224a81c7a20ffab5e399502ed6e408846fa181207c5f175b3161e556e"
target_path: "C:\\Users\\VENTIZ\\apps\\ISNESI\\src\\app\\(public)\\page.tsx"
timestamp: 2026-11-07T20-32-21Z
slug: src-app-public-page-tsx
closed: true
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live counts with "not projections" disclaimer; honest empty states; no loading/progress feedback (SSR-fast, acceptable) |
| 2 | Match Between System / Real World | 3 | Plain, dignity-centred copy; "OPDs" acronym unexplained |
| 3 | User Control and Freedom | 3 | Clear header/footer nav, back links, no forced modals |
| 4 | Consistency and Standards | 3 | Follows DESIGN.md (cards, chips, CtaBand, Section, EmptyNote); hero is inline not `PageHero` component; motion scales differ (cards `-translate-y-1`, hero CTAs `-translate-y-0.5`) |
| 5 | Error Prevention | 3 | Honest empty states prevent confusion; no destructive actions on homepage |
| 6 | Recognition Rather Than Recall | 3 | Icons are decorative (`aria-hidden`) with text labels; visible navigation |
| 7 | Flexibility and Efficiency | n/a | Persuade landing page — no power-user path expected |
| 8 | Aesthetic and Minimalist Design | 3 | Clean palette but hero has 4 decorative blobs + 2 emoji callouts competing with primary CTA |
| 9 | Error Recovery | n/a | No error-prone actions on homepage |
| 10 | Help and Documentation | n/a | Persuade surface — no documentation needed |
| **Total** | | **21/28** | **Good** (75%) |

Applicable maximum: 28 (3 heuristics scored n/a). 21/28 = 75% → Good band (70%+).

## Design Specificity Verdict

**LLM assessment:** The homepage feels authored for ISNESI, not category-interchangeable. The disability-forward framing ("Disability is part of human diversity", "keeping each child's dignity at the centre") is specific and wouldn't transfer unchanged to an unrelated product. Custom illustration components (`GrowingBookIllustration`, `KidsPlayingIllustration`), honest live counts ("Counts reflect what is published on this website today, not projections"), and the generative-art blob backgrounds are distinctive product character.

However, several structural choices are category-standard nonprofit patterns: hero with eyebrow + headline + two CTAs, stat bar, three-column feature grid, "ways to help" cards. The hero's four overlapping decorative blobs plus two absolute-positioned emoji callouts add visual noise that dilutes the primary CTA ("Explore our work").

**Deterministic scan:** `impeccable detect --json` returned `[]` — no findings. Exit code 0 (clean). No false positives to flag; nothing the detector caught that the review missed, because the detector found nothing.

## Overall Impression

What works: honest, trust-building metrics; dignity-centred copy that belongs to ISNESI specifically; consistent design-system application. What doesn't: the hero is visually overcrowded, and emoji in CTAs clash with the professional disability-forward tone. The single biggest opportunity: simplify the hero to let the primary CTA and the product's specific voice breathe.

## What's Working

1. **Honest, live counts.** The stat bar shows `Active programmes` and `Approved partners` with an explicit "Counts reflect what is published on this website today, not projections" disclaimer — this builds trust and matches DESIGN.md's copy rule ("Counts are honest and live").
2. **Product-specific voice.** Copy like "Disability is part of human diversity" and "Inclusion is built with communities, not delivered to them" is authored for ISNESI, not lifted from a nonprofit template.
3. **Design-system consistency.** Signature cards (`rounded-[1.75rem] border border-line bg-white` with hover lift), chips (`rounded-full px-3 py-1 text-xs font-black uppercase`), `Section`, `CtaBand`, and `EmptyNote` all follow `DESIGN.md`. Empty states are never hidden.

## Priority Issues

**[P1] Hero visual clutter competes with the primary CTA.** Four overlapping decorative blobs (`bg-brand-soft`, `bg-brand-soft/80`, `bg-sun-soft`, `bg-leaf-soft`), two absolute emoji callouts ("Big dreams belong here!", "Everyone is welcome 🌍"), plus a ✳ character, surround the headline. The primary action ("Explore our work") has to fight for attention. Fix: remove 2–3 blobs and both emoji callouts; keep one soft background shape if needed. Suggested command: `$impeccable quieter` on the hero section, or `$impeccable layout` to re-establish hierarchy.

**[P2] Inconsistent tone: emoji mixed with professional disability-forward copy.** CTAs use "Make a difference 🧡" and the Kids' Corner callout uses "Everyone is welcome 🌍", while the rest of the copy is plain and dignified. This tonal whiplash undermines the product's specific voice. Fix: remove emoji from CTAs and callouts; keep the playful energy through color and illustration instead. Suggested command: `$impeccable quieter` or `$impeccable clarify` to align microcopy with tone.

**[P3] Newsletter signup outcome not communicated.** The bottom "Good news in your inbox" section has a `NewsletterForm` but no microcopy about what happens after signup (confirmation email, double opt-in per the specs, unsubscribe anytime is mentioned but the post-submit flow isn't). First-time visitors (Jordan) won't know what to expect. Fix: add one line of post-submit expectation copy near the form. Suggested command: `$impeccable clarify`.

**[P2] Unexplained acronym "OPDs".** The "Partner with us" card says "Schools, NGOs, OPDs and businesses co-deliver inclusion that lasts." "OPDs" (Organizations of Persons with Disabilities) is sector jargon a first-time visitor won't know. Fix: spell it out or replace with a familiar term. Suggested command: `$impeccable clarify`.

## Persona Red Flags

**Jordan (Confused First-Timer):** Lands on homepage, reads "OPDs" in the Partner card and hesitates — it's unexplained sector jargon. Sees emoji callouts ("Everyone is welcome 🌍") that read as decorative rather than informational. Subscribes to the newsletter but gets no confirmation of what happens next. Will likely abandon at the newsletter step without clear next steps.

**Sam (Accessibility-Dependent User):** Focus outline is the global amber `#a35a00` (good) and a skip link exists (good). Decorative art is `aria-hidden` (good). However, `🌍` emoji appears as visible content without an accessible label, and `🧡` in "Make a difference 🧡" is part of a CTA label — screen readers will read "Make a difference heart emoji" which adds noise. Contrast is WCAG AA compliant per the token system.

**Casey (Distracted Mobile User):** Primary CTAs are in the hero near the top — reachable but the bottom newsletter form is in the thumb zone (good). Page is lightweight (no heavy assets beyond illustrations), works on slow connections. State isn't relevant on a marketing landing page.

## Minor Observations

- Hero uses an inline `PageHero`-like pattern (eyebrow, `text-5xl`/`text-6xl` title, muted description, two actions) but not the `PageHero` component from `DESIGN.md`. Minor inconsistency worth consolidating.
- Hero CTAs use `hover:-translate-y-0.5` while cards use `hover:-translate-y-1` — inconsistent motion scale across the page.
- `👋` is `aria-hidden` but `🌍` is visible content — inconsistent emoji treatment.
- Partner logo links open in `target="_blank"` with `rel="noopener noreferrer nofollow"` but no visual indicator that they leave the site.

## Questions to Consider

- "What if the hero had one background shape instead of four, and zero emoji callouts — would the primary CTA finally breathe?"
- "Does this need to feel this playful? The disability-forward copy is serious and dignified; emoji undercut that."
- "What happens two seconds after someone hits subscribe on the newsletter?"
