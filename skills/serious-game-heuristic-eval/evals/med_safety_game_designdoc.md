# Design Doc — "MedSafe Rush" (prototype)

**Audience:** First-year nursing students.
**Goal:** Teach safe medication administration (the "five rights": right patient, drug,
dose, route, time) and a culture of double-checking.

**Core loop:** A simulated med-pass shift. Each round a patient order appears. The player
taps the correct medication, dose, and patient from a tray as fast as possible.

**Scoring:** Points = base 100 per correct administration, multiplied by a speed bonus
(faster = more points). A combo meter rewards consecutive correct taps without pausing.
Wrong taps lose 25 points. A 60-second timer per shift; clear as many orders as possible.

**Progression:** 5 levels; each level adds more patients and a tighter timer. A
leaderboard ranks students by total points.

**Feedback:** Correct = green flash + ding. Wrong = red flash. No explanation is shown
for why an answer was wrong; the next order appears immediately.

**Onboarding:** A 6-paragraph rules screen explains scoring before play.

**Art/audio:** Placeholder emoji for meds; default system font; no sound except the ding.
