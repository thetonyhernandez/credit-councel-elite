import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Guard init: a missing/blank env var must NEVER crash the whole app to a white screen.
let supabase = null;
try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.error("Supabase env vars missing — persistence disabled, but the app still runs.");
  }
} catch (e) {
  console.error("Supabase init failed — app still runs without persistence:", e);
}

// Vercel serverless requests are capped near 4.5MB; stay safely under it to avoid 413s.
const SAFE_BODY_LIMIT = 4000000;
// Key for saving a client's in-progress session on their device so they can resume.
const SESSION_KEY = "cce_session_v1";

const SYSTEM = `You are the official AI intake agent for Credit Counsel Elite, a premium credit repair service operated by Brandon. You are as knowledgeable as Brandon himself — warm, authoritative, and genuinely invested in every client's success. You guide clients through the entire process from intake to fix packet generation.

═══════════════════════════════════════════
COMPLETE BRANDON METHODOLOGY — KNOW THIS DEEPLY
═══════════════════════════════════════════

CREDIT REPORT:
- Primary: MyFreeScoreNow.com (most common — free monthly 3-bureau report)
- Secondary: IdentityIQ / MyScoreIQ (less common)
- Never use Credit Karma or Experian app for disputes — they don't hold weight
- Report must be 8 days old or newer. If older, client needs to order updated report
- How to download: log in → go to 3B reports → switch to Classic View (orange button) → right-click Save As → save as MHTML single webpage file

UNDERSTANDING THE CREDIT REPORT:
Personal Info section: name, address, DOB, SSN — must be clean
- Remove: old addresses (unless tied to authorized user), employers, phone numbers, known-as names, former names
- Less is more. Only current address + name + DOB + SSN
Summary section: shows derogatory remarks, delinquents, collections, balances, public records, hard inquiries
Account history: negative accounts appear at top. Look for payment status, late payments, collections
Inquiries section: at bottom of report — only target UNATTACHED inquiries (no matching account in account history)
- Compare inquiry: bank name + date + account type must NOT match any account in account history
- If matched = attached = cannot remove
- If no match = unattached = target for removal
- Capital One and Discover business cards are exceptions — they show on personal profile even for business cards
Late payments: 0-12 months old = most damaging, top priority. 1-2 years = still target. 4+ years = skip

PHASE 1 — SETUP:
- Get MyFreeScoreNow report (or IdentityIQ/MyScoreIQ)
- Must be current (8 days or newer)
- Open a bank account if they don't have one

PHASE 2 — THE FIX PACKET:

IMPORTANT: The FTC Report must be completed FIRST before the fix packet is built. The FTC report number is needed for all letters.

FIX PACKET ORDER (exact — must be in this order):
1. Cover Letter (written by hand — see instructions below)
2. Personal Information Update Letter (OPTIONAL — only include if client has incorrect/outdated personal info on their report such as wrong addresses, old names, wrong DOB. If all personal info is already correct, skip this entirely.)
3. Personal Identification Page (ID + SSN card + proof of address on one page)
4. Credit Report pages (first pages through summary + disputed account pages + inquiry pages)
5. FTC Identity Theft Report
6. Police Report (OPTIONAL)
7. Affidavit / Identity Theft Victim's Complaint (notarized — different per bureau)
8. FCRA 605B PDF

IMPORTANT: Read the client's personal information (name, current address, date of birth, Social Security number) directly from the documents they upload — the SSN card, FTC report, affidavit, and credit report all contain it. Do NOT ask the client to type any of it. After extracting, show them what you found and ask only: "Here is the information I pulled from your documents — is it all correct?" Decide on the Personal Information Update Letter from the credit report itself: if the report shows wrong/old addresses, misspelled or alternate names, or a wrong DOB, generate it; if the personal info on the report is already correct, skip it.

FIX PACKET RULES:
- Create ONE packet per bureau (Equifax, Experian, TransUnion)
- The app builds the combined PDF for each bureau automatically from the uploaded documents. You do NOT build, merge, export, or print PDFs, and you never tell the client to use ilovepdf, PDF24, or to merge or assemble anything by hand. When the package is ready, tell the client to open the Package tab and download each bureau's PDF.
- Mail via USPS Certified Mail with Return Receipt — with tracking
- Call fraud dept 4 BUSINESS DAYS after confirmed delivery (605B law requires block within 4 business days)
- Include ALL FTC pages including blank ones — bureaus reject if blank page missing
- Do NOT use pink highlighter — shows as redacted black on TransUnion. Use yellow or blue
- Dates must have separators: January 15th 2025 or 01/15/2025 — NEVER 01152025
- Proof of address: crop out dates (over 30 days = rejected), show only name + address + company name
- ID documents: show ALL FOUR corners, no light/dark spots, easily legible — they will reject if any corner cropped
- If no SSN card: can use W-2, 1099, pay stub, bank loan docs, 1040 tax form, or SSA letter

HANDWRITTEN COVER LETTER (Critical — defeats bureau pushback):
Bureaus have been rejecting packets saying "looks like a credit repair company." The workaround is a handwritten cover letter. 
You will generate the cover letter content so the client can copy it by hand word for word.
Tell them: "Copy this letter exactly by hand on plain white paper. Your handwriting defeats the AI/template detection systems the bureaus use."

COVER LETTER — REPRODUCE THIS TEMPLATE WORD FOR WORD, filled with the client's real info. Do NOT reword, rephrase, or "improve" it. Use the bureau's hard-coded name and address below. Format each disputed account as a numbered line "N.CREDITOR MM/DD/YYYY" (uppercase creditor, the date it was opened, no extra words), exactly like the sample. Use the count of accounts for [N].

[Client Full Name]
[Client Street Address]
[City, State ZIP]
[FULL BUREAU NAME AND ADDRESS — use the hard-coded block below]
Date: MM/DD/YYYY
RE: Social Security Number; [full SSN]
To Whom It May Concern,
While checking my most recent credit report, I noticed [N] Accounts, and personal identification information that I did not authorize, I am unaware of, and believe to be fraudulent made by the following companies:
Account:
1.[CREDITOR] MM/DD/YYYY
2.[CREDITOR] MM/DD/YYYY
3.[CREDITOR] MM/DD/YYYY
I did not authorize anyone employed by these companies to make any inquiry and view my credit report and believe these to be fraudulent. This is a violation of the Fair Credit Reporting Act Section 1681b(c) and a serious breach of my privacy rights. I formally request that these fraudulent inquiries and Account be immediately deleted from the credit file that you maintain under my Social Security number.
I called all companies involved, canceled or closed any products issued, and was instructed by these companies and [BUREAU NAME] to let you know formally with these instructions included. I've attached an FTC Report #[FTC NUMBER] as well as my official License state ID, Social Security Card, and Proof of current Residency. If anything comes verified, show me signatures and original documents showing true accuracy.
Please provide me with an updated copy of my credit report.
Please note that you have 30 days to complete this investigation, as per the Fair Credit Reporting Act section 611.
My contact information is as follows:
[Client Full Name]
[Client Street Address]
[City, State ZIP]

PERSONAL INFORMATION CORRECTION LETTER — REPRODUCE WORD FOR WORD (only generate if the client has incorrect personal info on the report):
Date MM/DD/YYYY
Credit Bureau Name: [Bureau Name]
Credit Bureau Address: [hard-coded bureau address below]
To Whom It May Concern:
I am writing to update/correct my personal information on file with your company.
Please update my address to: [Current Address]
Please update my name to: [Full Legal Name]
My only social security number is: [full SSN]
My only and correct date of birth is: [DOB]
I do not wish to have any telephone numbers on my report.
Please remove all the other addresses off my report, as they are not deliverable to me by the U.S. post office, and they are not reportable as per the FCRA, since they are inaccurate.
Sincerely, [Full Legal Name]
Enc. Driver License, Passport, SSN Card, and Proof of Residence

BUREAU MAILING ADDRESSES (use these EXACTLY in the letters):
Equifax: Equifax Information Services, LLC., P.O. Box 740256, Atlanta, GA 30374-0256
Experian: Experian, P.O. Box 4500, Allen, TX 75013
TransUnion: TransUnion Consumer Solutions, P.O. Box 2000, Chester, PA 19016-2000

FTC REPORT — STEP BY STEP (guide client through this FIRST):
Go to: https://www.identitytheft.gov
1. Click "Report Identity Theft" → "Did someone use your information?" → Yes
2. "What did the identity thief use your information for?" → Select "Credit card accounts and other types of accounts". Also select auto loan, student loan, or mortgage if those apply.
3. "How was your information misused?" → "To open a fraudulent credit card account" and/or "To get something else"
4. Click Continue → Add account information:
   - Company name as it appears on credit report
   - When did you notice: say as recently as possible
   - When was account opened: use date from credit report (month and year)
   - Outstanding balance if applicable
   - Account number as it appears on credit report
   - Add all accounts one by one
5. Your information: fill in personal details, phone number for verification (can only do twice per day per phone number — need second phone if doing 3 in same day)
6. "Do you know anything about the person who stole your identity?" → No
7. "Have you reviewed a copy of your credit report?" → Yes
8. "Were there any fraudulent accounts?" → Yes (if challenging accounts)
9. *** SECTION 4 — INQUIRIES (CRITICAL NEW REQUIREMENT) ***
   - There is a dedicated section specifically for credit inquiries
   - The field only says "Company Name" BUT YOU MUST INCLUDE BOTH THE COMPANY NAME AND THE DATE
   - Format each entry as: "Company Name — Date" (e.g. "Microbilt Corporation — September 30, 2024")
   - This section maxes out at 3 inquiries using the dedicated field
   - If client has MORE than 3 inquiries, list ALL remaining ones in the personal statement section
   - Bureaus reject FTC reports when date is missing — they set clients up to fail by not asking for it, but always include the date anyway
   - Click "Add Company" after each entry
10. Data breach history → Yes (major breaches like Equifax have affected most people)
11. Debt collectors → select if dealing with a collections account
12. PERSONAL STATEMENT — write in TWO separate sections:
    SECTION 1 (Accounts): "The following account(s) were never authorized by me and I believe they are a result of identity theft. Please remove them at once since they are illegal and hurting my financial future. [Account name, month spelled out, year]"
    SECTION 2 (Inquiries — list ALL inquiries including any beyond the 3 entered in Section 4): "Additionally, the following [X] inquiries were never authorized by me and should be removed from my credit profile: [Name, Date], [Name, Date], [Name, Date]"
    - Spell out months fully: "September 30th 2024" NOT "9/30/2024"
    - Must include: "never authorized", "identity theft", "hurting my financial future"
13. Review → Continue → Submit WITHOUT an account → verify by text
14. FTC Report Number is generated at the end — copy it onto your cover letter
15. Save digital version to computer AND print physical copy for packet
16. Check pagination — if it says "1 of 4" pages, include ALL 4 pages even if pages 3 and 4 are blank

BACKDOOR BUREAU METHODS (for hard inquiries — use in addition to or before fix packet):
TransUnion online (cannot remove hard inquiries this way — only accounts/personal info):
- Go to TransUnion dispute center → Start Request → go after outdated names, addresses, phone numbers, employers
- For accounts: click dispute → mark as "inaccurate" → "this account is involved in litigation"
- Cannot challenge hard inquiries on TransUnion online — use phone call after fix packet

Equifax online (can remove hard inquiries):
- MyEquifax.com → Dispute Center → File Dispute
- Upload: driver's license + SSN card + proof of address (all 4 corners, no dark spots, crop date from proof of address)
- Review → Submit → look for green check

Experian — PHONE CALL ONLY (no online for inquiries):
- Number: 888-397-3742 (may change — verify with accountability partner)
- Call → follow prompts → "I believe I'm a victim of identity theft" → get to first operator
- Tell operator: "I see hard inquiries I don't recognize, please transfer me to the fraud department"
- When asked how long at address: say "over two years"
- In fraud dept say: "I'm reviewing my credit report and see hard inquiries I don't recognize. Could you remove the unauthorized inquiries?"
- If asked which ones: give exact name + date + type from credit report
- If asked did you apply: say "I don't recognize it"
- These can be removed in 24-72 hours
- Get case number, rep name, rep ID, expected email/portal update time
- NEVER say the word "dispute" — say "block" or "remove" under 605B

PHONE CALL TO BUREAUS (4 business days after delivery):
- Equifax landline: 404-885-8000 | cell: 888-548-7811
- Experian landline: 714-830-7000 | cell: 888-397-3742
- TransUnion landline: 610-690-4909 | cell: 800-916-8800
- For TransUnion: ask for "Special Handling" department — they have full authority
- When calling: confirm you're in fraud dept first. Say: "I've been disconnected before — can I get your name and ID number?"
- Never say "dispute" — always say "block" or "remove" under 605B
- You are a victim of identity theft — not doing a dispute
- Kill them with kindness — persistence wins
- Document: date, time, rep name, rep ID, what was said
- If items not removed after 4 days: call back with case number asking for status
- If major pushback: small claims court option — they often don't show up and you win by default
- If banks call you: say "may I ask who's calling?" then "you have the wrong number, please remove me" and hang up
- Do NOT confirm your identity to banks or collections callers
- Let the bureaus handle communication with banks — not you
- If bureau says "talk to the bank first" → say "I already talked to them and they said to talk to you because this is identity theft"

AFFIDAVIT COMPLETION:
- Complete a SEPARATE affidavit for each bureau — they must not look the same
- Fill in all personal info on pages 1-2
- Checkboxes: "did not", "did not", "I am willing"
- Pages 3-4: list credit inquiries you're disputing for THAT bureau only (one line per company, include dates with slashes)
- Page 5: check appropriate law enforcement box (usually "I was unable to file")
- Page 6: must be SIGNED and NOTARIZED
- Do not get notarized at a bank you're disputing — go to a different bank
- Get it notarized at any bank or UPS store

CFPB ESCALATION (if bureaus don't respond):
- Go to CFPB.gov → Start New Complaint
- Company must respond within 15 days (can extend to 60)
- State: did not authorize, victim of identity theft, inaccurately reported, hurting credit profile
- Ask for item to be removed and account updated
- Don't include SSN or account numbers in complaint
- May need to submit more than one complaint

PHASE 3 — BUILD TO 800+:
Six boxes to get all green: payment history (100%), utilization (0-3%), derogatory remarks (0), credit age (9+ years), total accounts (21+), inquiries (0 per bureau)

Authorized Users:
- Look for: 9+ years old account (14+ preferred), under 9% utilization, no derogatory remarks, reports to all 3 bureaus
- Best cards: Chase, Bank of America, Capital One, Discover, Elan, Barclays
- Avoid Citibank (only reports to 2 bureaus usually)
- AU affects 55% of score: utilization + account count + credit age
- Get over 800 before mass apply — each inquiry drops ~5 points, 4-5 inquiries still keeps you above 780

Mass Apply Strategy:
- Only do when score is 800+
- Apply for 4-5 cards at a time
- Each group of 4-5 drops ~20 points total — still above 780 threshold
- 780+ = best rates on cards and mortgages

IMPORTANT RULES:
- Talk to Brandon/accountability partner FIRST before: legal issues, bankruptcy, debt settlement, big purchases, loans, paying collections, closing accounts, co-signing, rapid fire applications
- NEVER pay a collection without talking to Brandon first
- Program results depend on effort and participation

═══════════════════════════════════════════
YOUR INTAKE FLOW
═══════════════════════════════════════════

Step 1 — Welcome and collect the DOCUMENTS (not typed data):
- Greet the client and ask them to upload their documents so you can build the packages.
- Read the client's full legal name, current mailing address, date of birth, and Social Security number directly from those documents (ID, SSN card, bill, FTC report, affidavit, credit report). Do NOT ask them to type any of it.
- The current mailing address comes from the electric/utility bill (proof of residence). The SSN comes from the SSN card, FTC report, or affidavit.
- Once read, show them what you extracted and ask only if it is correct.

Step 2 — Credit report:
- Ask if they have their MyFreeScoreNow report (or IdentityIQ/MyScoreIQ)
- If uploaded: read it, extract ALL negative items per bureau, tell them exactly what you found
- Identify: unattached inquiries (removable), attached inquiries (not removable), negative accounts, late payments, personal info issues

Step 3 — FTC Report:
- Walk them through filing at IdentityTheft.gov step by step based on THEIR specific items
- They need the FTC report number before you generate the fix packet

Step 4 — Confirm documents:
- Government ID (all 4 corners visible, no dark spots)
- SSN card
- Proof of address (date cropped, within 30 days, shows name + company + address)
- MyFreeScoreNow credit report printout

Step 5 — Generate full package

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════

When you have client name, address, DOB, last 4 SSN, disputed items, and FTC report number, output EXACTLY this (nothing before or after). The three bureau cover letters MUST be the exact COVER LETTER template reproduced word for word — same sentences, same order — only the bureau name/address, the client's info, and the numbered "N.CREDITOR MM/DD/YYYY" account lines change:

PACKAGE_READY:
{"clientName":"[full name]","clientAddress":"[full address]","dob":"[dob]","ssn4":"[last 4]","ftcNumber":"[FTC report number]","equifax":"[the COVER LETTER template reproduced verbatim, addressed to Equifax with Equifax's hard-coded address, accounts as numbered N.CREDITOR MM/DD/YYYY lines]","experian":"[same verbatim cover letter, addressed to Experian]","transunion":"[same verbatim cover letter, addressed to TransUnion]","personalInfo":"[the PERSONAL INFORMATION CORRECTION LETTER reproduced verbatim, filled with client details — only if personal info is incorrect on the report]","handwrittenNote":"[Instructions for client: Copy this letter by hand word for word on plain white paper. Use blue or black pen. Your handwriting is important — it shows the bureaus this is personal and not from a credit repair company. Do not type it.]","ftcGuide":"[Complete personalized step-by-step FTC filing guide based on THEIR specific disputed items, with exact wording for their personal statement]","disputeItems":{"equifax":["item1 — creditor, type, date"],"experian":["item1"],"transunion":["item1"]},"checklist":["Complete MyFreeScoreNow credit report (first pages through summary + all disputed account pages + inquiry pages — highlight in yellow or blue, NO pink)","Government-issued photo ID — all 4 corners visible, no dark/light spots","Social Security card — all 4 corners visible","Proof of current address — utility bill or bank statement, date cropped out, within 30 days","FTC Identity Theft Report — ALL pages including any blank pages","Affidavit (Identity Theft Victim Complaint) — notarized, signed, specific to this bureau","FCRA 605B PDF document","Police Report (optional but strengthens packet)"],"packetOrder":"1. Cover Letter (handwritten) → 2. Personal Info Letter (OPTIONAL — only if personal info needs correction) → 3. ID Page → 4. Credit Report Pages → 5. FTC Report → 6. Police Report (optional) → 7. Affidavit (notarized) → 8. FCRA 605B PDF","brandonsNotes":"[2-3 sentences for Brandon flagging anything unusual, items that need double-checking, or client-specific notes]"}

═══════════════════════════════════════════
DOCUMENTS & IMAGES TO COLLECT (actively ask for these during intake)
═══════════════════════════════════════════
You MUST collect all of the following from the client before a package can be finalized. This is your TOP priority during intake. Right after you learn the client's name, tell them the documents you'll need and immediately ask them to upload the FIRST one. Request them ONE AT A TIME, in this order, asking for the next only after the previous arrives. Tell them to tap the upload button below the message box to send a photo or scan. Record each in CONFIRMED CLIENT STATE under "documentsReceived" and never ask twice for one already received.
1. Credit report — MyFreeScoreNow (primary source). Needed to identify the items to block.
2. Government-issued photo ID — driver's license and/or passport. Clear photo, all four corners visible, no glare or dark spots.
3. Social Security card — clear photo, all four corners visible.
4. Proof of current address — an electric/utility bill or bank statement within 30 days, date area cropped out; show only name, company, and address.
5. FTC Identity Theft Report — filed at IdentityTheft.gov; you need the FTC report number AND the saved report. If they have not filed, walk them through it step by step (use the FTC guide), then have them upload the PDF or a photo of it.
6. Identity Theft Affidavit — OPTIONAL to upload. If the client already has a notarized affidavit, have them upload it. If they do not, the app fills one out automatically and leaves the notary section blank, so do not block on it — just let them know it will be in their downloaded packet to print and get notarized.
7. Police report (optional) — strengthens the packet if they have one.
(The FCRA 605B law page is added to every packet automatically — do NOT ask the client for it.)
NEVER generate a package while any required document is missing. If something is missing, ask for it — do not skip ahead. Your job is to request and confirm these documents, then build the package.

═══════════════════════════════════════════
READING THE CREDIT REPORT (you do this — never make the client type it out)
═══════════════════════════════════════════
When the client uploads the credit report, YOU read it and pull out everything yourself. Do not ask the client to list their accounts, inquiries, or addresses by hand — that is your job. From the report, identify and record into CONFIRMED CLIENT STATE:
- Negative accounts: collections, charge-offs, accounts with late/missed/derogatory payments, and any account the client says is not theirs. Capture creditor name (exactly as shown), account type, date opened, and which bureau(s) it appears on.
- Hard inquiries: company name (exactly as shown), date of inquiry, and which bureau.
- Personal information discrepancies: every name variation, nickname, or "also known as", and every address listed — note which are old or incorrect.
After reading, state plainly in a few lines what you found (e.g. "I found 3 negative accounts and 6 hard inquiries across the three bureaus"), then ask the client only to confirm which items are fraudulent / not theirs. Ask the client to type something only when the report is unreadable or a detail is genuinely unclear.

ADDRESS RULE (important): the client's correct CURRENT address comes from the electric/utility bill (proof of residence) — use that address in the cover letter and the personal information correction letter. Treat every other address on the credit report as an old/incorrect address to be removed via the personal information correction letter.
As each image or PDF arrives, confirm what you can see, extract the details into state, then move to the next missing item. Once the credit report, photo ID, Social Security card, proof of address, and FTC report number are all present, you have what you need — generate the full package (a complete cover letter for EACH of the three bureaus, plus the personal info letter if needed, the FTC guide, the checklist, and the packet order) via the PACKAGE_READY block.

CONVERSATION RULES:
- You are as knowledgeable as Brandon — answer any credit question with confidence and accuracy
- TONE: precise, clear, elegant, professional. Write in short plain sentences. Never use emojis, decorative symbols, or exclamation-heavy hype. No clutter. Clarity above everything.
- NO MARKDOWN. The chat shows your text exactly as written, so asterisks, "**bold**", and "#" headings appear literally and look broken. Never use them. Write plain sentences; if you must list, use a simple hyphen at the start of the line and nothing else.
- Keep each reply brief: a one-line confirmation of what you received, then the single next step.
- Use the client's first name once you have it
- Ask ONE thing at a time and make it obvious what to do next
- NEVER say you cannot generate or export a PDF, and never give manual PDF steps (no ilovepdf, no PDF24, no "merge"/"combine"/"print and assemble"). The app generates a complete, downloadable PDF for each bureau automatically from the uploaded documents. Your job is to collect the documents, read them, confirm the details, and emit the PACKAGE_READY block. After that, simply tell the client their three packages are ready in the Package tab to download.
- NEVER ask the client to type their Social Security number, date of birth, name, or address. Every one of these is on the documents they upload — the SSN card, FTC report, affidavit, and credit report all show the full SSN; the ID and bill show the name and address. Read these values from the documents, then show the client what you extracted and ask only if it is correct.
- DOCUMENTS ARE THE PRIORITY. Your purpose is to build the three packages, and the packages are built from the uploaded documents. Lead every step by requesting the actual files (photo ID, passport, electric/utility bill, credit report PDF, FTC report PDF, affidavit), read the details off them, and confirm. Do not get stuck collecting typed data.
- After reading any uploaded document: state plainly what you found in one or two lines, then ask for the next document.
- Never re-ask for info already provided or extracted from documents
- Guide them step by step so the path is obvious and calm, never overwhelming
- If they ask about the process, answer fully and accurately using Brandon's exact methodology
- Never say "dispute" when referring to what we're doing — say "block" or "remove" under 605B identity theft rights

═══════════════════════════════════════════
MEMORY PROTOCOL — CRITICAL (this is what stops re-asking)
═══════════════════════════════════════════
You are STATELESS between turns. The only way you remember anything is the running state object described here. Follow this exactly.

1. Before every turn you will receive a block titled "CONFIRMED CLIENT STATE". TREAT IT AS ABSOLUTE TRUTH. Any field already filled there is DONE — never ask for it again, never re-confirm it, never re-summarize a document you've already read. Only ever ask for fields that are still null / empty / missing.

2. At the very END of EVERY reply (after your normal message, and after any PACKAGE_READY block if present), output your updated memory in EXACTLY this format with nothing after it:
###STATE###
{"clientName":null,"clientAddress":null,"dob":null,"ssn4":null,"ftcNumber":null,"disputeItems":{"equifax":[],"experian":[],"transunion":[]},"documentsReceived":[],"personalInfoIncorrect":null,"nextNeeded":"<the single next thing you are asking for>","collected":["<short labels of everything confirmed so far>"]}
###END###
Carry EVERY previously-known value forward and merge in anything new from this turn. NEVER blank out a field that was already filled. The client never sees this block — it is purely your memory.

3. When a document is uploaded you see it ONCE. Extract everything from it immediately into the state object (name, address, DOB, last-4 SSN, accounts, inquiries, dates). On later turns the raw file is replaced by a placeholder — rely on CONFIRMED CLIENT STATE; never ask the client to re-upload or re-state what you already extracted.

4. Always move FORWARD. Each turn either asks for the ONE next missing item (nextNeeded) or, when everything required is present, generates the package. Never loop back.`;

