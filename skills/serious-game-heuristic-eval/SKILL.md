---
name: serious-game-heuristic-eval
description: >-
  Run a structured, game-design heuristic evaluation of a serious or educational
  game and produce a written report, a scored checklist spreadsheet, and a tiered
  asset-recommendation list. Use this skill whenever the user wants to evaluate,
  critique, review, audit, or improve the DESIGN of a serious game, educational
  game, learning game, training simulation, gamified module, medical/clinical
  sim, empathy game, or persuasive/"newsgame" — whether it is a live web game, a
  prototype, a screenshot, or a design document. Trigger on phrases like "do a
  heuristic evaluation," "review this game from a game-design perspective,"
  "critique our training game," "is this learning game well designed," "evaluate
  our gamified course," or when the user shares a link/screenshot of an
  educational or training game and asks for feedback. Applies HEP, PLAY, the MDA
  framework, Bogost's procedural rhetoric, and self-determination theory, and is
  explicitly built for games whose goal is learning or behavior change, not pure
  entertainment.
---

# Serious Game Heuristic Evaluation

## What this skill is for

Serious games (educational, training, clinical, empathy, civic) are judged on two
axes at once: **does it play well?** and **does it teach the right thing?**
General usability review answers neither well. This skill walks a disciplined pass
through established game-design frameworks and produces three deliverables:

1. A **written evaluation** — strengths, issues ranked by severity, recommendations.
2. A **scored checklist spreadsheet** — every HEP/PLAY heuristic rated
   Pass / Partial / Fail / N/A with a note and severity, plus the procedural-rhetoric verdict.
3. A **tiered asset list** — concrete art/audio/UI assets ranked by game-feel ROI
   (Tier 1 = biggest payoff per unit effort), so the team knows what to build first.

The single most important idea: **usability heuristics cannot catch a rule system
that teaches the wrong lesson.** A serious game can be polished, juicy, and clear
while its incentive math quietly rewards the opposite of its learning goal. That is
why this skill pairs playability frameworks (HEP, PLAY) with a procedural-rhetoric
audit (does the mechanic make the intended argument?) and a motivation check (SDT).
Hold these in tension; do not let a clean usability pass lull you into approving a
game that mis-teaches.

## Workflow

### 1. Understand the game and its learning intent

Before judging anything, establish:

- **Learning objective / intended behavior change.** What should a player believe,
  feel, or do differently afterward? If the user hasn't stated it, ask — you cannot
  evaluate a serious game without it.
- **Audience and context** (e.g., first-year nurses, middle-schoolers, new managers)
  and whether it's facilitated or self-serve.
- **Stage** (concept, prototype/BETA, shipped) — early stages favor PLAY, which is
  designed for the concept phase.
- **The actual mechanics.** Play it if it's live; read the screenshots/design doc
  otherwise. Map the core loop: what the player sees, the choices offered, what each
  choice changes, the win and lose conditions, and the scoring.

If you can only partially access the game (e.g., an embed you can't fully drive, or
just an intro screen), say so plainly and scope the evaluation to what you observed.
Never imply you played the whole thing if you didn't. A real access limitation on
your end (e.g., automated clicks not reaching a nested frame) is YOUR limitation —
do not report it as a bug the game's players would hit.

### 2. Score against the playability heuristics

Walk `references/play.md` (primary — it's the refined, concept-phase-ready set) and
`references/hep.md` (the original four-category set). For each heuristic, assign:

- **Pass** — clearly satisfied.
- **Partial** — present but weak or inconsistent.
- **Fail** — absent or violated.
- **N/A** — doesn't apply to this game (e.g., humor in a bereavement sim; multiplayer
  in a solo game). Mark generously; forcing N/A heuristics produces noise.

Add a one-line note per heuristic citing the specific evidence. Assign a **severity
0–4** (Nielsen scale) to anything below Pass:

