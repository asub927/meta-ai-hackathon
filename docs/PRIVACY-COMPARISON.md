# Privacy comparison: Synthesis Tutor vs Khan Academy Kids

Researched 28 Oct 2026 (ET), from public pages only. I did not install or use either app. Quotes are short and linked. Anything marked **(inference)** is my reading, not a stated fact. This is not legal advice.

**Documents seen**
- Synthesis: [Privacy Policy](https://www.synthesis.com/privacy), [COPPA Policy](https://www.synthesis.com/coppa) and [Subprocessor List](https://www.synthesis.com/subprocessors), all "Last updated: June 10, 2026". Also the [Terms](https://www.synthesis.com/terms), the [App Store listing](https://apps.apple.com/us/app/synthesis-math-tutor-for-kids/id6448335635) (v3.9.2, Aug 7) and the [Play data safety page](https://play.google.com/store/apps/datasafety?id=com.synthesis.tutor) (app updated May 8, 2026).
- Khan Academy Kids: [Kids Privacy Policy](https://www.khanacademy.org/kids/privacy-policy), "Last Updated: December 28, 2023". Also the [App Store listing](https://apps.apple.com/us/app/khan-academy-kids/id1378467217) (v9.0.2, Sep 30), the [Play data safety page](https://play.google.com/store/apps/datasafety?id=org.khankids.android) and help articles on [accounts](https://khankids.zendesk.com/hc/en-us/articles/360006537272-How-do-I-set-up-an-account) and [offline use](https://khankids.zendesk.com/hc/en-us/articles/360006764812). Khan Academy's main policy says the Kids app "is governed by a different" policy, so I used the Kids policy. I did not read the Kids Terms of Use.

## Synthesis Tutor (for-profit, paid subscription, ages 5–11)

- **Data from the child:** the parent supplies the child's first name or nickname and age or grade. The service then collects "problems attempted, answers provided, time spent… assessment results", session frequency and duration, plus IP address, browser and device details (COPPA Policy).
- **Data from the parent:** name, email, time zone and billing details (cards are held only by Stripe). The general policy also lists geolocation.
- **Accounts:** a parent account is required. "No one under age 18 may create an account." There is no guest mode that I could find. The landing page offers a free trial with "No credit card necessary".
- **COPPA and consent:** verifiable parental consent through "Credit card verification", parent email verification, and click-through consent. **(inference)** It is unclear how the card check applies to free-trial accounts that need no card.
- **Retention:** child data is kept for "the duration of the child's active service plus 30 days", or deleted sooner if a parent asks. IP and browser data is kept up to 1 year, and backups "may persist". Parents request changes or deletion by emailing questions@synthesis.com, with a reply within 30 days.
- **Where progress lives:** on servers. The subprocessor list names AWS RDS ("learning progress, parent accounts"), Vercel and Upstash ("Student session data"), Axiom (logs, may include IP), Statsig (experiments) and Linear (bug reports).
- **AI, voice and text-to-speech:** ElevenLabs generates the tutor's voice from "Text content… including student first names", under a "Zero Data Retention agreement… no data used for model training". The policies I read say nothing about whether children's answers are used to train AI models. App version 3.8 added speech recognition in beta, so children can "speak their answers". I found no policy text on voice recordings, the microphone or which speech provider is used. **This is the largest gap.**
- **Ads and third parties:** "no current intention" of selling personal data. Anonymized or aggregated data may be shared "for any purpose without restriction".
- **Schools and FERPA:** the policy says it acts as a FERPA "school official". The Tutor product appears home-focused **(inference)**.
- **Store labels:** Apple says "Data Linked to You: Usage Data, Diagnostics". Google Play lists device IDs, name, email, other info and app activity, says "No data shared", and says "**Data isn't encrypted**" in transit. That contradicts the COPPA Policy's claim of "encryption of data in transit".
- **Other inconsistencies:** the privacy policy says "We do not currently use technologies (e.g., cookies…) for automatic personal data collection". The COPPA Policy says it collects "persistent identifiers, such as the IP address". The policy also says it does not honour Do Not Track.

## Khan Academy Kids (nonprofit, free, no ads, ages 2–8)

- **Data from the child:** the parent supplies a user name and age. The policy says "We recommend you select a nickname or silly name". It also says "We do not ask for or collect any additional personal information from your child." Usage data (features used, time spent, progress) and device details are collected and linked to an internal account ID.
- **Data from the parent:** email, plus IP address and approximate location "at the city or zip code level" when the account is created or the email verified. A password is collected only if the parent sets up access across devices.
- **Accounts:** "An adult with a verified email address must download the App and create an account". The help centre says the email lets families "restore their progress if they delete the app or switch devices". There is no guest mode.
- **COPPA and consent:** parental consent rests on the verified parent email and parent oversight. Under the policy's school-use section, "School personnel are solely responsible" for COPPA and FERPA notices and consent. The App Store blurb says "COPPA-compliant".
- **Retention and deletion:** data is kept "as long as your account is active or as is reasonably useful for operational purposes". There is no fixed period. Deletion is by contact form, and the policy says Khan "may not be able to delete information in all instances" (support logs, for example). Deleting the app does not remove school-class data.
- **Where progress lives:** on servers in the US. Some content is offline in "Kodi's Suitcase", but "An internet connection is required to access all of the learning content".
- **Ads and third parties:** "We do not display any targeted advertising in the Khan Academy Kids App" and it does not let third parties track children for ads. Khan does run its own ads for the app elsewhere, including on Facebook. It shares data with service providers and "others in the Khan Academy family". The analytics vendors are not named.
- **AI:** the Kids policy does not mention AI. Khan's AI tutor, Khanmigo, is covered by separate Khan Academy pages, which say student data is not used for LLM training ([help article](https://support.khanacademy.org/hc/en-us/articles/36808726375693)).
- **Schools and FERPA:** has teacher tools and Clever rostering (which can pass the "student's name, class, grade level, and teacher"). Schools control deletion of student data.
- **Store labels:** Apple says "Data Not Linked to You" (Contact Info, Identifiers, Usage Data, Diagnostics). **(inference)** That sits oddly with an email-based account. Google Play lists name, email and app interactions, "No data shared with third parties", encryption in transit, deletion on request, and the Play Families Policy.

## Comparison

| | Synthesis Tutor | Khan Academy Kids | Our project (plan) |
|---|---|---|---|
| Child data | First name or nickname, age or grade, answers, sessions | Nickname, age, usage | None leaves the device |
| Parent data | Name, email, billing, IP, geo | Email, IP, city or zip | None |
| Account | Parent account required | Verified parent email required | None. Local profiles behind a parent gate |
| Consent method | Card + email + click-through | Verified email | Nothing is collected, so no consent flow is needed **(inference, needs a lawyer)** |
| Progress storage | Servers (AWS, Vercel, Upstash) | Servers (US) | IndexedDB or SwiftData on the device, plus an export file |
| Retention | Service + 30 days; IPs 1 yr | While active, no fixed period | Until the device or user deletes it |
| Deletion | Email support (30 days) | Contact form | In-app reset and wipe all, instant |
| AI and voice | ElevenLabs TTS with zero retention; speech input beta, undocumented | No AI in the Kids app | No AI; on-device speech only |
| Ads | None stated in-app | None in-app | None |
| Store labels | Linked usage and diagnostics; Play says not encrypted | Not linked; Play says encrypted | Aim for "Data Not Collected" |

## What we can borrow or do better

1. **Plain-language privacy page**, one screen long. It lists every byte the app stores, where it stores it, and how to erase it. Khan's opening "Privacy Principles" list is a good format to copy.
2. **"Data Not Collected" store labels**, with an open-source network test in CI that proves the app makes no data-bearing requests. Neither competitor can show this.
3. **Silly-name nudge:** copy Khan's "nickname or silly name" advice in the profile setup screen and use a nickname field only, with no age or date of birth.
4. **Parent gate** for settings, export and reset: a grown-up task, not a card or email check, since we collect nothing.
5. **Instant export and delete controls:** in-app reset of one profile, wipe all, and a "last backup" date. Both competitors make parents email or fill in a form, so this is better.
6. **A published "no third parties" list:** list zero vendors, the way Synthesis lists its subprocessors, and keep the list in the repo.
7. **Voice disclosure:** read-aloud and any future speech input stay on the device, and we say so explicitly. Synthesis's undocumented speech beta shows the gap.
8. **No analytics SDK at all.** Use opt-in, human-readable feedback instead of Statsig-style experiments on children.

## Claims we must NOT make

- Do not say "COPPA-compliant", "FERPA-compliant", "certified" or "legally reviewed". Say only "built in COPPA's spirit: no accounts, no personal data, nothing leaves the device."
- Do not promise data "can never be lost" or is "backed up". Browsers can clear it.
- Do not say "anonymous" for export files. They contain a nickname and progress.
- Do not make store-label claims that a CI test doesn't verify.
- Do not describe competitors' practices beyond what their documents say. Keep the dated links.