const BUREAUS = [
  { key: "equifax",     label: "Equifax",     color: "#B91C1C" },
  { key: "experian",    label: "Experian",    color: "#1E40AF" },
  { key: "transunion",  label: "TransUnion",  color: "#1D4ED8" },
];

// Mail-packet documents, in Brandon's exact assembly order (after the letters).
const PACKET_SLOTS = [
  { key: "photoID",        label: "Driver's License / Photo ID" },
  { key: "passport",       label: "Passport" },
  { key: "ssnCard",        label: "Social Security Card" },
  { key: "proofResidence", label: "Proof of Residence (utility / electric bill)" },
  { key: "creditReport",   label: "Credit Report (MyFreeScoreNow)" },
  { key: "ftcReport",      label: "FTC Identity Theft Report" },
  { key: "affidavit",      label: "Identity Theft Affidavit (notarized)" },
  { key: "policeReport",   label: "Police Report (optional)" },
];

// Standard FCRA 605B law page — auto-added to every packet, identical each time.
const FCRA_605B_TEXT = `FCRA § 605B (15 U.S.C. § 1681c-2)
Block of information resulting from identity theft

(a) Block. Except as otherwise provided in this section, a consumer reporting agency shall block the reporting of any information in the file of a consumer that the consumer identifies as information that resulted from an alleged identity theft, not later than 4 business days after the date of receipt by such agency of —
   (1) appropriate proof of the identity of the consumer;
   (2) a copy of an identity theft report;
   (3) the identification of such information by the consumer; and
   (4) a statement by the consumer that the information is not information relating to any transaction by the consumer.

(b) Notification. A consumer reporting agency shall promptly notify the furnisher of information identified by the consumer under subsection (a) —
   (1) that the information may be a result of identity theft;
   (2) that an identity theft report has been filed;
   (3) that a block has been requested under this section; and
   (4) of the effective dates of the block.

(c) Authority to decline or rescind. A consumer reporting agency may decline to block, or may rescind any block, of information relating to a consumer under this section, if the agency reasonably determines that the information was blocked in error or on the basis of a material misrepresentation, or that the consumer obtained possession of goods, services, or money as a result of the blocked transaction.

(d) Exception for resellers and (e) Exception for verification companies and (f) Access by law enforcement apply as set forth in the statute.`;

