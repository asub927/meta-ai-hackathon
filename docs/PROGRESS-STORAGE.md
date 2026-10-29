# Progress storage: where a child's progress lives (no backend)

Research note, 2026-10-28. Public sources only, linked inline. **[A]** = assumption or estimate, not a sourced fact. Privacy-law notes are orientation only, **not legal advice**.

**Definition used here.** *No backend* = **no server we operate (or pay someone to operate for us) ever receives child data.** Serving static files (HTML/JS) is allowed. Data the family or school moves themselves (a file, AirDrop, their own iCloud) still counts as no backend.

---

## How on-device storage works in a web app

A static web app can keep data inside the browser on that device. Nothing is sent anywhere. Each website gets its own private box of storage.

| Tool | What it is | Safari / iPad? | Fit for us |
|---|---|---|---|
| **localStorage** | Small text key–value store | Yes | No: ~5 MiB cap per site, text only, blocks the page while it writes ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)). OK for a "last profile used" setting. |
| **IndexedDB** | A real database in the browser | Yes | **Yes, the main store.** Shares the large per-site quota. |
| **Cache API** | Stores app files for offline use | Yes | Yes, for the app itself (offline), not for progress. |
| **OPFS** (origin private file system) | Private files only the site can see | Safari 16.4+ ([SQLite docs](https://sqlite.org/wasm/doc/trunk/persistence.md)) | Possible (SQLite-in-browser) but not needed for a small log. |
| **File System Access API** | Read/write real files the user picks | **Not in Safari or iOS at all**, nor Firefox ([caniuse](https://caniuse.com/native-filesystem-api)) | No. Use a normal download/upload for export/import instead. |

**How much fits.** Far more than we need. Safari 17+/iPadOS 17+ lets one site use up to ~60% of disk in the browser ([WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/)); Chrome also ~60% ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)). **[A] Estimate:** one event ≈ 150 bytes of JSON; ~150 events a day ≈ 22 KB; a full 180-day school year ≈ 4 MB per child, roughly 0.4 MB compressed. Tiny for IndexedDB, but close to localStorage's 5 MiB cap.

**Does progress survive…?**

| Event | Result |
|---|---|
| Closing the tab, restarting the iPad | Yes |
| Browser or iPadOS update | Yes, normally **[A]** (no source says updates clear site data) |
| Parent/teacher taps "Clear history and website data" | **No. All of it is erased** |
| Private / Incognito / Guest window | **No.** Deleted when the window closes ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)) |
| Not opened in Safari for 7 days of Safari use | **Can be erased.** Safari deletes script-written storage (IndexedDB, localStorage, caches) after 7 days of Safari use with no tap on the site ([WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)) |
| Same, but app was **added to the Home Screen** | Kept. Home Screen web apps have their own counter, and WebKit says deleting their data would be "a serious bug" ([WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)) |
| Device low on space | Can be erased (least recently used site first) unless the site got "persistent" mode; Safari grants that based on things like Home Screen install ([WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/)) |
| Moving to a new iPad or another browser | **No.** Storage never leaves the device. Use the export file |

So on iPad: **add it to the Home Screen** and **export a backup now and then**.

