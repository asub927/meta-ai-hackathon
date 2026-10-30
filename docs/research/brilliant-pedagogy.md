# Brilliant.org: how it teaches, what the evidence says, and what we can use

*Researched Fri Oct 30, 2026 (ET). Brilliant's wording is paraphrased here, not copied.*

## 1. What Brilliant says it does

- **Do first, learn the rule second.** Brilliant gives you a problem before it teaches the method, so you try it first and get the procedure afterwards. It says its own testing supports this order. [About]
- **One idea per lesson, simplest version first.** A lesson starts with a picture, something you can drag or move, or a small sum, and builds from there to keep the load low. [About]
- **Instant, specific feedback** on every interactive problem. [About], [FAQ]
- **Scaffolds fade away.** Practice sets feel like low-stakes quizzes with no hints or visuals, so they show what you can do on your own. Brilliant is testing spaced review, mixed practice (interleaving) and "pick the next best problem". [About]
- **Koji tutor.** Koji asks rather than tells, never hands over the answer, and aims to become unnecessary over time. [About], [FAQ]
- **Lots of practice.** Brilliant aims for 20+ problems per concept, sets a difficulty ramp and includes edge cases. AI drafts puzzle variants and people review every one. [Blog]
- **Gamification on purpose:** streaks, leagues, XP and levels. Brilliant says content drives most of its retention and that it holds back on game incentives. [About]
- **Audience:** the main courses suit learners who are about 10 or older. A separate free K–5 practice library has no account. [FAQ], [K–5]

## 2. Independent evidence about Brilliant itself

The evidence is thin. I found **no randomised controlled trial and no peer-reviewed efficacy study with published results for Brilliant**.

- One small quasi-experiment from Colombia (de la Puente & Pérez) has 60 tenth-graders learning linear algebra, comparing Brilliant with video. The abstract is written in the future tense and gives no results. It appears in two journals (2023 and 2025) with the same abstract. [ERIC-2023], [ERIC-2025]
- A related 2024 paper reports on 70 eleventh-graders. I could only read its summary, not its results. [CGScholar]
- A teacher's fan site quotes the 2023 paper as finding "considerably higher final grades". I could not check that against the full text. It would still be one small, non-random study of older students. [Fan site]
- **The "6x more effective" claim** on Brilliant's site has no citation. It most likely traces to Koedinger et al. (2015), which studied adults in a psychology online course (MOOC), not Brilliant. That study was correlational: doing activities was linked to about 6x more learning per unit than watching or reading. [FAQ], [Koedinger]

**Bottom line:** Brilliant's design is well grounded in research, but there is no good evidence yet that Brilliant itself raises students' ability.

## 3. What the general research supports

| Idea Brilliant uses | Evidence |
|---|---|
| Active learning beats lecture | 225 studies: exam scores rose about 0.47 SD, and failure was 1.5x more likely under lecture (undergraduates). [Freeman 2014] |
| Try first, then teach (productive failure) | Meta-analysis: it helps conceptual understanding when done well (g ≈ 0.36). The studies are mostly older students and the effect depends on fidelity. [Sinha & Kapur 2021] |
| Worked examples | They help novices more than solving alone does, and fade as skill grows. This partly pulls against "try first" for beginners. [Sweller & Cooper 1985] |
| Retrieval practice and spacing | Being tested beats re-studying for long-term memory. [Roediger & Karpicke 2006] |
| Formative feedback | Specific, timely feedback that points to the task helps most. Vague or ego-focused feedback can hurt. [Shute 2008] |
| Step-level tutoring | Step-based tutoring systems came close to human tutors (0.76 vs 0.79 SD). [VanLehn 2011] Tutoring systems in 50 evaluations had a median effect of 0.66 SD. [Kulik & Fletcher 2016] |

**Caveats:** most of this research is on older students. Gains from tutoring systems shrink on standardised tests. No study I found looks at streaks as a way to improve learning for 7-year-olds.

## 4. Limits and criticism

- **Not built for young children.** The core courses start at fractions, so they aren't designed for a grade 2 learner. One parent noted their 8-year-old skipped the explanations. [FAQ], [Reddit]
- **Reviews are mixed on depth.** Some say the courses are shallow, a few answers are wrong or ambiguous, and the streak is the only reason to come back. [Substack], [HN]
- **Billing complaints.** Annual plans are set as the default, renewals are hard to notice, and refunds are refused. [Trustpilot], [Reddit] These are user reports, not verified facts.
- **Gamification.** Streaks and leagues are core features and Brilliant is testing ways to make sessions longer. That is fine for adults choosing to learn, but it is the wrong goal for young children.

## 5. What this means for our app

**Borrow:**
- Learn by doing and visual manipulation, with one idea per screen. This already fits Pip's Socratic flow and the "one idea per bubble" rule.
- Many varied problems per concept, with edge cases, generated and then checked by a person. This matches the M2 generator and validator.
- Fading scaffolds. Brilliant's practice without hints is the same idea as our mastery rule (three clean answers, first try, no hint).

**Avoid:**
- Leagues, any competition, "extend the session" mechanics and subscription nudges. The plan already bans leaderboards and dark patterns.
- Streak pressure. Keep our gentle streak with rest days.

**Fit with our tutor rules:** Koji's rule of "never hand over the answer" matches ours. Brilliant's "try before you're taught" matches our approach, where wrong answers play out as story consequences. For 7-year-olds, the research says to keep the worked-example rung, and our hint ladder already does.

**Concrete suggestions:**
1. **Pretest problem (M1, U12 content):** start each lesson with one "have a go" story before Pip teaches. Log it as a pretest event, not a score.
2. **No-hint check round (M4, U27/mastery):** finish each section with a short mixed set with no hint button, only on skills already marked mastered. This adds interleaving.
3. **Spaced review (M4, `progress/review`):** bring a mastered skill back after 1, 3 and 7 days, mixed with new work.
4. **Variant floor in the validator (M2, U13–U15):** require at least 20 checked variants per skill across at least 2 templates, including edge cases (carry, zero, near 100).
5. **Measure ability, not engagement (Stage A pilot):** track first-try accuracy and a delayed check 1 week later. Don't count streak length as a success metric.

**Unverified:** the full-text results of the Colombian studies, and Brilliant's internal A/B data, which it does not publish.

## Sources
- [About] https://brilliant.org/about/
- [FAQ] https://brilliant.org/faq/
- [K–5] https://brilliant.org/practice/
- [Blog] https://blog.brilliant.org/hand-crafted-machine-made/
- [ERIC-2023] https://eric.ed.gov/?id=EJ1394390
- [ERIC-2025] https://eric.ed.gov/?id=EJ1473924
- [CGScholar] https://doi.org/10.18848/1835-9795/cgp/v17i02/93-110
- [Fan site] https://brilliantintheclassroom.weebly.com/research.html
- [Koedinger] https://dl.acm.org/doi/10.1145/2724660.2724681
- [Freeman 2014] https://doi.org/10.1073/pnas.1319030111
- [Sinha & Kapur 2021] https://doi.org/10.3102/00346543211019105
- [Sweller & Cooper 1985] https://doi.org/10.1207/s1532690xci0201_3
- [Roediger & Karpicke 2006] https://doi.org/10.1111/j.1467-9280.2006.01693.x
- [Shute 2008] https://doi.org/10.3102/0034654307313795
- [VanLehn 2011] https://doi.org/10.1080/00461520.2011.611369
- [Kulik & Fletcher 2016] https://doi.org/10.3102/0034654315581420
- [Reddit] https://www.reddit.com/r/learnmath/comments/1lq1f24/brilliantorg_for_6_and_8_year_old/
- [Substack] https://cedarlila.substack.com/p/a-review-brilliant
- [HN] https://news.ycombinator.com/item?id=29881011
- [Trustpilot] https://www.trustpilot.com/review/brilliant.org?page=2