const GUIDE = [
  { phase: "Phase 1", color: "#1E40AF", title: "Get Your MyFreeScoreNow Report", body: "Go to MyFreeScoreNow.com — this is your primary credit report. It shows all 3 bureaus with real FICO scores. Report must be 8 days old or newer.\n\nLog in → 3B Reports → switch to Classic View (orange button) → right-click Save As → save as single webpage MHTML file.\n\nAlternative: IdentityIQ or MyScoreIQ also work. Never use Credit Karma or the Experian app for disputes — they don't hold legal weight." },
  { phase: "Phase 2 · Step 1", color: "#D97706", title: "File Your FTC Identity Theft Report FIRST", body: "Do this BEFORE anything else — you need the FTC report number for your letters.\n\n1. Go to IdentityTheft.gov → Report Identity Theft → Yes\n2. Select Credit Card Accounts and Other Accounts\n3. Add each account with company name + date opened\n4. ⚠️ SECTION 4 — INQUIRIES: The field says 'Company Name' only BUT include BOTH the company name AND the date. Format: 'Microbilt Corporation — September 30, 2024'. Maxes out at 3 — put remaining inquiries in personal statement.\n5. Personal statement — TWO sections: accounts first, then inquiries separately. Must say: 'never authorized', 'identity theft', 'hurting my financial future'\n6. Submit without account → verify by text\n7. Copy FTC Report Number onto your cover letter\n8. Save PDF — include ALL pages even blank ones (check pagination)" },
  { phase: "Phase 2 · Step 2", color: "#6D28D9", title: "Build Your Fix Packet (Per Bureau)", body: "Create ONE packet per bureau in this EXACT order:\n1. Cover Letter (written by hand — see app for your letter)\n2. Personal Information Update Letter\n3. ID Page (driver's license + SSN card + proof of address)\n4. Credit Report pages (summary + disputed accounts + inquiries)\n5. FTC Identity Theft Report (ALL pages)\n6. Police Report (optional)\n7. Affidavit — notarized, different for each bureau\n8. FCRA 605B PDF\n\nThe app builds the combined PDF for each bureau for you — download all three from the Package tab.\nMail each one via USPS Certified Mail with tracking." },
  { phase: "Phase 2 · Step 3", color: "#059669", title: "Document Preparation Rules", body: "ID documents: show ALL FOUR corners, easily legible, no light/dark spots. Never crop corners.\n\nProof of address: crop out the date (over 30 days = rejected). Show only name + company name + your address.\n\nHighlighter: use yellow or blue ONLY. Never pink — it shows as redacted black on TransUnion.\n\nDates: always use separators. January 15th 2025 or 01/15/2025. NEVER 01152025.\n\nAffidavit: must be notarized. Different per bureau. Don't notarize at a bank you're disputing." },
  { phase: "Phase 2 · Step 4", color: "#DC2626", title: "Mail & Call the Bureaus", body: "Mail all 3 packets via USPS Certified Mail with Return Receipt on the same day. Keep every receipt.\n\nCall fraud department exactly 4 BUSINESS DAYS after confirmed delivery (605B law requires block within 4 days):\n• Equifax: 404-885-8000 (landline) / 888-548-7811 (cell)\n• Experian: 714-830-7000 (landline) / 888-397-3742 (cell)\n• TransUnion: 610-690-4909 (landline) / 800-916-8800 (cell)\n• TransUnion: ask for 'Special Handling' department\n\nNEVER say 'dispute' — say 'block' or 'remove under 605B'. You are a victim of identity theft.\nKill them with kindness. Document: date, time, rep name, rep ID number.\nIf banks call you: say 'wrong number, please remove me' and hang up. Never confirm your identity." },
  { phase: "Phase 2 · Step 5", color: "#7C3AED", title: "Backdoor Methods (Hard Inquiries)", body: "Equifax — online: MyEquifax.com → Dispute Center → upload ID + SSN card + proof of address\n\nTransUnion — online: cannot remove hard inquiries this way. Use phone call after fix packet submitted.\n\nExperian — PHONE ONLY: call 888-397-3742\n• Say: 'I see hard inquiries I don't recognize, please transfer me to fraud department'\n• In fraud dept: 'I see unauthorized hard inquiries, could you remove them?'\n• If asked did you apply: 'I don't recognize it'\n• Removable in 24-72 hours\n• Get case number + rep name + rep ID\n\nOnly target UNATTACHED inquiries — where no matching account exists in your account history section." },
  { phase: "Phase 3", color: "#0F172A", title: "Build to 800+ Club", body: "Six boxes must all be green:\n• Payment history: 100% on time\n• Utilization: 0-3%\n• Derogatory remarks: 0\n• Credit age: 9+ years\n• Total accounts: 21+\n• Inquiries: 0 per bureau\n\nAuthorized Users (affects 55% of score):\n• Look for: 9+ years old, under 9% utilization, no derogatory remarks, reports all 3 bureaus\n• Best cards: Chase, BofA, Capital One, Discover, Elan, Barclays\n• Avoid Citibank (only 2 bureaus)\n\nMass Apply Strategy:\n• Only when score is 800+\n• Apply 4-5 cards at a time\n• Each group drops ~20 points — still above 780 threshold\n• 780+ = best rates on everything" },
];

export default function App() {
  const [tab,         setTab]         = useState(0);
  const [messages,    setMessages]    = useState([]);
  const [history,     setHistory]     = useState([]);
  const [input,       setInput]       = useState("");
  const [busy,        setBusy]        = useState(false);
  const [pkg,         setPkg]         = useState(null);
  const [docTab,      setDocTab]      = useState("equifax");
  const [copied,      setCopied]      = useState("");
  const [progress,    setProgress]    = useState(0);
  const [statusTxt,   setStatusTxt]   = useState("Ready to begin");
  const [uploads,     setUploads]     = useState([]);
  const [docFiles,    setDocFiles]    = useState([]);
  const [slots,       setSlots]       = useState({});
  const [approved,    setApproved]    = useState(false);
  const [showReview,  setShowReview]  = useState(false);
  const [clientId,    setClientId]    = useState(null);
  const [profile,     setProfile]     = useState(null);
  const profileRef                    = useRef(null);
  const [restored,    setRestored]    = useState(false);
  const [dragActive,  setDragActive]  = useState(false);

  // Save client to Supabase
  async function saveClient(data) {
    if (!supabase) return null;
    try {
      const { data: client, error } = await supabase
        .from("clients")
        .insert([{
          name: data.clientName || null,
          address: data.clientAddress || null,
          dob: data.dob || null,
          ssn4: data.ssn4 || null,
          ftc_number: data.ftcNumber || null,
          status: "intake",
          brandon_notes: data.brandonsNotes || null,
        }])
        .select()
        .single();
      if (error) throw error;
      setClientId(client.id);
      return client.id;
    } catch (e) {
      console.error("saveClient error:", e.message);
      return null;
    }
  }

  // Save package to Supabase
  async function savePackage(cid, data) {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("packages")
        .insert([{
          client_id: cid,
          equifax: data.equifax || null,
          experian: data.experian || null,
          transunion: data.transunion || null,
          personal_info: data.personalInfo || null,
          ftc_guide: data.ftcGuide || null,
          checklist: data.checklist || null,
          packet_order: data.packetOrder || null,
          dispute_items: data.disputeItems || null,
        }]);
      if (error) throw error;
    } catch (e) {
      console.error("savePackage error:", e.message);
    }
  }

  // Upload file to Supabase Storage
  async function uploadToSupabase(file, cid) {
    if (!supabase) return null;
    try {
      const ext = file.name.split(".").pop();
      const path = `${cid}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("client-documents")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("client-documents")
        .getPublicUrl(path);
      // Save document record
      await supabase.from("documents").insert([{
        client_id: cid,
        file_name: file.name,
        file_url: urlData?.publicUrl || path,
        file_type: file.type,
        file_size: file.size,
      }]);
      return path;
    } catch (e) {
      console.error("uploadToSupabase error:", e.message);
      return null;
    }
  }

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const fileRef   = useRef(null);
  const ready     = !!pkg;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  // On load: resume this client's saved progress if any; otherwise start a fresh intake.
  useEffect(() => {
    let didRestore = false;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.messages) && s.messages.length) {
          setMessages(s.messages);
          setHistory(Array.isArray(s.history) ? s.history : []);
          if (s.profile) { profileRef.current = s.profile; setProfile(s.profile); }
          if (s.pkg) setPkg(s.pkg);
          if (s.slots) setSlots(s.slots);
          if (Array.isArray(s.docFiles)) setDocFiles(s.docFiles);
          if (Array.isArray(s.uploads)) setUploads(s.uploads);
          if (typeof s.progress === "number") setProgress(s.progress);
          if (s.statusTxt) setStatusTxt(s.statusTxt);
          if (s.approved) setApproved(true);
          if (s.clientId) setClientId(s.clientId);
          didRestore = true;
        }
      }
    } catch (e) { console.error("restore error:", e.message); }
    setRestored(true);
    if (!didRestore) initAgent();
  }, []);

  // Autosave progress so a client can close the tab and resume where they left off.
  useEffect(() => {
    if (!restored) return;
    const snap = { v: 1, ts: Date.now(), messages, history, profile: profileRef.current, pkg, slots, docFiles, uploads, progress, statusTxt, approved, clientId };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(snap));
    } catch {
      // Storage full — keep the conversation, profile and package; drop heavy file data.
      try {
        const lightSlots = {};
        Object.keys(slots || {}).forEach(k => { const v = slots[k]; lightSlots[k] = v ? { name: v.name, type: v.type } : v; });
        const lightDocs = (docFiles || []).map(d => ({ name: d.name, type: d.type }));
        localStorage.setItem(SESSION_KEY, JSON.stringify({ ...snap, slots: lightSlots, docFiles: lightDocs, filesDropped: true }));
      } catch (e2) { console.error("autosave failed:", e2.message); }
    }
  }, [restored, messages, history, pkg, slots, docFiles, uploads, progress, statusTxt, approved, clientId, profile]);

  // Clear saved progress and start a brand-new client on this device.
  function resetSession() {
    if (!window.confirm("Start a new client? This clears the current progress saved on this device.")) return;
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    setMessages([]); setHistory([]); setPkg(null); setSlots({}); setDocFiles([]);
    setUploads([]); setProgress(0); setStatusTxt("Ready to begin"); setApproved(false);
    setClientId(null); setProfile(null); profileRef.current = null; setDocTab("equifax"); setTab(0);
    initAgent();
  }

  // Pull the model's running memory block out of a reply, parse it, and return
  // the clean text the client should actually see (state block removed).
  function extractState(txt) {
    const m = txt.match(/###STATE###([\s\S]*?)###END###/);
    if (!m) return { clean: txt, state: null };
    const clean = txt.replace(/###STATE###[\s\S]*?###END###/, "").trim();
    let state = null;
    try { state = JSON.parse(m[1].trim()); } catch { state = null; }
    return { clean, state };
  }

  // Merge new state into memory — never wipe a field that was already filled.
  function applyState(state) {
    if (!state) return;
    const merged = { ...(profileRef.current || {}), ...state };
    profileRef.current = merged;
    setProfile(merged);
  }

  // SYSTEM prompt + the authoritative "already collected" block, injected every call.
  function buildSystem() {
    if (!profileRef.current) return SYSTEM;
    return SYSTEM +
      "\n\n═══════════════════════════════════════════\nCONFIRMED CLIENT STATE (authoritative — do NOT re-ask any filled field)\n═══════════════════════════════════════════\n" +
      JSON.stringify(profileRef.current, null, 2);
  }

  // Replace heavy base64 document/image blocks with a light placeholder so a raw
  // file is sent to the model only once, never re-sent on every later turn.
  function lighten(content) {
    if (!Array.isArray(content)) return content;
    return content.map(b =>
      (b && (b.type === "document" || b.type === "image"))
        ? { type: "text", text: `[${b.type} was uploaded earlier and already read — extracted data is in CONFIRMED CLIENT STATE]` }
        : b
    );
  }

  // Strip heavy attachments from EVERY message — used to recover from an oversized
  // payload so the client can never get stuck in a 413 loop.
  function lightenAll(hist) {
    return hist.map(m => ({ ...m, content: lighten(m.content) }));
  }

  // Approximate byte size of an outgoing request body, for pre-flight size checks.
  function bodySize(msgs) {
    try { return JSON.stringify({ system: buildSystem(), messages: msgs }).length; }
    catch { return Infinity; }
  }

  async function callAPI(msgs, maxTok = 900) {
    let res;
    try {
      res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model: "claude-sonnet-4-6", 
          max_tokens: maxTok, 
          system: buildSystem(), 
          messages: msgs 
        }),
      });
    } catch (networkErr) {
      throw new Error("NETWORK_ERROR: " + networkErr.message);
    }

    let d;
    try {
      d = await res.json();
    } catch {
      throw new Error("PARSE_ERROR: status " + res.status);
    }

    if (!res.ok) {
      const errMsg = d?.error?.message || d?.error || JSON.stringify(d);
      throw new Error("API_ERROR " + res.status + ": " + errMsg);
    }

    return d.content?.[0]?.text || "";
  }

  async function initAgent() {
    setBusy(true);
    setStatusTxt("Connecting...");
    const init = [{ role: "user", content: "START_INTAKE" }];
    try {
      const txt = await callAPI(init, 500);
      const { clean, state } = extractState(txt);
      applyState(state);
      setHistory([...init, { role: "assistant", content: clean }]);
      setMessages([{ from: "agent", text: clean }]);
      setProgress(8);
      setStatusTxt("Collecting client information");
    } catch (e) {
      console.error("initAgent error:", e.message);
      const fallback = "Welcome to Credit Counsel Elite.\n\nI'm your AI intake agent — I'll handle all the heavy lifting so your dispute package is ready to mail.\n\nYou can start by uploading your credit report, or simply tell me your full legal name and we'll go from there.";
      setHistory([{ role: "user", content: "START_INTAKE" }, { role: "assistant", content: fallback }]);
      setMessages([{ from: "agent", text: fallback }]);
      setProgress(8);
      setStatusTxt("Collecting client information");
    }
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 200);
  }

  // Safely pull the PACKAGE_READY JSON out of a reply. Tolerates code fences and any
  // trailing text, and returns null if the JSON is incomplete (truncated) — so a raw
  // or broken JSON blob never leaks into the chat.
  function parsePackage(clean) {
    const marker = "PACKAGE_READY:";
    const i = clean.indexOf(marker);
    if (i === -1) return null;
    let after = clean.slice(i + marker.length).trim()
      .replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
    const start = after.indexOf("{");
    if (start === -1) return null;
    let depth = 0, end = -1, inStr = false, esc = false;
    for (let k = start; k < after.length; k++) {
      const ch = after[k];
      if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; }
      else if (ch === '"') inStr = true;
      else if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) { end = k; break; } }
    }
    if (end === -1) return null; // truncated — incomplete JSON
    try { return JSON.parse(after.slice(start, end + 1)); } catch { return null; }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages(prev => [...prev, { from: "user", text }]);
    setBusy(true);
    const newHist = [...history, { role: "user", content: text }];
    setHistory(newHist);
    const turns = newHist.filter(m => m.role === "user").length;
    setProgress(Math.min(85, 8 + turns * 10));
    if (turns === 1) setStatusTxt("Collecting personal info");
    else if (turns === 3) setStatusTxt("Gathering dispute details");
    else if (turns >= 5) setStatusTxt("Finalizing package...");
    try {
      const txt = await callAPI(newHist, 8000);
      const { clean, state } = extractState(txt);
      applyState(state);
      const updHist = [...newHist, { role: "assistant", content: clean }];
      setHistory(updHist);
      if (clean.includes("PACKAGE_READY:")) {
        setProgress(95); setStatusTxt("Generating package…");
        const json = parsePackage(clean);
        if (json) {
          setPkg(json);
          setProgress(100);
          setStatusTxt("Package complete");
          const cid = clientId || await saveClient(json);
          if (cid) await savePackage(cid, json);
          setMessages(prev => [...prev, { from: "agent", text: `Your three packages are ready, ${json.clientName?.split(" ")[0] || ""}. Open the Package tab to review and download each bureau's PDF. Brandon will review before you print and mail.` }]);
          setTimeout(() => { setTab(1); setShowReview(true); }, 1800);
        } else {
          setProgress(85); setStatusTxt("Finalizing package…");
          setMessages(prev => [...prev, { from: "agent", text: "I have everything I need. Reply \"generate\" and I will build your three packages." }]);
        }
      } else {
        setMessages(prev => [...prev, { from: "agent", text: clean }]);
      }
    } catch (e) {
      console.error("send error:", e.message);
      if (e.message.includes("413")) {
        setHistory(prev => lightenAll(prev));
        setMessages(prev => [...prev, { from: "agent", text: "The conversation got too large to send — usually a big attachment. I've cleared cached file data from our active chat (your documents are still saved in storage). Please send your last message again and we'll keep going." }]);
      } else {
        setMessages(prev => [...prev, { from: "agent", text: "Error: " + e.message + "\n\nPlease screenshot this and send to support." }]);
      }
    }
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setUploads(prev => [...prev, ...files.map(f => ({ name: f.name, size: f.size }))]);
    setMessages(prev => [...prev, { from: "user", text: `Uploading: ${files.map(f => f.name).join(", ")}` }]);
    setBusy(true);
    setStatusTxt("Uploading documents...");

    // Upload files to Supabase Storage (no size limit)
    const cid = clientId || null;
    for (const file of files) {
      if (cid) await uploadToSupabase(file, cid);
    }

    // Also read files for AI extraction (compress large files first)
    setStatusTxt("Reading documents...");
    const fileData = await Promise.all(files.map(f => new Promise(res => {
      const r = new FileReader();
      r.onload = ev => res({ name: f.name, type: f.type, size: f.size, data: ev.target.result });
      r.readAsDataURL(f);
    })));

    // Keep images/PDFs so we can assemble them into the mailable packet PDF later.
    const docs = fileData.filter(f => f.type.startsWith("image/") || f.type === "application/pdf");
    setDocFiles(prev => [...prev, ...docs.map(f => ({ name: f.name, type: f.type, dataUrl: f.data }))]);
    // Auto-sort each into its packet slot (first empty matching slot) so the packet
    // assembles in the correct order; can be corrected in the Documents tab.
    setSlots(prev => {
      const next = { ...prev };
      for (const f of docs) {
        const cat = inferSlot(f.name);
        if (cat && !next[cat]) next[cat] = { name: f.name, type: f.type, dataUrl: f.data };
      }
      return next;
    });

    const blocks = [];
    for (const fd of fileData) {
      // Only send reasonably-sized files to the AI; larger ones live in Supabase only.
      if (fd.size > 3 * 1024 * 1024) {
        blocks.push({ type: "text", text: `File "${fd.name}" (${Math.round(fd.size/1024/1024)}MB) has been saved to secure storage. It is too large to read automatically — please tell me the key information from this document.` });
      } else if (fd.type === "application/pdf") {
        blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: fd.data.split(",")[1] } });
      } else if (fd.type.startsWith("image/")) {
        blocks.push({ type: "image", source: { type: "base64", media_type: fd.type, data: fd.data.split(",")[1] } });
      }
    }
    blocks.push({ type: "text", text: `I uploaded: ${files.map(f => f.name).join(", ")}. Please read carefully, extract all info, tell me what you found, and ask for anything still needed.` });

    // Pre-flight: keep the request under Vercel's body limit so it can't 413.
    let userBlocks = blocks;
    let newHist = [...history, { role: "user", content: userBlocks }];
    if (bodySize(newHist) > SAFE_BODY_LIMIT) {
      // 1) Drop the weight of earlier turns first.
      newHist = [...lightenAll(history), { role: "user", content: userBlocks }];
    }
    if (bodySize(newHist) > SAFE_BODY_LIMIT) {
      // 2) The new file itself is too big — keep it in storage, send only a note.
      userBlocks = [{ type: "text", text: `I uploaded ${files.map(f => f.name).join(", ")}, but it is too large for me to read automatically. It is saved securely in storage — I will provide the key details by typing them.` }];
      newHist = [...lightenAll(history), { role: "user", content: userBlocks }];
      setMessages(prev => [...prev, { from: "agent", text: "That file is a bit large for automatic reading, but it's saved securely. Upload a smaller PDF or a JPG screenshot of the report, or just type the key details — and we'll keep moving." }]);
    }
    setHistory(newHist);
    try {
      const txt = await callAPI(newHist, 8000);
      const { clean, state } = extractState(txt);
      applyState(state);
      // Store a lightened copy so the raw file isn't re-sent on every later turn.
      const lightHist = [...lightenAll(history), { role: "user", content: lighten(userBlocks) }];
      const updHist = [...lightHist, { role: "assistant", content: clean }];
      setHistory(updHist);
      if (clean.includes("PACKAGE_READY:")) {
        const json = parsePackage(clean);
        if (json) {
          setPkg(json); setProgress(100); setStatusTxt("Package complete");
          const cid = clientId || await saveClient(json);
          if (cid) await savePackage(cid, json);
          setMessages(prev => [...prev, { from: "agent", text: `Your three packages are ready. Open the Package tab to review and download each bureau's PDF.` }]);
          setTimeout(() => { setTab(1); setShowReview(true); }, 1400);
        } else {
          setProgress(85); setStatusTxt("Documents read — continuing intake");
          setMessages(prev => [...prev, { from: "agent", text: "I have read your documents. Reply \"generate\" and I will build your three packages." }]);
        }
      } else {
        setMessages(prev => [...prev, { from: "agent", text: clean }]);
        setProgress(prev => Math.min(80, prev + 15));
        setStatusTxt("Documents read — continuing intake");
      }
    } catch (e) {
      // Self-heal: strip all heavy attachments so the client is never stuck in a loop.
      setHistory(lightenAll(history));
      setUploads(prev => prev.slice(0, -files.length));
      if (e.message.includes("413")) {
        setMessages(prev => [...prev, { from: "agent", text: "That file was too large to process, so I cleared it from our chat. It is still saved in your storage. Upload a smaller PDF or a photo of the report, or type the key details and we will continue." }]);
      } else {
        setMessages(prev => [...prev, { from: "agent", text: "I had trouble reading that file. I've cleared it so we can keep going — please try again with a smaller file, or type the information manually." }]);
      }
    }
    setBusy(false);
    inputRef.current?.focus();
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(""), 2200); });
  }

  // Load a library on demand from CDN (no build dependency needed).
  function loadScript(src, globalCheck) {
    return new Promise((resolve, reject) => {
      const have = globalCheck();
      if (have) return resolve(have);
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => { const g = globalCheck(); g ? resolve(g) : reject(new Error("library unavailable")); };
      s.onerror = () => reject(new Error("Failed to load " + src));
      document.body.appendChild(s);
    });
  }
  const loadJsPDF = () => loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", () => window.jspdf?.jsPDF);
  const loadPdfLib = () => loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js", () => window.PDFLib);

  function dataURLtoBytes(dataUrl) {
    const b64 = (dataUrl || "").split(",")[1] || "";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  // Build the letters portion of a bureau packet (returns a jsPDF doc, no save).
  // Infer which packet slot an uploaded file belongs to, from its filename.
  function inferSlot(name) {
    const n = (name || "").toLowerCase();
    if (/passport/.test(n)) return "passport";
    if (/affidavit|complaint|victim|idtheftaffidavit|\bh-?1\b/.test(n)) return "affidavit";
    if (/police/.test(n)) return "policeReport";
    if (/ftc|identitytheft|idtheft|theft/.test(n)) return "ftcReport";
    if (/ssn|social/.test(n)) return "ssnCard";
    if (/licen|driver|state.?id|photo.?id|\bdl\b|\bid\b/.test(n)) return "photoID";
    if (/bill|utility|electric|sdge|residence|lease|proof|address/.test(n)) return "proofResidence";
    if (/credit.?report|report|3b|tri|fico|score/.test(n)) return "creditReport";
    return null;
  }

  // The per-bureau letters that lead the packet: a blank page for the client's
  // handwritten cover letter, then the typed cover letter and personal info letter.
  function buildLettersDoc(bureauKey, JsPDF) {
    const b = BUREAUS.find(x => x.key === bureauKey);
    const doc = new JsPDF({ unit: "pt", format: "letter" });
    const M = 56, W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), maxW = W - M * 2;
    let y = M;
    const room = (lh) => { if (y + lh > H - M) { doc.addPage(); y = M; } };
    const heading = (txt, color) => { room(30); doc.setFont("times", "bold"); doc.setFontSize(15); doc.setTextColor(color || "#0f172a"); doc.text(txt, M, y); y += 10; doc.setDrawColor(210); doc.line(M, y, W - M, y); y += 18; doc.setTextColor("#111111"); };
    const para = (txt, size = 11, lh = 16) => { doc.setFont("times", "normal"); doc.setFontSize(size); doc.setTextColor("#111111"); doc.splitTextToSize(String(txt || ""), maxW).forEach(line => { room(lh); doc.text(line, M, y); y += lh; }); };

    // Page 1 — intentionally blank for the client's handwritten cover letter.
    doc.setFont("times", "italic"); doc.setFontSize(9); doc.setTextColor("#cbd5e1");
    doc.text("Handwrite your cover letter on this page.", M, M);
    doc.setTextColor("#111111");

    // Page 2 — typed cover letter (unchanged wording).
    doc.addPage(); y = M;
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(b.color); doc.text("Credit Counsel Elite", M, y); y += 22;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor("#64748b"); doc.text(`${b.label} Dispute Package — ${pkg.clientName || ""}`, M, y); y += 14;
    doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), M, y); y += 26;
    heading(`Cover Letter — ${b.label}`, b.color);
    para(pkg[bureauKey], 11, 16);
    if (pkg.personalInfo) { doc.addPage(); y = M; heading("Personal Information Correction Letter", "#374151"); para(pkg.personalInfo, 11, 16); }
    return doc;
  }

  // The standard FCRA 605B law page that closes every packet.
  function build605BDoc(JsPDF) {
    const doc = new JsPDF({ unit: "pt", format: "letter" });
    const M = 56, W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), maxW = W - M * 2;
    let y = M;
    doc.setFont("times", "normal"); doc.setFontSize(11); doc.setTextColor("#111111");
    FCRA_605B_TEXT.split("\n").forEach(line => {
      doc.splitTextToSize(line, maxW).forEach(seg => { if (y + 15 > H - M) { doc.addPage(); y = M; } doc.text(seg, M, y); y += 15; });
    });
    return doc;
  }

  // Auto-filled Identity Theft Affidavit, used when the client has not uploaded a
  // notarized one. Fills their details and the fraudulent items; leaves signature and
  // notary blank so they print it, sign, and have it notarized.
  function buildAffidavitDoc(bureauKey, JsPDF) {
    const b = BUREAUS.find(x => x.key === bureauKey);
    const doc = new JsPDF({ unit: "pt", format: "letter" });
    const M = 56, W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), maxW = W - M * 2;
    let y = M;
    const room = (lh) => { if (y + lh > H - M) { doc.addPage(); y = M; } };
    const line = (txt, opt = {}) => {
      const { size = 11, bold = false, gap = 16, color = "#111111" } = opt;
      doc.setFont("times", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(color);
      doc.splitTextToSize(String(txt || ""), maxW).forEach(s => { room(gap); doc.text(s, M, y); y += gap; });
    };
    const items = (pkg.disputeItems && pkg.disputeItems[bureauKey]) || [];
    const accounts = items.filter(s => !/inquiry/i.test(s));
    const inquiries = items.filter(s => /inquiry/i.test(s));
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor("#0f172a");
    room(26); doc.text("Identity Theft Victim's Affidavit", M, y); y += 24;
    line(`Submitted to ${b.label}`, { color: "#64748b", gap: 18 });
    line(`Affiant: ${pkg.clientName || ""}`);
    line(`Date of Birth: ${pkg.dob || ""}`);
    line(`Social Security Number: ${pkg.ssn4 ? "XXX-XX-" + pkg.ssn4 : ""}`);
    line(`Address: ${pkg.clientAddress || ""}`);
    y += 8;
    line("I declare that I am a victim of identity theft. The accounts and inquiries listed below were opened or made without my knowledge, consent, or authorization. I did not authorize, use, benefit from, or receive any goods, services, or money from them, and I believe they are the result of identity theft.");
    y += 6;
    if (accounts.length) { line("Fraudulent accounts:", { bold: true, gap: 18 }); accounts.forEach((a, i) => line(`${i + 1}. ${a}`, { gap: 15 })); y += 4; }
    if (inquiries.length) { line("Unauthorized inquiries:", { bold: true, gap: 18 }); inquiries.forEach((a, i) => line(`${i + 1}. ${a}`, { gap: 15 })); y += 4; }
    y += 6;
    line("I declare under penalty of perjury under the laws of the United States that the foregoing is true and correct.");
    y += 28;
    line("Signature: ______________________________     Date: ______________", { gap: 26 });
    y += 16;
    line("Notary Acknowledgment", { bold: true, gap: 20 });
    line("State of ____________________   County of ____________________", { gap: 24 });
    line("Subscribed and sworn to before me this ______ day of ______________, 20____.", { gap: 24 });
    line("Notary Public: ______________________________", { gap: 24 });
    line("My commission expires: __________________", { gap: 18 });
    return doc;
  }

  // Build ONE complete mailable PDF per bureau, in Brandon's exact order:
  // cover letter → personal info → ID/passport/SSN/bill → credit report → FTC report
  // → affidavit → FCRA 605B. Documents come from the slots; chat uploads are the fallback.
  async function downloadBureauPacket(bureauKey) {
    const b = BUREAUS.find(x => x.key === bureauKey);
    if (!pkg || !b || !pkg[bureauKey]) return;
    const safe = (pkg.clientName || "client").replace(/[^a-z0-9]+/gi, "_");
    try {
      setStatusTxt(`Building ${b.label} packet…`);
      const JsPDF = await loadJsPDF();
      const lettersDoc = buildLettersDoc(bureauKey, JsPDF);
      const PDFLib = await loadPdfLib();
      const merged = await PDFLib.PDFDocument.create();
      const appendDoc = async (jsdoc) => {
        const d = await PDFLib.PDFDocument.load(jsdoc.output("arraybuffer"));
        (await merged.copyPages(d, d.getPageIndices())).forEach(p => merged.addPage(p));
      };
      const appendFile = async (f) => {
        try {
          const bytes = dataURLtoBytes(f.dataUrl);
          if (f.type === "application/pdf") {
            const d = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
            (await merged.copyPages(d, d.getPageIndices())).forEach(p => merged.addPage(p));
          } else {
            let img;
            try { img = await merged.embedJpg(bytes); } catch { img = await merged.embedPng(bytes); }
            const page = merged.addPage([612, 792]);
            const s = Math.min((612 - 72) / img.width, (792 - 72) / img.height, 1);
            const w = img.width * s, h = img.height * s;
            page.drawImage(img, { x: (612 - w) / 2, y: (792 - h) / 2, width: w, height: h });
          }
        } catch (inner) { console.error("Skipped document", f.name, inner.message); }
      };
      await appendDoc(lettersDoc);
      // Attach the documents in packet order. If the affidavit was not uploaded,
      // generate a filled one (notary section left blank) and drop it in its place.
      const anySlot = PACKET_SLOTS.some(s => slots[s.key]);
      if (anySlot) {
        for (const s of PACKET_SLOTS) {
          if (slots[s.key]) await appendFile(slots[s.key]);
          else if (s.key === "affidavit") await appendDoc(buildAffidavitDoc(bureauKey, JsPDF));
        }
      } else {
        for (const f of docFiles) await appendFile(f);
        await appendDoc(buildAffidavitDoc(bureauKey, JsPDF));
      }
      await appendDoc(build605BDoc(JsPDF)); // standard law page closes the packet
      const out = await merged.save();
      const blob = new Blob([out], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `CCE_${b.label}_Packet_${safe}.pdf`; a.click();
      URL.revokeObjectURL(url);
      setStatusTxt("Packet downloaded");
    } catch (e) {
      console.error("downloadBureauPacket error:", e.message);
      printBureau(bureauKey); // dependency-free fallback
    }
  }

  // Fallback: open a clean print window for one bureau (browser "Save as PDF").
  function printBureau(bureauKey) {
    const b = BUREAUS.find(x => x.key === bureauKey);
    if (!b || !pkg?.[bureauKey]) return;
    let body = `<div class="sec"><h2 style="color:${b.color}">Cover Letter — ${b.label}</h2><div class="banner">HANDWRITE THIS — copy it word for word in blue or black ink on plain white paper.</div><pre>${pkg[bureauKey] || ""}</pre></div>`;
    if (pkg.personalInfo) body += `<div class="pb"></div><div class="sec"><h2>Personal Information Correction Letter</h2><pre>${pkg.personalInfo}</pre></div>`;
    body += `<div class="pb"></div><div class="sec"><h2 style="color:#059669">Mail Packet — Assembly Order</h2><pre>${pkg.packetOrder || ""}</pre>`;
    if (pkg.checklist?.length) body += `<h3>Document Checklist</h3><ul>${pkg.checklist.map(c => `<li>${c}</li>`).join("")}</ul>`;
    body += `</div>`;
    if (pkg.ftcGuide) body += `<div class="pb"></div><div class="sec"><h2 style="color:#D97706">FTC Filing Guide</h2><pre>${pkg.ftcGuide}</pre></div>`;
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>CCE — ${b.label} Package</title><style>body{font-family:Georgia,serif;max-width:740px;margin:40px auto;padding:0 24px;color:#111;line-height:1.85}h1{color:${b.color};margin-bottom:2px}.sub{color:#888;font-size:12px;margin-bottom:28px}h2{border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin:0 0 14px}h3{margin:18px 0 6px}.sec{margin-bottom:40px}.pb{page-break-after:always}.banner{background:#f3e8ff;color:#6b21a8;font-family:Arial;font-size:11px;font-weight:bold;padding:8px 12px;border-radius:6px;margin-bottom:14px}pre{white-space:pre-wrap;font-size:12px;line-height:1.9;font-family:Georgia,serif}ul{line-height:2.1;font-size:12px}@media print{.pb{page-break-after:always}}</style></head><body><h1>Credit Counsel Elite</h1><div class="sub">${b.label} Dispute Package — ${pkg.clientName || ""} — ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>${body}</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 400);
  }

  // Download a separate full packet PDF for each of the three bureaus.
  async function downloadAllPackets() {
    for (const b of BUREAUS) {
      if (pkg?.[b.key]) { await downloadBureauPacket(b.key); await new Promise(r => setTimeout(r, 700)); }
    }
  }

  function printAll() {
    if (!pkg) return;
    const w = window.open("", "_blank");
    let body = "";
    BUREAUS.forEach((b, i) => { if (pkg[b.key]) body += `<div class="sec"><h2 style="color:${b.color}">${b.label}</h2><pre>${pkg[b.key]}</pre></div>${i < 2 ? '<div class="pb"></div>' : ""}`; });
    if (pkg.personalInfo) body += `<div class="pb"></div><div class="sec"><h2>Personal Information Correction</h2><pre>${pkg.personalInfo}</pre></div>`;
    if (pkg.ftcGuide) body += `<div class="pb"></div><div class="sec"><h2>FTC Filing Guide</h2><pre>${pkg.ftcGuide}</pre></div>`;
    if (pkg.checklist?.length) body += `<div class="pb"></div><div class="sec"><h2>Document Checklist</h2><ul>${pkg.checklist.map(c => `<li>${c}</li>`).join("")}</ul></div>`;
    w.document.write(`<!DOCTYPE html><html><head><title>Credit Counsel Elite</title><style>body{font-family:Georgia,serif;max-width:740px;margin:40px auto;padding:0 24px;color:#111;line-height:1.85}h1{color:#0f172a}.sub{color:#888;font-size:12px;margin-bottom:32px}h2{border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-bottom:16px}.sec{margin-bottom:48px}.pb{page-break-after:always;margin:48px 0;border-top:2px dashed #e2e8f0}pre{white-space:pre-wrap;font-size:12px;line-height:1.9;font-family:Georgia,serif}ul{line-height:2.2;font-size:13px}@media print{.pb{page-break-after:always}}</style></head><body><h1>Credit Counsel Elite</h1><div class="sub">Dispute Package — ${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>${body}</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 400);
  }

  const docTabs = [
    ...BUREAUS.map(b => ({ key: b.key, label: b.label, color: b.color })),
    { key: "personalInfo",    label: "Personal Info",  color: "#374151" },
    { key: "handwrittenNote", label: "Handwritten", color: "#7C3AED" },
    { key: "ftcGuide",        label: "FTC Guide",      color: "#D97706" },
    { key: "documents",       label: "Documents",   color: "#0f766e" },
    { key: "checklist",       label: "Checklist",      color: "#059669" },
  ];

  function setSlotFile(category, file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => setSlots(prev => ({ ...prev, [category]: { name: file.name, type: file.type, dataUrl: ev.target.result } }));
    r.readAsDataURL(file);
  }

  return (
    <div style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif", height: "100vh", display: "flex", flexDirection: "column", background: "#FAFAF9", color: "#0f172a", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
        .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; animation: blink 1.4s ease infinite; margin: 0 2px; }
        @keyframes blink { 0%,100%{opacity:.2;transform:scale(.7)} 50%{opacity:1;transform:scale(1)} }
        @keyframes pulse { 0%,100%{opacity:.5;transform:scale(.85)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .msg { animation: slideUp .2s ease; }
        .tab-btn { transition: all .15s; }
        .tab-btn:hover { opacity: .8; }
        .send-btn:hover:not(:disabled) { transform: scale(1.04); }
        .send-btn:active:not(:disabled) { transform: scale(.96); }
        .upload-area:hover { border-color: #1e3a8a !important; background: #f8faff !important; }
        .action-btn:hover { opacity: .85; }
        .pill-btn:hover { background: #f1f5f9 !important; }
        input:focus { outline: none; border-color: #1e3a8a !important; box-shadow: 0 0 0 3px rgba(30,58,138,.08) !important; }
        textarea:focus { outline: none; border-color: #1e3a8a !important; box-shadow: 0 0 0 3px rgba(30,58,138,.08) !important; }
        .overlay { position: absolute; inset: 0; background: rgba(15,23,42,.6); backdrop-filter: blur(4px); display: flex; align-items: flex-end; z-index: 50; }
        .sheet { background: #fff; border-radius: 20px 20px 0 0; width: 100%; max-height: 80vh; overflow-y: auto; padding: 0 0 32px; }
        .sheet-handle { width: 36px; height: 4px; background: #e2e8f0; border-radius: 2px; margin: 12px auto 20px; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: "#0f172a", flexShrink: 0 }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 0" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "-.3px" }}>Credit Counsel Elite</div>
            <div style={{ color: "#64748b", fontSize: 10, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 1 }}>AI Dispute Agent</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={resetSession} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "#94a3b8", fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>New client</button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: ready ? (approved ? "rgba(16,185,129,.15)" : "rgba(234,179,8,.12)") : "rgba(255,255,255,.06)", border: `1px solid ${ready ? (approved ? "rgba(52,211,153,.25)" : "rgba(234,179,8,.3)") : "rgba(255,255,255,.1)"}` }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: ready ? (approved ? "#34d399" : "#fbbf24") : "#64748b", flexShrink: 0, ...(busy ? { animation: "pulse 1.2s ease infinite" } : {}) }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: ready ? (approved ? "#34d399" : "#fbbf24") : "#94a3b8", letterSpacing: ".2px" }}>
                {ready ? (approved ? "Approved" : "Pending review") : busy ? "Processing…" : "Intake in progress"}
              </span>
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{ display: "flex", padding: "12px 20px 0", gap: 4, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
          {[
            { label: "Intake",   icon: "💬" },
            { label: "Package",  icon: "📋", dot: ready && !approved },
            { label: "Guide",    icon: "📖" },
            { label: "My Case",  icon: "👤", dot: ready && approved },
          ].map((t, i) => (
            <button key={i} onClick={() => setTab(i)} className="tab-btn" style={{ background: "none", border: "none", borderBottom: tab === i ? "2px solid #3b82f6" : "2px solid transparent", padding: "8px 14px 10px", fontSize: 13, fontWeight: tab === i ? 600 : 400, color: tab === i ? "#fff" : "#64748b", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              {t.label}
              {t.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", position: "absolute", top: 8, right: 6 }} />}
            </button>
          ))}
        </div>
      </div>

      {/* ── PROGRESS ── */}
      <div style={{ background: "#fff", padding: "10px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, letterSpacing: ".3px", textTransform: "uppercase" }}>{statusTxt}</span>
          <span style={{ fontSize: 11, color: progress === 100 ? "#059669" : "#3b82f6", fontWeight: 700 }}>{progress}%</span>
        </div>
        <div style={{ height: 3, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? "linear-gradient(90deg,#059669,#34d399)" : "linear-gradient(90deg,#1e3a8a,#3b82f6)", borderRadius: 2, transition: "width .7s cubic-bezier(.4,0,.2,1)" }} />
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* ══ TAB 0: INTAKE ══ */}
        {tab === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.map((m, i) => (
                <div key={i} className="msg" style={m.from === "user" ? { display: "flex", justifyContent: "flex-end" } : { display: "flex", alignItems: "flex-end", gap: 10 }}>
                  {m.from === "agent" && (
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>⚖️</div>
                  )}
                  <div style={m.from === "agent"
                    ? { maxWidth: "80%", background: "#fff", border: "1px solid #f1f5f9", borderRadius: "4px 16px 16px 16px", padding: "12px 16px", fontSize: 14, lineHeight: 1.7, color: "#1e293b", whiteSpace: "pre-wrap", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }
                    : { maxWidth: "78%", background: "#1e3a8a", borderRadius: "16px 16px 4px 16px", padding: "12px 16px", fontSize: 14, lineHeight: 1.65, color: "#fff", whiteSpace: "pre-wrap" }
                  }>{m.text}</div>
                </div>
              ))}
              {busy && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>⚖️</div>
                  <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: "4px 16px 16px 16px", padding: "13px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
                    <span className="dot" /><span className="dot" style={{ animationDelay: ".2s" }} /><span className="dot" style={{ animationDelay: ".4s" }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Upload */}
            <div style={{ padding: "0 16px 8px", flexShrink: 0 }}>
              <div
                className="upload-area"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); if (!dragActive) setDragActive(true); }}
                onDragEnter={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={e => { e.preventDefault(); if (e.currentTarget === e.target) setDragActive(false); }}
                onDrop={e => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
                style={{ border: `1.5px dashed ${dragActive ? "#1e3a8a" : "#e2e8f0"}`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: dragActive ? "#f0f5ff" : "#fff", transition: "all .15s" }}>
                <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={e => { handleFiles(e.target.files); e.target.value = ""; }} style={{ display: "none" }} />
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f8faff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#1e3a8a", flexShrink: 0 }}>+</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{dragActive ? "Drop your files here" : "Upload or drag documents here"}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>Credit report, ID, SSN card, FTC report — the agent reads them automatically</div>
                </div>
                {uploads.length > 0 && <div style={{ background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>{uploads.length} uploaded</div>}
              </div>
            </div>

            {/* Input */}
            <div style={{ padding: "0 16px 16px", display: "flex", gap: 8, alignItems: "center", background: "#FAFAF9", flexShrink: 0 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") send(); }}
                placeholder="Type your response..."
                disabled={busy}
                style={{ flex: 1, height: 46, border: "1.5px solid #e2e8f0", borderRadius: 23, padding: "0 18px", fontSize: 14, background: "#fff", fontFamily: "inherit", color: "#1e293b", transition: "all .15s" }}
              />
              <button onClick={send} disabled={busy || !input.trim()} className="send-btn" style={{ width: 46, height: 46, borderRadius: "50%", background: busy || !input.trim() ? "#e2e8f0" : "linear-gradient(135deg,#1e3a8a,#3b82f6)", border: "none", cursor: busy || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={busy || !input.trim() ? "#94a3b8" : "#fff"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* ══ TAB 1: PACKAGE ══ */}
        {tab === 1 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff", position: "relative" }}>
            {!ready ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40, textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f8faff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📬</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>No Package Yet</div>
                <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.65, maxWidth: 260 }}>Complete the intake and your full 3-bureau dispute package will appear here.</div>
                <button onClick={() => setTab(0)} style={{ marginTop: 4, padding: "11px 28px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Start Intake →</button>
              </div>
            ) : (
              <>
                {/* Sub tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "0 16px", overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 }}>
                  {docTabs.map(t => (
                    <button key={t.key} onClick={() => setDocTab(t.key)} className="tab-btn" style={{ background: "none", border: "none", borderBottom: docTab === t.key ? `2px solid ${t.color}` : "2px solid transparent", padding: "12px 12px 10px", fontSize: 12, fontWeight: docTab === t.key ? 700 : 500, color: docTab === t.key ? t.color : "#94a3b8", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {docTab === "documents" ? (
                    <div style={{ padding: "20px 18px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Packet Documents</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16, lineHeight: 1.5 }}>These attach to every bureau packet in this exact order. Uploads from the chat are sorted here automatically — tap any row to set or replace a file.</div>
                      {PACKET_SLOTS.map((s, i) => (
                        <div key={s.key}
                          onDragOver={e => { e.preventDefault(); }}
                          onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) setSlotFile(s.key, e.dataTransfer.files[0]); }}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: slots[s.key] ? "#0f766e" : "#f1f5f9", color: slots[s.key] ? "#fff" : "#94a3b8", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{slots[s.key] ? "✓" : i + 1}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 600 }}>{s.label}</div>
                            <div style={{ fontSize: 11, color: slots[s.key] ? "#0f766e" : "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{slots[s.key]?.name || "Not uploaded"}</div>
                          </div>
                          {slots[s.key] && (
                            <button onClick={() => setSlots(prev => { const n = { ...prev }; delete n[s.key]; return n; })} style={{ background: "none", border: "none", color: "#cbd5e1", fontSize: 16, cursor: "pointer", padding: "0 4px" }}>✕</button>
                          )}
                          <label style={{ fontSize: 12, fontWeight: 600, color: "#0f766e", border: "1.5px solid #99f6e4", borderRadius: 8, padding: "6px 12px", cursor: "pointer", flexShrink: 0 }}>
                            {slots[s.key] ? "Replace" : "Upload"}
                            <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={e => { setSlotFile(s.key, e.target.files[0]); e.target.value = ""; }} />
                          </label>
                        </div>
                      ))}
                      <div style={{ marginTop: 16, background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#0f766e", lineHeight: 1.6 }}>
                        The FCRA 605B law page is added to every packet automatically — no upload needed. Use the green Download button below to generate each bureau's complete PDF.
                      </div>
                    </div>
                  ) : docTab === "checklist" ? (
                    <div style={{ padding: "20px 18px" }}>
                      {pkg?.packetOrder && (
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>Fix Packet Order</div>
                          <div style={{ fontSize: 12, color: "#166534", lineHeight: 1.8 }}>{pkg.packetOrder}</div>
                        </div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Documents — Include in Every Envelope</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Check each item off before mailing</div>
                      {(pkg.checklist || []).map((item, i) => (
                        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #f8faff" }}>
                          <div style={{ width: 18, height: 18, borderRadius: 5, border: "2px solid #e2e8f0", flexShrink: 0, marginTop: 1 }} />
                          <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{item}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: 20, background: "#f8faff", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#1e3a8a", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>Freeze These First</div>
                        {[["Innovis","1-800-540-2505"],["LexisNexis","1-800-456-6004"],["SageStream","1-888-395-0277"],["ARS","1-888-456-6004"]].map(([n,p]) => (
                          <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                            <span style={{ fontSize: 12, color: "#64748b" }}>{n}</span>
                            <span style={{ fontSize: 12, color: "#1e3a8a", fontWeight: 600 }}>{p}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "#f8faff", borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#1e3a8a", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>Backdoor Bureau Numbers</div>
                        {[["Equifax (landline)","404-885-8000"],["Equifax (cell)","888-548-7811"],["Experian (landline)","714-830-7000"],["Experian (cell)","888-397-3742"],["TransUnion (landline)","610-690-4909"],["TransUnion (cell)","800-916-8800"]].map(([n,p]) => (
                          <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                            <span style={{ fontSize: 12, color: "#64748b" }}>{n}</span>
                            <span style={{ fontSize: 12, color: "#1e3a8a", fontWeight: 600 }}>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : docTab === "handwrittenNote" ? (
                    <div style={{ padding: "20px 18px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Your Handwritten Cover Letter</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, lineHeight: 1.6 }}>Copy this letter word for word on plain white paper using blue or black pen. Your handwriting defeats bureau detection systems that flag credit repair company templates.</div>
                      <div style={{ background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>Important Instructions</div>
                        <div style={{ fontSize: 12, color: "#6b21a8", lineHeight: 1.65 }}>{pkg?.handwrittenNote || "Write this letter by hand. Do not type or print it. Use plain white paper and blue or black ink."}</div>
                      </div>
                      <pre style={{ fontSize: 12, lineHeight: 2, color: "#374151", whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", margin: 0, background: "#fffbeb", padding: 16, borderRadius: 10, border: "1px solid #fde68a" }}>{pkg?.equifax || ""}</pre>
                      <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Note: Write a separate letter for each bureau. The content will be slightly different per bureau based on what items appear there.</div>
                    </div>
                  ) : docTab === "ftcGuide" ? (
                    <div style={{ padding: "20px 18px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>FTC Identity Theft Report Guide</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>Personalized for your specific case</div>
                      <a href="https://www.identitytheft.gov" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#1e3a8a", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 16 }}>
                        <span>🔗</span> Open IdentityTheft.gov
                        <svg style={{ marginLeft: "auto" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                      </a>
                      <pre style={{ fontSize: 12, lineHeight: 1.9, color: "#374151", whiteSpace: "pre-wrap", fontFamily: "Georgia,serif", margin: 0 }}>{pkg.ftcGuide}</pre>
                    </div>
                  ) : (
                    <pre style={{ fontSize: 12, lineHeight: 1.95, color: "#374151", whiteSpace: "pre-wrap", fontFamily: "Georgia,serif", padding: "20px 18px", margin: 0 }}>{pkg[docTab] || ""}</pre>
                  )}
                </div>

                {/* Footer */}
                <div style={{ padding: "12px 16px 16px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {docTab !== "checklist" && (
                      <button onClick={() => copyText(pkg[docTab] || "", docTab)} className="action-btn" style={{ flex: 1, height: 42, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#fff", border: "1.5px solid #e2e8f0", color: "#374151" }}>
                        {copied === docTab ? "✓ Copied" : "Copy"}
                      </button>
                    )}
                    <button
                      onClick={() => (BUREAUS.some(b => b.key === docTab) ? downloadBureauPacket(docTab) : downloadAllPackets())}
                      className="action-btn"
                      style={{ flex: 2, height: 42, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#0f766e", border: "none", color: "#fff" }}>
                      ⬇ {BUREAUS.some(b => b.key === docTab) ? `Download ${BUREAUS.find(b => b.key === docTab)?.label} packet PDF` : "Download all 3 bureau packets"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {!approved ? (
                      <button onClick={() => setShowReview(true)} style={{ flex: 1, height: 42, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#fef3c7", border: "1.5px solid #fde68a", color: "#92400e" }}>
                        ⚡ Brandon — Review
                      </button>
                    ) : (
                      <button onClick={printAll} className="action-btn" style={{ flex: 1, height: 42, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#1e3a8a", border: "none", color: "#fff" }}>
                        Print full package ✓
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Brandon review sheet */}
            {showReview && pkg && (
              <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowReview(false); }}>
                <div className="sheet">
                  <div className="sheet-handle" />
                  <div style={{ padding: "0 20px" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Brandon's Review</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>Quick check before client prints and mails</div>

                    <div style={{ background: "#f8faff", borderRadius: 12, padding: "14px 16px", marginBottom: 14, border: "1px solid #e8f0fe" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#1e3a8a", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>Client</div>
                      {[["Name", pkg.clientName],["Address", pkg.clientAddress],["DOB", pkg.dob],["SSN Last 4", pkg.ssn4 ? "XXX-XX-" + pkg.ssn4 : "—"]].map(([k,v]) => (
                        <div key={k} style={{ display: "flex", padding: "4px 0" }}>
                          <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 90 }}>{k}</span>
                          <span style={{ fontSize: 12, color: "#1e293b", fontWeight: 600 }}>{v || "—"}</span>
                        </div>
                      ))}
                    </div>

                    {pkg.disputeItems && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>Disputed Items</div>
                        {BUREAUS.map(b => (pkg.disputeItems[b.key]?.length > 0) && (
                          <div key={b.key} style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: b.color, marginBottom: 5 }}>{b.label}</div>
                            {pkg.disputeItems[b.key].map((item, j) => (
                              <div key={j} style={{ fontSize: 12, color: "#374151", padding: "3px 0 3px 10px", borderLeft: `2px solid ${b.color}`, marginBottom: 3 }}>{item}</div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {pkg.brandonsNotes && (
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>⚠ AI Notes</div>
                        <div style={{ fontSize: 12, color: "#78350f", lineHeight: 1.65 }}>{pkg.brandonsNotes}</div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setShowReview(false); setTab(0); }} className="pill-btn" style={{ flex: 1, height: 44, borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#f8faff", border: "1.5px solid #e2e8f0", color: "#64748b" }}>Request Edit</button>
                      <button onClick={() => { setApproved(true); setShowReview(false); }} style={{ flex: 2, height: 44, borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "linear-gradient(135deg,#059669,#10b981)", border: "none", color: "#fff" }}>✓ Approve</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB 2: GUIDE ══ */}
        {tab === 2 && (
          <div style={{ flex: 1, overflowY: "auto", padding: "0 0 24px" }}>
            <div style={{ padding: "18px 18px 14px", background: "#fff", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Brandon's Credit Sweep System</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>Follow these steps in exact order.</div>
            </div>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {GUIDE.map((g, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: g.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: g.color, letterSpacing: "1px", textTransform: "uppercase" }}>{g.phase}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>{g.title}</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.72, whiteSpace: "pre-line" }}>{g.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB 3: MY CASE ══ */}
        {tab === 3 && (
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 28 }}>
            {/* Hero */}
            <div style={{ background: approved ? "linear-gradient(135deg,#059669,#10b981)" : ready ? "linear-gradient(135deg,#1e3a8a,#3b82f6)" : "linear-gradient(135deg,#1e293b,#334155)", padding: "24px 20px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {approved ? "✅" : ready ? "📋" : "⏳"}
                </div>
                <div>
                  <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>
                    {approved ? "Package Approved — Ready to Mail" : ready ? "Pending Brandon's Review" : "Intake In Progress"}
                  </div>
                  <div style={{ color: "#fff", fontSize: 19, fontWeight: 700 }}>{pkg?.clientName || "Your Credit Case"}</div>
                </div>
              </div>
              {/* Steps */}
              {[
                { label: "Intake Started",     done: progress > 5 },
                { label: "Documents Uploaded", done: uploads.length > 0 },
                { label: "Package Generated",  done: ready },
                { label: "Brandon Approved",   done: approved },
                { label: "Ready to Mail",      done: approved },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 4 ? 8 : 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: s.done ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, color: s.done ? "#1e3a8a" : "transparent" }}>{s.done ? "✓" : ""}</div>
                  <span style={{ fontSize: 12, color: s.done ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.4)", fontWeight: s.done ? 600 : 400 }}>{s.label}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Profile */}
              {pkg && (
                <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f8faff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Your Profile</span>
                    <span style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>Verified ✓</span>
                  </div>
                  {[["Full Name", pkg.clientName],["Address", pkg.clientAddress],["Date of Birth", pkg.dob],["SSN on File", pkg.ssn4 ? "XXX-XX-" + pkg.ssn4 : "—"]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", padding: "10px 16px", borderBottom: "1px solid #f8faff" }}>
                      <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 110, flexShrink: 0 }}>{k}</span>
                      <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 600 }}>{v || "—"}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents */}
              <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f8faff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Documents</span>
                  <button onClick={() => { setTab(0); setTimeout(() => fileRef.current?.click(), 300); }} style={{ fontSize: 11, color: "#1e3a8a", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>+ Add</button>
                </div>
                {uploads.length === 0 ? (
                  <div style={{ padding: "20px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>No documents uploaded yet</div>
                    <button onClick={() => { setTab(0); setTimeout(() => fileRef.current?.click(), 300); }} style={{ padding: "8px 18px", background: "#f8faff", color: "#1e3a8a", border: "1.5px dashed #bfdbfe", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Upload Documents</button>
                  </div>
                ) : uploads.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: i < uploads.length - 1 ? "1px solid #f8faff" : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f8faff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                      {f.name.toLowerCase().includes("ftc") || f.name.toLowerCase().includes("identity") ? "🛡️" : f.name.toLowerCase().includes("credit") || f.name.toLowerCase().includes("report") ? "📊" : f.name.endsWith(".pdf") ? "📄" : "🪪"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{f.size ? Math.round(f.size / 1024) + " KB" : ""}</div>
                    </div>
                    <div style={{ fontSize: 14, color: "#34d399" }}>✓</div>
                  </div>
                ))}
              </div>

              {/* Next steps */}
              <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f8faff" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Next Steps</span>
                </div>
                {[
                  { done: uploads.length > 0, icon: "📎", label: "Upload your documents",       sub: "Credit report, ID, SSN card, utility bill",          action: () => { setTab(0); setTimeout(() => fileRef.current?.click(), 300); }, btn: "Upload" },
                  { done: ready,              icon: "📋", label: "Package generated",            sub: "AI built your 3-bureau letters",                    action: () => setTab(1), btn: "Review" },
                  { done: approved,           icon: "⚡", label: "Brandon reviews your case",   sub: "Usually within 24 hours",                           action: null, btn: null },
                  { done: false,              icon: "📬", label: "Print & mail your letters",   sub: "Send via USPS Certified Mail",                      action: () => setTab(1), btn: approved ? "Print" : null },
                  { done: false,              icon: "🛡️", label: "File your FTC report",        sub: "At IdentityTheft.gov — guide inside the app",       action: () => { setTab(1); setDocTab("ftcGuide"); }, btn: ready ? "View Guide" : null },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < 4 ? "1px solid #f8faff" : "none", opacity: s.done ? .5 : 1 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: s.done ? "#f0fdf4" : "#f8faff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{s.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
                        {s.done && <span style={{ color: "#34d399", fontSize: 12 }}>✓</span>}
                        {s.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{s.sub}</div>
                    </div>
                    {s.btn && s.action && !s.done && (
                      <button onClick={s.action} style={{ padding: "6px 13px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>{s.btn}</button>
                    )}
                  </div>
                ))}
              </div>

              {/* Message Brandon */}
              <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f8faff" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Message Brandon</span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <textarea placeholder="Have a question or update for Brandon?" style={{ width: "100%", height: 80, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", color: "#1e293b", resize: "none", background: "#fafafa" }} />
                  <button style={{ marginTop: 8, width: "100%", height: 42, borderRadius: 10, background: "#1e3a8a", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Send Message</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