- 0 = not a problem · 1 = cosmetic · 2 = minor · 3 = major · 4 = catastrophic
  (blocks the learning goal or makes the game unplayable/unfinishable).

### 3. Run the MDA pass

Use `references/mda.md`. Work backward from the intended **Aesthetic** (the feeling/
realization the game wants) → the **Dynamics** that would produce it → whether the
**Mechanics** actually generate those dynamics. Most serious-game failures are an
MDA mismatch: the designer specifies a feeling but the mechanics produce a different
one (e.g., wants "hard tradeoffs," but one resource dominates so there's no tradeoff).

### 4. Run the procedural-rhetoric audit (the part nothing else catches)

Use `references/procedural-rhetoric.md`. State the game's **intended argument**, then
derive the **argument the rules actually make** from the incentive structure alone —
ignoring the text and art. Ask: *what is the dominant strategy, and what does winning
that way teach?* If a player can win by doing the opposite of the learning goal, the
game's procedural argument is broken no matter how good the prose is. This is usually
the highest-severity finding in a serious game; treat it as such.

### 5. Run the motivation check

Use `references/motivation-sdt.md`. Rate how well the design supports **autonomy**
(meaningful choice, not a single right answer), **competence** (clear, immediate,
fair feedback and a learnable curve), and **relatedness** (social/characters/stakes).
These predict whether players stay engaged long enough to learn.

### 6. Recommend assets by ROI tier

Use `references/assets-and-juice.md` and `references/asset-sources.md`. Translate the issues — especially Feedback,
Immersion, and Status/Score gaps — into a concrete, tiered asset list. Tier by
game-feel return on effort: Tier 1 assets remove the biggest experiential problems
cheaply; Tier 3 is polish. Tie each asset to the heuristic it addresses so the list
reads as remediation, not decoration. For every asset, name a **license-friendly source and its license** (CC0 /
permissive / CC-BY) from `asset-sources.md` so a non-artist team can ship it.

### 7. Produce the deliverables

Write the report using `assets/report_template.md`. Then assemble a `findings.json`
(schema in the script header) and run the workbook builder:

```bash
python3 scripts/build_eval_workbook.py findings.json <output_name>.xlsx
```

This emits a multi-sheet spreadsheet: Summary, Issues (by severity), HEP Checklist,
PLAY Checklist, Procedural Rhetoric, Motivation (SDT), and Asset Recommendations.
Present both the report and the spreadsheet to the user.

## Scoring philosophy

Be specific and evidence-based, not generic. "Goals heuristic: Fail — the intro
states how to earn tokens but never states the win condition; players cannot form a
strategy" is useful. "Could improve goal clarity" is not. Quote the game's own words
when they reveal intent vs. mechanics mismatch. Rank ruthlessly: a serious game with
ten cosmetic issues and one wrong-lesson incentive has one real problem.

## Frameworks at a glance (read the reference for detail)

- **HEP** (`references/hep.md`) — 4 categories: Game Play, Game Story, Game Mechanics,
  Game Usability. The original 2004 set; good broad coverage.
- **PLAY** (`references/play.md`) — refined 2009 set; 3 categories (Game Play; Coolness/
  Entertainment/Humor/Emotional Immersion; Usability & Game Mechanics). Built for the
  concept phase; this is your primary checklist.
- **MDA** (`references/mda.md`) — design backward from the intended emotion.
- **Procedural rhetoric** (`references/procedural-rhetoric.md`) — the rules are the
  argument; audit what they actually teach.
- **SDT** (`references/motivation-sdt.md`) — autonomy, competence, relatedness drive
  engagement; includes the serious-games evidence base for stakeholder buy-in.
- **Assets & juice** (`references/assets-and-juice.md`) — turning feedback/immersion
  gaps into a tiered asset plan.

## Sources

Full citations are in `references/sources.md` — include the relevant ones in any
deliverable so recommendations are defensible to a skeptical stakeholder.
