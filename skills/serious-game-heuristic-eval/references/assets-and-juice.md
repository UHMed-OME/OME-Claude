# Assets & "Juice": Turning Findings into a Tiered Build List

Many heuristic failures in serious games — especially **Feedback**, **Immersion**,
**Status/Score**, and **Emotional Connection** — are fixed with concrete art, audio,
and UI assets. "Juice" (Jonasson & Purho, 2012) is the layer of small, immediate
feedback and delight that makes a system *feel* responsive: the difference between a
number changing and a number changing with a pop, a color shift, a sound, and a
reaction. Game feel (Swink, 2009) is the broader craft of responsive, legible
interaction.

The deliverable is a **tiered asset list ranked by ROI** — payoff per unit of build
effort — so the team builds the high-impact, low-cost items first. Always tie each
asset to the heuristic or need it remediates, so the list reads as fixes, not decoration.

## Tiering rubric

- **Tier 1 — highest ROI.** Removes the biggest *experiential* problems cheaply and
  unblocks the learning loop. Usually: making consequences visible (feedback/juice),
  making status legible, breaking up walls of text, and one emotional anchor (an
  avatar/role state). If a text-heavy game has silent outcomes, Tier 1 is mostly
  feedback + legibility.
- **Tier 2 — strong ROI.** Deepens feel and clarity: richer choice affordances,
  progress visualization, consequence framing, scene variety.
- **Tier 3 — polish & bookends.** Title/end screens, audio bed, cosmetic variety,
  optional customization. Real value, but only after Tier 1–2.

## Asset categories to consider

Character/role (state-reactive avatar tied to a key resource); resource/status icons
(replace emoji with consistent set + low-state variants); scene/background art (sets
place, breaks text); UI (stateful meters, choice cards with cost/affordance hints,
progress indicator); FX/animation (value pops, particle bursts, screen feedback —
the "juice"); screens (title, win, lose, consequence banners); audio (ambience,
select, gain/loss stings, end cues); reflection/debrief visuals for facilitated games.

## Columns to capture per asset

Priority (Tier), Category, Asset, Spec/Description, Format (SVG/PNG/WebP/Lottie/CSS/
audio), Suggested size, Qty, **Heuristic/need it addresses**, Game-feel payoff, and
**Source (license-friendly)** — a concrete place to get it plus its license. See
`asset-sources.md` for a vetted list (CC0 / permissive / CC-BY) and always record the
license so the team can ship without legal surprises.

## Style guardrail to include

Recommend ONE cohesive style and a palette that extends the game's existing UI; deliver
icons as SVG, illustrations as PNG/WebP, motion as CSS/Lottie to keep an embedded or
web build lightweight. Flag accessibility: don't encode resource identity in color
alone (colorblind-safe), maintain text contrast, keep tap targets adequate.