**What a teacher needs (all in the adult-gated parent area):**
1. **Export** one child or all children to a file (save to Files, AirDrop, email it to yourself).
2. **Import** a file to restore or move a child to another device.
3. **Reset one profile** (wipe that child's events only).
4. **Wipe all** (end of year, handing the device on).
5. A visible "last backup" date and a warning if storage is not persistent.

---

## Options compared

| # | Option | Survives clear-site-data / OS update | Shared device | Child privacy | Classroom | Effort | No backend? |
|---|---|---|---|---|---|---|---|
| 1 | **IndexedDB (via `idb`) + `navigator.storage.persist()`** | Clear: no. Update: yes [A]. Safari 7-day rule unless Home Screen | Profiles live in one site store; anyone using that browser sees them (gate needed) | Good: nothing leaves device | Good on 1:1 or class-set iPads; risky on browsers wiped nightly | Low | Yes |
| 2 | **OPFS + SQLite-WASM** (`opfs-sahpool`, no COOP/COEP needed) | Same as 1 (same eviction rules) | Same as 1; single tab at a time with sahpool | Same | Same | Medium (Worker, WASM ~1 MB [A]) | Yes |
| 3 | **localStorage** | Same as 1 | Same | Same | Fills up within a year per class | Low but wrong | Yes |
| 4 | **Native SwiftData/SQLite** (iPad app) | Clear-site-data n/a. Survives OS updates [A]; lost if app deleted | One app container per iPad, or per Managed Apple Account on Shared iPad | Good. Default file class is "protected until first unlock"; `NSFileProtectionComplete` locks it ~10 s after device lock ([Apple](https://support.apple.com/guide/security/data-protection-classes-secb010e978a/web)) | Good | Medium (M3) | Yes |
| 4b | **+ CloudKit private DB** (opt-in) | Yes; restores on new device | Shared iPad expects cloud sync; local data of the oldest user is removed when space runs out ([Apple](https://support.apple.com/guide/deployment/prepare-shared-ipad-dep6fa9dd532/web), [TN2428](https://developer.apple.com/library/archive/technotes/tn2428/_index.html)) | Data sits in the family's/school's iCloud; private DB records are "not visible to the application developer" ([Apple docs mirror](https://apple-docs.everest.mt/docs/cloudkit/ckdatabase/scope/private/), [Apple](https://developer.apple.com/icloud/cloudkit/designing/)) | Fits Shared iPad | Medium | Yes (Apple's server, user's account, we can't read it) |
| 5 | **Export/import file** (NDJSON event log + SHA-256 checksum) | Yes, it's a file outside the app | Per profile | Good if the file holds only nickname + events | Core: backup, device change, teacher collection | Low | Yes |
| 6 | **Teacher dashboard page** (static, runs in browser, reads dropped files) | Teacher keeps the files | n/a | Data stays on teacher's device; becomes a school record [A] | Good with no IT | Low–medium | Yes |
| 7 | **Self-hosted sync / WebRTC peer sync** — *future, not a plan* | Yes | Yes | Depends on who runs it | Needs a school or IT person | High | Only if the school runs it, not us |

Notes:
- **Checksum vs signature.** A SHA-256 checksum (Web Crypto) catches damaged files. It does not prove who made a file; any real signature needs keys a child app can't keep secret **[A]**. Call it integrity, not authenticity.
- **QR** fits only summaries: a QR code holds at most 2,953 bytes ([Denso Wave](https://www.qrcode.com/en/about/version.html)). Use QR for a "today's results" card, files for full logs.
- **Shared school browsers** (Chromebook guest mode, profiles wiped at logout) erase options 1–3 every session **[A, varies by school setup]**. There, the export file at end of session is the only thing that keeps progress.

## Shared-device handling (option 8)

- Several **kid profiles** per device: nickname + picked avatar + colour. **No real names, birthdays, photos or voice.** Profile ID is a random UUID made on the device.
- **Switching:** tap your avatar. No passwords for kids **[A: optional 4-picture code for classrooms]**.
- **Parent/teacher gate** for export, import, reset, wipe, and the teacher view: a grown-up task (e.g. type a number shown as words), not a secret.
- **Per-profile wipe** deletes that profile's events and its ID; **wipe all** deletes the database. Show a confirmation, then offer an export first.
- Every event carries the profile ID, so one file can hold one child or a whole device.

## Recommended default stack

| Milestone | Storage work |
|---|---|
| **M1** (one lesson, web) | IndexedDB via `idb`; append-only event log keyed by profile; call `persist()` and show the result; "Add to Home Screen" prompt on iPad; profiles + parent gate; export/import NDJSON with checksum; reset profile / wipe all |
| **M2** (authoring) | Versioned event schema + migration tests; static **teacher dashboard** that reads dropped export files, held in memory, nothing saved unless the teacher exports |
| **M3** (native iPad) | SwiftData or SQLite with the **same event schema**; `NSFileProtectionComplete`; export via share sheet (Files, AirDrop); import the web export |
| **M4** (full grade) | Optional, opt-in **CloudKit private DB** sync for families and Shared iPad; test with Managed Apple Accounts |
| **M5** (pilot) | Classroom pilot of the file-collection flow; privacy notice written for schools; review with counsel |

**Defer:** OPFS/SQLite-WASM (only if queries outgrow IndexedDB), any sync server, WebRTC peer sync, accounts, analytics.

## Privacy orientation (not legal advice)

- **COPPA** applies to operators of child-directed services that collect personal information from under-13s; it lists a persistent identifier among personal information ([FTC FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)). The amended rule took effect June 23, 2025, with compliance by April 22, 2026 ([Federal Register](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)). **[A]** If nothing ever reaches us, we arguably collect nothing, but no static hosting logs, no analytics, and no third-party scripts must be true too.
- **FERPA** covers education records kept by schools; exported files a teacher collects likely become school records, the school's responsibility **[A]** ([studentprivacy.ed.gov](https://studentprivacy.ed.gov/)). State student-privacy laws vary; not researched here.

## Five risks

1. **Silent loss in Safari** if the app isn't on the Home Screen and isn't opened for 7 days of Safari use.
2. **Clear-website-data or a wiped school browser** erases everything; families won't expect it.
3. **Shared iPad** removes local data of the least recent user when space is short; local-only native storage can lose a child's year.
4. **Export files are a privacy leak** if shared widely (email, shared drives). Keep them to nickname + events.
5. **Schema drift** between web and native breaks import; one versioned schema is needed from M1.

## Not verified

- That browser or iPadOS updates never clear site data (no source found either way).
- Exactly how Safari decides to grant `persist()` beyond "heuristics like Home Screen install."
- CloudKit private DB behaviour with **Managed Apple Accounts** on Shared iPad, and whether schools allow it.
- Chromebook/managed-browser wipe policies in NC schools.
- Whether any COPPA/FERPA/NC law reading treats on-device-only data as "collected." Needs counsel.
- WASM bundle size for SQLite (estimate only).
