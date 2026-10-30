# Mascots in the math app: how they fit, and how to keep kids focused

*Draft for Anantha, Fri Oct 30 2026. Research plus a proposal. Nothing is built, nothing is sent.*

## The short answer

Cute characters can help, but only when they do a job in the lesson. The research is clear that pretty extras that don't teach pull young kids away from the maths. So: **one fixed narrator, Pip, asks every question. The other animals are only the actors in the story problem.** They never give hints, never talk over the question, and never move while the child is thinking.

## What the research says

**Extras that don't teach usually hurt.** A meta-analysis of 58 studies found "seductive details" (interesting but not needed) lower learning, by a small-to-moderate amount (g = −0.33). The harm was bigger when learners couldn't control the pace [1]. Harp and Mayer found the damage comes partly from steering learners towards the wrong idea of what the lesson is about [2].

**Young kids are especially easy to distract.** Kindergarteners in a heavily decorated classroom spent more time off task (38.6% vs 28.4%) and scored lower (42% vs 55%) than in a plain room [3]. That was only 24 children, in a lab. For maths in particular, 6–8-year-olds who learned bar graphs with countable pictures in the bars often counted the pictures instead of reading the bar height [4]. **This matters most for us. A cute animal must never be something a child could count by mistake.**

**On-screen characters give a small boost, and how they look matters less than what they do.** Agents produced a small learning gain (g = 0.19, 43 studies), larger for K-12 and maths/science [5]. A later meta-analysis also found a small gain (g = 0.20). 2D beat 3D, and motion and gestures did *not* reliably add learning [6]. Reviews call the results mixed and many early studies weak, often with no proper control group [7][8]. The original "persona effect" was about how students *felt* (encouraged, trusting), not how much they learned [9]. Gestures and gaze that point at the right thing help [10]. That supports Pip's "thinking, pointing at the cue" state, not decorative motion.

**Stories and context can help, if they serve the problem.** Fourth and fifth graders learned arithmetic better with a meaningful fantasy context, personal touches and small choices [11]. Story problems matched to students' interests helped struggling learners most, but could distract strong students on easy problems [12].

**Interactive extras in kids' e-books distract.** Animation and sound that match the story helped a little. Hotspots and games did not help and seemed to overload children [13]. In the four pillars of good apps (active, engaged, meaningful, socially interactive), "engaged" means engaged *with the learning goal*, not with side features [14].

**Fantastical, fast media can tire young kids' self-control.** In 4-year-olds, a fast fantastical cartoon lowered executive function right afterwards [15]. A follow-up pointed to the fantastical content more than the pace [16]. This was passive TV, not short app scenes, so it is only a caution.

**Real animals vs fantasy.** Preschoolers learned fewer real animal facts from books with talking animals in clothes [17]. Our animals wear school gear, so they are still anthropomorphic. Any animal fact in a story ("kiwis can't fly") must be true.

**What I could not find:** any study on *randomly changing* story characters in a kids' maths app, or a direct test of real versus fantasy animals for learning maths. Those parts are my reasoning, not evidence.

## Recommendations

**1. Role split**
- **Pip (barn owl), narrator, always there.** Pip asks every question, shows every hint, and carries the feelings through expression states only.
- **Story cast (Momo, Kiwi, toucan, fox, elephant, turtle, hedgehog, macaw).** They appear only as `hero` and `friend` in the problem scene. They never appear in the bubble, hint or answer area, and they never say a hint or an answer.
- **Random casting happens between problems, never during one.** The same cast stays through a problem and all its hints. Hints already use a different story, so they may use different animals.

**2. Focus rules**
- **While a question waits for input,** nothing animates except Pip's "patient" blink and nod. At most one moving element is near the input.
- No character speech or sound overlaps Pip's question.
- A celebration lasts under 2 s (already a rule).
- Reduced motion keeps the state and drops the movement.
- Characters are never countable objects, and they never sit inside the counting area.
- Keep the animals in flat 2D and use the same pose library for all of them.

**3. Measuring it, on the device** (from the existing `LocalEvent` log, nothing leaves the iPad)
- **Time to first action** after a problem appears.
- **Hint rate and first-try accuracy**, compared by cast member.
- **A "Calm mode" toggle behind the parent gate** that swaps story animals for plain objects. With a few kids, comparing calm mode against normal mode gives a rough signal, not proof.

**4. Validator and test additions** (in the style of U4, U8 and U27)
- **Cast lint:** narrator id is `pip`, and `hero` and `friend` come only from the story cast.
- **Line lint:** no story-character lines in `say`, hint or explain.
- **BeatScript lint:** no story-cast keyframes while input is awaited, and celebrate is 2000 ms or less.
- **Playwright WebKit iPad check:** story-character boxes never overlap the input or counter zone, in both orientations.
- **Animation budget check:** at most one animated node within 120 px of the input. Only transform and opacity are animated.

**5. Phasing (needs a decision-log entry)**
- **The plan now says** "Two mascots and one narrator … No new species until science," with `species: "puffbun" | "leafcat"`.
- **Minimal change for M1:** keep the same count (Pip plus Momo and Kiwi) but make them real species. Add a `role: "narrator" | "story"` field. The other six wait until M4 behind the cast lint, which needs an amendment to the decision log.

**6. Licensing**
- **AI images may not be protected by copyright.** US law requires a human author, and prompts alone don't count [18][19]. So a CC0 licence on the AI sketches means less than it would on human-made art.
- **Recommendation:** use the sketches only as reference. Have a person redraw each character as an original, hand-authored layered SVG, then mark that as CC0.

## Sources
1. Sundararajan & Adesope 2020 — https://doi.org/10.1007/s10648-020-09522-4
2. Harp & Mayer 1998 — https://doi.org/10.1037/0022-0663.90.3.414
3. Fisher, Godwin & Seltman 2014 — https://doi.org/10.1177/0956797614533801 ; https://www.psychologicalscience.org/news/releases/heavily-decorated-classrooms-disrupt-attention-and-learning-in-young-children.html
4. Kaminski & Sloutsky 2013 — https://doi.org/10.1037/a0031040
5. Schroeder, Adesope & Gilbert 2013 — https://doi.org/10.2190/EC.49.1.a
6. Castro-Alonso et al. 2021 — https://doi.org/10.1007/s10648-020-09587-1
7. Heidig & Clarebout 2011 — https://doi.org/10.1016/j.edurev.2010.07.004
8. Schroeder & Adesope 2014 — https://doi.org/10.1080/15391523.2014.888265
9. Lester et al. 1997 — https://doi.org/10.1145/258549.258797
10. Mayer & DaPra 2012 — https://doi.org/10.1037/a0028616
11. Córdova & Lepper 1996 — https://doi.org/10.1037/0022-0663.88.4.715
12. Walkington 2013 — https://doi.org/10.1037/a0031882
13. Takacs, Swart & Bus 2015 — https://doi.org/10.3102/0034654314566989
14. Hirsh-Pasek et al. 2015 — https://doi.org/10.1177/1529100615569721
15. Lillard & Peterson 2011 — https://doi.org/10.1542/peds.2010-1919
16. Lillard et al. 2015 — https://doi.org/10.1037/a0039097
17. Ganea, Canfield et al. 2014 — https://doi.org/10.3389/fpsyg.2014.00283
18. Thaler v. Perlmutter, D.C. Cir. 2025 — https://media.cadc.uscourts.gov/opinions/docs/2025/03/23-5233.pdf
19. US Copyright Office, AI Part 2 report, Jan 2025 — https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf
