# Vision: the best open-source education app there is

Status: proposal for Anantha, Oct 28, 2026, revised the same evening with his first decisions (section 9). Decisions he has made are marked **Decided**; everything else is still a proposal. PLAN.md and STACK.md were updated to match the decided items. Facts about the outside world carry a link. Anything without a link is a **proposal** or marked **[Assumption]**.

## One-page summary

**Thesis.** A child should be able to learn math, then science, then reading and writing, from a patient mascot who asks instead of tells, who turns every wrong answer into a story worth watching, on any iPad or browser, offline, free, with nothing about the child ever leaving the device.

**What "best" means here** is six bars we can measure, not a slogan: proven learning gains, full accessibility, works fully offline, no data collected, broad standards-tagged content, and a contributor pipeline that adds lessons faster than a funded team can (section 1).

**Decided so far (Oct 28).** Code is **MIT**. Lessons, stories and other content are **CC BY-SA 4.0**. The mascot art is **CC0 1.0** (public domain) and the names stay generic and **trademark-free**. Subjects come in the order **math, science, English language arts**, each built one section at a time in the order of North Carolina's Standard Course of Study (NCDPI), starting with **grade 2 math**. **Read-aloud ships in M1.** The app is **English only** for now. Governance is **BDFL (Anantha) until M5**, then revisited. A legal home is **deferred**: this starts as a hackathon entry meant to continue beyond it, so no fiscal sponsor or entity yet. The **backend is deferred** until after the hackathon: for the hackathon everything runs and stays on the device.

**Moat.** Synthesis Tutor is paid, needs a cloud account and collects device ID, IP and geolocation ([Synthesis privacy](https://www.synthesis.com/privacy)). Its reviewers say kids run out of content in weeks and miss the old storytelling ([Trustpilot](https://au.trustpilot.com/review/www.synthesis.is)). We win on four things a closed company can't easily copy: an open content commons, story-as-feedback, privacy by architecture, and teacher authorship.

**Shape.** One subject-neutral Socratic engine, one story and motion engine, a mascot universe, and pluggable subject modules. Everything else, including rewards, streaks, review and dashboards, is a pure function over an append-only event log that stays on the device.

**Roadmap.** M0 harness, M1 one lesson on the web, M2 authoring and generator, M3 native SwiftUI iPad, M4 a full grade (NC grade 2 math) with rewards and the parent view, M5 open ecosystem and first pilot, M6 science and a rigorous efficacy study, M7 English language arts.

**What kills it.** Content never scales, no evidence that children learn, no one funds the maintainers, or one privacy slip. Each risk has a mitigation in section 8.

**No decisions remain open** (section 9). The legal home and Spanish are deferred, not decided.

---

## 1. Thesis and the six bars

The thesis is in the summary above. It turns into six measurable bars. The targets are **proposals** to argue about, not claims.

| Bar | What we measure | Proposed target |
|---|---|---|
| Learning evidence | Pre/post gains on transfer problems, with a comparison group | ESSA Tier 3 ("promising") study by M5. A study designed for Tier 1 by M6. Tier 1 needs a well-run RCT with at least 350 students and at least two sites ([WWC ESSA tiers](https://ies.ed.gov/ncee/wwc/essa)) |
| Accessibility | Automated axe checks, VoiceOver and Switch Control walkthroughs, read-aloud coverage | WCAG 2.2 AA ([W3C](https://www.w3.org/TR/WCAG22/)) on every screen. 100% of child-facing text can be read aloud. Touch targets at least 44 pt ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility)) |
| Offline | Network requests made during a full lesson, checked in CI | Zero. Every feature works in airplane mode |
| Privacy | Bytes leaving the device, third-party SDKs, App Store privacy label | Zero bytes, zero SDKs, label "Data Not Collected" |
| Content breadth | Standards tagged by at least one validated lesson | Grade 2 math in NCDPI order, then grade 2 science, then grade 2 ELA, then further grades. Each item has a source and licence record |
| Contributor velocity | Median days from teacher submission to a merged lesson, and the count of active external authors | Under 7 days. Growth in authors every quarter |

Craft bar on top: 60 fps on the oldest supported iPad, and Emil Kowalski's motion lint passes on every PR.

## 2. The moat against Synthesis and other funded apps

Synthesis has a live tutor voice, mastery gating and 35,000+ families ([Synthesis](https://www.synthesis.com/tutor)). Khan Academy Kids is already free with no ads ([App Store](https://apps.apple.com/us/app/khan-academy-kids/id1378467217)), so "free" alone is not a moat. Ours is the combination:

1. **Story as feedback.** A wrong answer is staged as if it were true, for example 33 stickers in a book that held 24, and the child sees the mismatch. Nothing is ever marked wrong. Synthesis does not publicly describe anything like this (COMPETITOR-SYNTHESIS.md §1), and no surveyed app animates the consequence of the child's own answer (COMPETITOR-LANDSCAPE.md §3, gap 2). Its users say the 2025–26 redesign lost the storytelling they liked ([Trustpilot](https://au.trustpilot.com/review/www.synthesis.is)), so this is the headline feature (Synthesis takeaway 1).
2. **An open content commons.** Every lesson is an open file with its source, licence and standards tags. Schools can fork it, translate it and fix it. A closed catalogue can't be forked.
3. **Privacy by architecture, not by policy.** **Decided: on-device only for the hackathon; backend deferred.** With no server there is nothing to breach, subpoena or sell. The privacy approach follows COPPA's spirit (no accounts, no personal data, nothing leaves the device); this is a design stance, not a claim of legal compliance. A district's privacy review gets shorter. **[Assumption]** That is an adoption advantage with schools.
4. **The only modern, permissive, offline kids' app.** The open options are offline but dated or unmaintained (GCompris, Kitkit), and none uses one permissive licence: GCompris is AGPL, PhET and OpenStax are non-commercial, and ScratchJr's EULA bans derivatives (COMPETITOR-LANDSCAPE.md §3, gaps 3–4). An MIT engine with no account and no server fills that gap. No commercial app gives parents a report that never leaves the device (gap 5).
5. **Teacher and community authorship.** An authoring tool plus a validator lets one teacher turn a public-school problem into a playable story. That attacks the "finished it in weeks" complaint ([Trustpilot](https://au.trustpilot.com/review/www.synthesis.is)) with a crowd, not with payroll.

## 3. Product pillars

1. **Socratic engine (subject-neutral).** The pure reducer `step(state, event, lesson)`, a misconception registry per subject module, and a fixed hint ladder: a smaller question, then a visual cue, then a worked example with different content. The answer never comes first. "How did you know?" follows each right answer. Math, then science, then English language arts plug in as modules that bring their own solver, detectors and validator rules. Science needs predict, observe and explain steps (for example, "what happens to the ice in the sun?", then watch, then record); its "play-out" stages the child's prediction. ELA mostly uses multiple choice and ordering (sequence the story events, pick the word), with read-aloud carrying the text.
   - **Hints before, walk-through after** (Khanmigo, [overview](https://ailearningtour.instructionpartners.org/products/khan-academy)): the ladder holds until the child commits, then Pip may walk the specific error step by step. Khan itself says a strict no-answer rule "needed more nuance" ([The Classroom](https://www.theclassroom.com/artificial-intelligence/khanmigos-no-answer-rule-when-questions-help-or-fail/)).
   - **Suggested-question chips** (Khanmigo, [learners](https://www.khanmigo.ai/learners)): "Why fewer?", "Show me", "A smaller one", so pre-readers can ask without typing.
   - **Never an answer engine.** Google's Socratic became the Lens "Homework" filter ([Engadget](https://www.engadget.com/google-lens-socratic-math-problems-102931355.html)). The answer never comes first, even if an AI is added later. If one is, it is grounded in the worked solution and the child's event log, as Khanmigo does ([overview](https://ailearningtour.instructionpartners.org/products/khan-academy)).
2. **Story and motion engine.** `BeatScript` data plays out the same on web (WAAPI) and on iPad (SwiftUI), as STACK.md sets out. Wrong-answer reactions (play-out, flip, count together) are reusable primitives that modules can call. Motion is transform and opacity only, uses `cubic-bezier(0.23,1,0.32,1)`, has no `scale(0)` entrances and respects reduced motion.
   - **Picture first, notation last** (DragonBox, [design notes](https://studyres.com/doc/14777607/dragonbox-algebra-12-)): stickers become numerals, then an equation. Every story **ends on the written equation**, because research found DragonBox players saw a matching game and transferred poorly ([JCAL](https://doi.org/10.1111/jcal.12798)). The story must *be* the explanation, not a wrapper (Prodigy's "lack of remediation", [complaint](https://fairplayforkids.org/wp-content/uploads/2021/02/Prodigy_Complaint_Feb21.pdf)).
   - **Concept-built manipulatives** (Duolingo's linked clock, [blog](https://blog.duolingo.com/duolingo-launches-math-app/)): for example, a number line linked to the sticker counters, so moving one moves the other.
   - **A no-failure free-play mode** later (Toca Boca, [Kidscreen](https://kidscreen.com/2014/02/20/toca-talks-why-freedom-is-best-for-kids-and-apps/)).
3. **Mascot universe (Decided: open source, no trademark).** Pip, Momo and Kiwi become a cast with fixed personalities and a rig contract (named SVG parts), so community stories stay on-model. The art is **CC0 1.0** (see section 4): anyone may use, remix and ship the characters, with no attribution needed. Kept playful and interesting for kids, with generic names. A **mascot per subject** in one shared world (Khan Kids: Ollo for phonics, Peck for numbers, [Play](https://play.google.com/store/apps/details?hl=en&id=org.khankids.android)): Pip leads math, and new open mascots join for science, then English language arts.
4. **Rewards tied to progress, not loot.** A chest opens only for evidence of learning: a mastered skill, a repaired misconception, a review done. It holds story content, such as a new episode, a mascot outfit or a world map piece. There are no random paid drops, no currency, no loss-framed streaks and no notifications pushing a child back in. The rules are pure functions over the event log, so they can be audited and tested.
   - **The chest hatches something from the lesson just finished** (Mathseeds' pet per lesson, [Mathseeds](https://readingeggs.com/apps/mathseeds/)), never random and never for sale. Synthesis unlocks games for progress and parents praise it for avoiding "endless badges" (Synthesis takeaway 5).
   - **One gentle streak across all subjects** (Duolingo, [blog](https://blog.duolingo.com/new-subjects/)), built into the shared core now, with rest days and **no leaderboards**. Duolingo removes leaderboards for child accounts ([Internet Matters](https://www.internetmatters.org/advice/apps-and-platforms/skills-building/duolingo/?utm=screenwise)).
   - **No haves and have-nots.** Prodigy drew an FTC complaint over members' avatars riding clouds while others walked in the dirt ([Fairplay](https://fairplayforkids.org/feb-19-2021-advocates-to-ftc-prodigy-math-game-preys-on-kids-and-families/)). Nothing is bought, ever.
5. **Kid, parent and teacher views in one app.** The child's view comes first. Behind an adult gate, parents see what was mastered, which misconceptions came up and what was repaired. A teacher mode (same app, same gate) shows a class roster kept on the device and exports a file. Nothing syncs.
   - **Exportable parent log** (Epic's CSV/PDF reading log, [help](https://support.getepic.com/hc/en-us/articles/115000867666); Prodigy's monthly report card, [help](https://prodigygame.zendesk.com/hc/en-us/articles/115001744726)): a weekly report generated on the device from the event log, which the parent can save, print or AirDrop. No server. Every parent dashboard in the survey lives in the cloud (COMPETITOR-LANDSCAPE.md §3, gap 5).
   - **Export and import** of the whole log as a file (ScratchJr's on-device projects with export and import, [FAQ](https://scratchjr.org/about/FAQ)) covers backup and moving to a new device.
   - **Future options, not plans:** device-to-device sync over the local network or by file (Kolibri's peer-to-peer sync, [docs](https://kolibri-dev.readthedocs.io/en/latest/backend_architecture/facility_syncing/)), and optional iCloud sync on iPad. Each would need its own privacy review and Anantha's yes. If sync is needed, first study how [Kolibri](https://learningequality.org/kolibri/about-kolibri/) (Learning Equality: offline-first, with optional sync to a school server, [sync docs](https://kolibri-dev.readthedocs.io/en/latest/backend_architecture/facility_syncing/)) works before designing any custom backend.
6. **Read-aloud, accessibility, dyslexia and multilingual support.** On-device speech only: AVSpeechSynthesizer on iPad, and Web Speech on the web filtered to voices with `localService = true`, because remote voices send text off the device ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)). Word highlighting, a dyslexia-friendly font option, adjustable spacing, and every string in locale files from day one (a cheap design choice; **the app is English only**, and Spanish is deferred with no timeline and no reviewer). Synthesis's reviewers praise its patient tutor voice, which makes voice table stakes for ages 5–7 (Synthesis takeaway 2); Khan Kids offers a "Read To Me" mode in English and Spanish ([Play](https://play.google.com/store/apps/details?hl=en&id=org.khankids.android)). Speech *input* waits, because Synthesis's beta mis-hears answers ([mobilestalk](https://mobilestalk.net/software/synthesis-tutor/)).
7. **Adaptive review from the event log.** Mastery gating, spaced review ("it's been three weeks since subtraction stories") and misconception follow-ups are all computed on the device as pure functions. The same log feeds rewards and dashboards, so there is one truth and no drift. This takes Synthesis's best feature, mastery gating and spaced review ([Synthesis](https://www.synthesis.com/tutor)), without a backend (Synthesis takeaway 3). **Mastery never drops after a single mistake within a session** and only fades gently over time, unlike IXL's SmartScore, which teachers say causes anxiety and tears ([petition](https://www.change.org/p/eliminate-the-stressful-smartscore-system-in-ixl-learning)).

## 4. Open ecosystem

- **An open lesson and story format.** Publish the Zod-derived JSON Schema as a versioned spec (say "Open Socratic Story 1.0") with conformance vectors. Other apps can then play our lessons, and we can play theirs.
- **Content packs** that teachers can fork and that install offline (Kitkit's offline bundle, [GitHub](https://github.com/XPRIZE/GLEXP-Team-KitkitSchool); Kolibri's importable library, [about](https://learningequality.org/kolibri/about-kolibri/)). A pack is a signed-off folder of lesson files, loaded by file import, not downloaded from a server. Scaling content is core, aimed at Synthesis's most common complaint, "finished it in weeks" (Synthesis takeaway 4).
- **Authoring tool for teachers.** Browser-based, offline, no account. Paste a problem and pick the standard, the solver fills the numbers, pick misconceptions, and preview the play-out live. It outputs a file and a pre-filled PR. An optional LLM draft (gateway only, authoring time only, never on the child's device) still passes the validator and a human review.
- **Contribution and review pipeline.** PR, then the validator, then a pedagogy review by a trained teacher reviewer, then an accessibility check, then merge. Lessons move from *community* to *reviewed* to *piloted* tiers, and the app shows only *reviewed* or better by default.
- **A content commons that tracks licences.** Every item records its source URL, licence, standards tags and its changes from the original. CI rejects any licence that isn't compatible. This matters now. IM K–5 first edition is CC BY 4.0, but IM v.360 is CC BY-NC 4.0 ([IM terms](https://illustrativemathematics.org/terms-of-use/)). Eureka Math/EngageNY is CC BY-NC-SA ([EdWeek](https://www.edweek.org/teaching-learning/fedex-targeted-in-open-educational-resources-lawsuit/2016/10)). **Decided: the standards set is North Carolina's Standard Course of Study (NCDPI)**, not Common Core IDs. NCDPI's site lets users download material "for non-commercial, educational purposes only" and says contents "may not be used for commercial purposes, without written permission" ([About DPI](https://www.dpi.nc.gov/about-dpi)); nc.gov allows non-commercial copying "without alteration" ([nc.gov terms](https://www.nc.gov/terms)). Our content is CC BY-SA 4.0, which allows commercial reuse, so **NCDPI standards text must not be copied into lessons**. We store the standard **ID** (e.g. `NC.2.OA.1`) plus our own short paraphrase and a link to NCDPI. Not legal advice, and not verified: whether the SCOS PDFs carry their own notice, whether NC public-records law changes this, and whether a short paraphrase needs permission; a written request to NCDPI (dpiwebmaster@dpi.nc.gov, per the About page) is the clean option if wanted. With content decided as CC BY-SA 4.0, the CI check accepts CC0, CC BY and CC BY-SA sources and rejects anything NC or ND.
- **Which NCDPI edition (flag).** The 2017 math SCOS is in force through 2027–28; the State Board adopted a **2026 K–12 math SCOS on Oct 1, 2026**, effective fall 2028, with NCDPI crosswalks ([NCDPI OTL](https://www.dpi.nc.gov/districts-schools/classroom-resources/office-teaching-and-learning), [Carolina Journal](https://www.carolinajournal.com/state-board-adopts-new-math-standards-drops-math-3-requirement/)). The 2026 ELA SCOS takes effect in 2027–28 (same NCDPI page). Science is the 2023 SCOS ([NCDPI science](https://www.dpi.nc.gov/districts-schools/classroom-resources/office-teaching-and-learning/standard-course-study/science/standard-course-study-supporting-resources)). **Proposal:** tag lessons with the 2017 ID now and add the 2026 ID from the crosswalk, so lessons stay valid when 2026 takes effect. I did not open the 2026 math document, so its grade-2 IDs and order are unverified.
- **Grade 2 math order (from the 2017 SCOS).** Operations and Algebraic Thinking (NC.2.OA.1–4), then Number and Operations in Base Ten (NC.2.NBT.1–8), then Measurement and Data (NC.2.MD.1–10), then Geometry (NC.2.G.1, G.3), as listed in NCDPI's vertical progression ([PDF](https://www.dpi.nc.gov/documents/publications/catalog/ma196-vertical-progression-math/open)). Content is built one section at a time in that order. **[Assumption]** "NCDPI order" means document order; I found no NCDPI-mandated pacing order.
- **The validator as the quality gate.** It enforces correct numbers, no digits in templates, no shaming words, the hint order, known misconceptions, reading level, bubble length, licence compatibility and motion lint. If the validator is good, a larger crowd can be trusted.
- **Governance and licences.**

| Asset | Status | Choice or options | Tradeoff |
|---|---|---|---|
| App and engine code | **Decided: MIT** | MIT for every repo the project owns | Short and widely understood. Unlike Apache-2.0, MIT has no explicit patent grant; accepted as the cost of simplicity. Every shipped dependency must be MIT-compatible (STACK.md §10) |
| Lessons, stories and content | **Decided: CC BY-SA 4.0** | Share-alike for every lesson, story, script and content pack | Derivatives stay open, so nobody can fork and close the commons. Third-party CC BY (and CC BY-SA) material can be adapted into it with attribution, e.g. IM K–5 first edition. Non-commercial (NC) sources such as IM v.360, Eureka Math, PhET sims and OpenStax **cannot** be included. Cost: some publishers and schools find share-alike harder to remix |
| Mascot names | **Decided: open, no trademark** | Nobody registers Pip, Momo or Kiwi | Anyone may ship an app with the characters. See the brand-confusion note below |
| Mascot art (SVG rigs, expressions) | **Decided: CC0 1.0** | Public-domain dedication | Maximum openness and zero reuse friction. Accepted cost: forks can reuse the art with no attribution |
| Decisions (governance) | **Decided: BDFL until M5, then revisit** | Anantha decides until M5. Build process: pstack throughout; All communication about this project goes through the Delivery Lead bot, with no direct side channels. The Scribe notes every decision and discussion (including voice calls) in `DECISIONS-LOG.md`. At M5, revisit, with a steering group of maintainers, a teacher seat and an accessibility seat as the leading option | Fast while the project is small (it starts as a hackathon entry). A steering group may earn school trust later, which is why M5 is the revisit point |

**Mascot art licence: the options that were weighed (CC0 chosen).**

| Option | What it allows | Upside | Downside |
|---|---|---|---|
| **CC0 1.0 (chosen)** | Anything, no attribution | Simplest; mascots can appear anywhere (stickers, worksheets, other apps) with no paperwork | No credit back to the project, and no "no endorsement" clause. A fork can present itself as the original with nothing in the licence saying otherwise |
| CC BY 4.0 | Anything, with attribution and a note of changes | Credit flows back to the commons. Its **No endorsement** clause (§2(a)(6)) says reuse doesn't imply the licensor endorses it, which gives a non-trademark hook against "official Pip app" claims ([legal code](https://creativecommons.org/licenses/by/4.0/legalcode.en)) | Remixes may be closed. Attribution is a small burden on schools |
| CC BY-SA 4.0 | Anything, with attribution, remixes under the same licence | Mascot remixes stay open. Matches the content licence (CC BY-SA 4.0), so one rule covers everything that isn't code | Friction for merch, printed workbooks and apps that mix the art with other licences |

Anantha chose CC0 because he doesn't need control over reuse and wants the mascots to spread. So the layers are: **code MIT, lesson content CC BY-SA 4.0, mascot art CC0 1.0.** CC0 neither grants nor waives trademark rights: "No trademark or patent rights held by Affirmer are waived, abandoned, surrendered, licensed or otherwise affected" ([CC0 legal code](https://creativecommons.org/publicdomain/zero/1.0/legalcode.en)). The project simply never registers or claims a mark, and keeps the names generic.

**Brand-confusion risk without a trademark.** Anyone can publish "Pip Math" to an app store, including a version with ads or data collection, and parents may not tell it apart. With no mark, the project has no legal tool to stop that. Proposed norms (social, not legal):
- **Fork naming convention** in `FORKS.md`: forks keep the characters but use their own app name, and say "based on [project] (link)" in the store listing and the About screen. Only builds from the main repo may use the project's own app name.
- **Verifiable official builds**: the README and the project site list the official store listings and release signatures, so anyone can check.
- **A courtesy credit line** in the art's metadata and the About screen. Under CC0 it is a request, not a requirement.
- **[Assumption]** "Not a trademark" also means the cast should not collide with someone else's mark or a bad association. A name-clearance search on Pip, Momo and Kiwi before M5 is proposed. "Momo" in particular shares a name with the widely reported "Momo challenge" hoax aimed at children ([Wikipedia](https://en.wikipedia.org/wiki/Momo_Challenge_hoax)), which may be worth a rename.

## 5. Funding and sustainability (options, not decisions)

The promise never changes: the app stays free, there are no ads, no data is sold or collected, and there is no paywall on learning content. Options that keep that promise:

1. **Fiscal sponsor or non-profit home: deferred.** The project starts as a hackathon entry with intent to continue, so no sponsor or entity is set up now. With no trademark to hold, a legal home only matters for taking money and grants. **Revisit trigger:** around M5, or earlier if a grant, donation or school partnership needs a legal recipient. Option then: a fiscal sponsor such as [Open Source Collective](https://www.oscollective.org/), without forming an entity.
2. **Foundation and public grants** for efficacy research and for content in under-served languages. **[Assumption]** Ed-research funders will want the evidence plan in section 6.
3. **Paid services, with free software.** Teacher professional development, district setup help, and custom lesson packs that land in the commons after a delay or at once.
4. **Printed companions.** Story workbooks generated from the open lessons, sold at cost plus a margin.
5. **Corporate sponsorship of a subject or language,** with credits and no influence over content.

Options **rejected**: ads, data sales, paid loot or chests, a "premium" content tier, selling access to the child, and time-gated or ad-supported free tiers (Epic's school-hours tier, [Epic](https://www.getepic.com/learn/epic-school-free-access-for-students-at-home/); SplashLearn's ads and billing complaints, [App Store](https://apps.apple.com/us/app/splashlearn-kids-learning-app/id672658828)).

## 6. How we prove it works

Not legal advice. Each item below needs a qualified review before any pilot.

- **Stage A, usability (M4).** 5–10 children per age band, with an adult present. Can they finish unaided, do they read the play-out, where do they stall. Paper notes only, no device data.
- **Stage B, pilot with a comparison group (M5).** Classrooms using the app compared with classrooms on their usual curriculum, with pre and post tests. Measures: gains on **transfer** problems (new stories, same skill), whether a misconception stays fixed after three weeks, how far up the hint ladder children go, and whether they keep playing voluntarily. Aim for ESSA Tier 3.
- **Stage C, rigorous study (M6).** An RCT designed with an independent evaluator for WWC standards: at least 350 students and at least two sites ([WWC](https://ies.ed.gov/ncee/wwc/essa)). Pre-register it and publish the results whatever they show.
- **Data path.** No backend (deferred until after the hackathon). Each device exports a de-identified event-log file, a teacher hands it over under signed consent, and the analysis runs offline. Report only groups of 10 or more children (PLAN.md M4 rule).
- **Ethics.** IRB or equivalent approval, parental consent and child assent, easy opt-out.
- **Regulatory notes (high level).**
  - COPPA governs collecting personal information from children under 13 online. The amended rule had a compliance date of April 22, 2026 ([Federal Register](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)). **[Assumption]** With no collection, the app itself carries a light load, but the pilot data path still needs review.
  - FERPA applies to education records held by schools ([studentprivacy.ed.gov](https://studentprivacy.ed.gov/)). Teacher exports are the sensitive point.
  - Apple's Kids Category bars third-party analytics and ads, with narrow exceptions ([guideline 1.3](https://developer.apple.com/app-store/review/guidelines/)). We already meet this by design.

## 7. Phased roadmap

| Phase | Builds | Exit criteria | Deliberately does NOT |
|---|---|---|---|
| **M0** Harness | Decisions D1–D5, MIT `LICENSE` in the monorepo, CI with a dependency-licence check, validator skeleton, conformance vectors, pstack verification skill | CI green, vectors run in Node and WebKit, decisions recorded | Ship any UI |
| **M1** One lesson, web | 5 Socratic problems from NC.2.OA.1 (the first grade 2 section) on the typed core, every story ending on the written equation, WAAPI motion, event log v1 in IndexedDB, **on-device read-aloud** (decided: in M1, PLAN.md U12a) | All paths pass Playwright on Chromium and WebKit, zero network calls, axe clean, Emil review approved | Rewards, dashboards, a second subject |
| **M2** Authoring and generator | Generator through the gateway, then the validator, then a human review. Deterministic preview video. First version of the authoring tool. Licence and source record on every lesson | 25 lessons validated. One non-engineer authors a lesson unaided | Open public contributions |
| **M3** Native iPad | SwiftUI app, JSC core bridge (Swift fallback), parity tests, SwiftData event log, AVSpeechSynthesizer read-aloud, log export and import | Vectors match byte for byte, 60 fps on the oldest target iPad, TestFlight build | Android, iPhone layouts, sync |
| **M4** A full grade | All NC grade 2 math standards, section by section in NCDPI order, chests tied to the lesson, one cross-subject streak, mastery and spaced review, parent and teacher views behind the gate with an exportable report, suggested-question chips, Stage A usability | Every NC grade 2 math standard has at least one reviewed lesson. Reward and mastery functions pass the no-dark-patterns tests. Usability findings fixed | Accounts, backend, any network path, leaderboards |
| **M5** Open ecosystem | Public spec 1.0, the authoring tool released, forkable content packs, contributor tiers, governance revisit (BDFL ends or continues), `FORKS.md` naming norm, mascot name clearance, legal-home revisit (fiscal sponsor or not), Stage B pilot | 10+ external authors, under 7 days to merge, pilot report published | Paid anything, science before the commons works |
| **M6** Science and proof | NC grade 2 science module (2023 SCOS), section by section, with its own mascot and predict/observe/explain interactions; Stage C study launched | The science module passes the same validator bar. Study pre-registered | ELA, a second human language, a runtime LLM on the child's device, collecting child data, sync (still only a future option) |
| **M7** English language arts | NC grade 2 ELA module (2026 SCOS), section by section, multiple-choice and ordering interactions, read-aloud carrying the text; further math grades | The ELA module passes the same validator bar | Spanish or any other language (deferred), sync |

## 8. Top risks and what kills the project

| # | Risk | Kills it? | Mitigation |
|---|---|---|---|
| 1 | Content doesn't scale, because each story is expensive | **Yes** | Reusable reaction primitives, the solver fills the numbers, generator plus authoring tool, and track hours per lesson as a metric |
| 2 | No evidence that children learn | **Yes**, for schools | Stage A–C plan, transfer measures, publish results honestly |
| 3 | Maintainers burn out with no funding | **Yes** | Legal home deferred, revisited at M5 (fiscal sponsor for donations and grants), services, and a small core with a big validator |
| 4 | A privacy slip, such as a stray SDK or a remote voice | **Yes**, for trust | CI asserts zero network calls, a dependency allow-list, local-only voices |
| 5 | Scripted Pip feels flat next to a live AI tutor, the "dry computer program" complaint Synthesis now gets ([Trustpilot](https://au.trustpilot.com/review/www.synthesis.is)) | Hurts | Large branching libraries per misconception, read-aloud with expressive mascots, story variety, suggested-question chips |
| 6 | A licence mistake taints the commons (an NC source, or NCDPI standards text copied into BY-SA content) | Hurts badly | Per-item licence record, CI compatibility check, NC sources banned |
| 7 | Two platforms drift apart | Hurts | One TS core, conformance vectors, BeatScript parity tests |
| 8 | Rewards turn into dark patterns (buyable rewards, haves and have-nots, loss-framed streaks) | Hurts the mission | Rewards only for progress, a written no-dark-patterns rule, tests over reward functions, no leaderboards ([Prodigy FTC complaint](https://fairplayforkids.org/feb-19-2021-advocates-to-ftc-prodigy-math-game-preys-on-kids-and-families/)) |
| 9 | Scores punish mistakes and cause anxiety ([IXL petition](https://www.change.org/p/eliminate-the-stressful-smartscore-system-in-ixl-learning)) | Hurts | Mastery only rises within a session and fades slowly; tested as a property of the mastery function |
| 10 | Game wrapper that doesn't teach, or weak transfer ([JCAL](https://doi.org/10.1111/jcal.12798)) | Hurts, for evidence | Every story ends on the written equation; Stage B measures transfer problems |
| 11 | Drift into an answer engine ([Engadget](https://www.engadget.com/google-lens-socratic-math-problems-102931355.html)) | Hurts the mission | Validator and reducer forbid the answer before the child commits, including in any future AI path |
| 12 | A look-alike app (ads or tracking) ships the open mascots and parents confuse it with the real one | Hurts trust | No trademark and CC0 art by decision, so: `FORKS.md` naming norm, a published list of official builds and signatures, a courtesy credit request |
| 13 | Without voice, children aged 5–6 who can't yet read are shut out (Synthesis risks) | Hurts reach | On-device read-aloud in M1 (decided) |

## 9. Decisions

**Resolved by Anantha on Oct 28, 2026 (all decisions in this document).**
1. **Code licence: MIT.**
2. **Content licence: CC BY-SA 4.0** for lessons, stories, Pip's scripts and content packs. Third-party CC BY content can be adapted in; NC-licensed sources cannot be included.
3. **Mascot art: CC0 1.0, names generic and trademark-free.** Chosen for maximum openness and playful reuse; forks may reuse the art without attribution, which is accepted. CC0 neither grants nor waives trademark rights, so the project simply never registers or claims marks.
4. **Backend deferred to after the hackathon.** For the hackathon the app is on-device only; STACK.md's Hono, Postgres and Keycloak plan is removed from the build. Privacy follows COPPA's spirit: no accounts, no personal data, nothing leaves the device (not a legal-compliance claim). File export and import are planned. If sync is needed later, study [Kolibri](https://learningequality.org/kolibri/about-kolibri/) (Learning Equality: offline-first, with optional sync to a school server, [sync docs](https://kolibri-dev.readthedocs.io/en/latest/backend_architecture/facility_syncing/)) before designing a custom backend. Progress storage options: `PROGRESS-STORAGE.md`.
5. **Governance: BDFL (Anantha) until M5, then revisit.**
6. **Standards and first grade: NC Standard Course of Study (NCDPI), grade 2, math first,** built one section at a time in NCDPI's grade 2 order, starting with NC.2.OA.1. Standards stored as IDs plus our own paraphrase. Lesson 1 is re-picked from that sequence (proposal below).
7. **Read-aloud ships in M1,** on-device voices only.
8. **Subject order: math, then science, then English language arts,** all from the NCDPI SCOS, section by section.
9. **Human language: English only for now.**

**Deferred (not decided), with revisit points.**
- **Legal home** (fiscal sponsor or non-profit entity). A hackathon entry meant to continue beyond it, so nothing is set up yet. Revisit around M5, or sooner if money or a partner needs a legal recipient.
- **Spanish (and any other language).** No timeline and no reviewer designated. Strings stay in locale files only because that cheap design choice was already planned.

**Still open:** none.

**Flag, not a decision:** which NCDPI math edition to tag first (2017 in force now, 2026 from fall 2028). Proposal in section 4: tag both via the crosswalk.

**Proposal: lesson 1 (NC.2.OA.1, 2017 SCOS), for Anantha's review.** One problem per problem type the standard lists ([vertical progression](https://www.dpi.nc.gov/documents/publications/catalog/ma196-vertical-progression-math/open)):
1. Take from, start unknown: Momo had some stickers, gave 9 to Kiwi, and has 15 left. How many at the start? (□ − 9 = 15, answer 24)
2. Add to, start unknown: Kiwi had some acorns, found 6 more, and now has 31. (□ + 6 = 31, answer 25)
3. Compare, bigger unknown: Kiwi has 18 shells; Pip has 7 more. (answer 25)
4. Compare, smaller unknown: Pip has 32 berries; Momo has 8 fewer. (answer 24)
5. Two-step, single digits: Momo has 7 stickers, gets 5, then gives 4 away. (answer 8)

The demo problem (24 − 9 + 5 = 20) stays as the demo. Its sums fit grade 2 fluency within 100 (NC.2.NBT.5), but NC.2.OA.1 limits *two-step* word problems to single digits, so as a two-step story it sits at the edge of the standard. That is why lesson 1 uses single digits for its two-step problem. Start-unknown and compare problems also need new shapes in the domain model (PLAN.md U4).
