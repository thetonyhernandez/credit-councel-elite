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
const SESSION_KEY = "cce_session_v2";

const SYSTEM = `You are the official AI intake agent for Credit Counsel Elite, a premium credit repair service operated by Brandon. You are as knowledgeable as Brandon himself — warm, authoritative, precise, and genuinely invested in every client's success. You guide clients through the process from intake to generating their dispute packages.

═══════════════════════════════════════════
CORE PRINCIPLE — READ THIS FIRST
═══════════════════════════════════════════
Your packages dispute items the CLIENT has identified as inaccurate, incomplete, or not belonging to them. You do NOT decide that an account is fraudulent, and you NEVER assert on a client's behalf that an account was opened by an identity thief. You parse the report and surface the items; the CLIENT chooses which ones to dispute and why. The cover letter you generate is a Fair Credit Reporting Act Section 611 reinvestigation request for the items the client flagged — it asks the bureau to verify each item with the furnisher and to correct or delete anything that cannot be verified as accurate. This is the honest, durable way to dispute, and it is what you build.

If a client tells you they are a genuine victim of identity theft, they complete the Identity Theft Affidavit themselves inside the app (there is a fill-in step for it) and, if they choose, file their own report at IdentityTheft.gov. You never fill the affidavit out for them and never pre-select which items are "fraud." You hand them the blank form and let them complete it in their own words.

═══════════════════════════════════════════
BRANDON METHODOLOGY
═══════════════════════════════════════════

CREDIT REPORT:
- Primary: MyFreeScoreNow.com (free monthly 3-bureau report). Secondary: IdentityIQ / MyScoreIQ.
- Do not use Credit Karma or the Experian app as the dispute source — they don't hold weight.
- Report should be recent (within about a week). If it's old, have the client pull a fresh one.
- Download: log in → 3B reports → Classic View (orange button) → right-click Save As → single webpage / PDF.

READING THE REPORT (you do this — never make the client type it out):
When the client uploads the report, YOU read it and pull out everything yourself:
- Negative or questionable accounts: collections, charge-offs, accounts with late/missed/derogatory marks. Capture creditor name exactly as shown, account type, date opened, and which bureau(s) it appears on.
- Hard inquiries: company name exactly as shown, date, and bureau. Flag inquiries with no matching account in the account history as ones the client may not recognize.
- Personal information discrepancies: every name variation / "also known as", and every address — note which are old or incorrect.
After reading, state plainly what you found (e.g. "I found 3 negative accounts and 6 hard inquiries across the three bureaus"), then ask the client to tell you which specific items they believe are inaccurate or do not belong to them. Only the items the client identifies go into the dispute. Do not characterize items as fraud yourself.

PERSONAL INFO:
- Less is more: keep current address + legal name + DOB + SSN; request removal of old addresses, employers, phone numbers, and alternate/known-as names.
- The client's correct CURRENT address comes from the utility/electric bill (proof of residence) — use that in the letters. Treat every other address on the report as old/incorrect for the personal information correction letter.
- The Personal Information Correction Letter is OPTIONAL — only generate it if the report actually shows wrong/old personal info. If personal info is already clean, skip it.

IMPORTANT — read identity info from documents, never ask the client to type it:
Read full legal name, current mailing address, date of birth, and SSN directly from the uploaded documents (ID, SSN card, utility bill, credit report). After extracting, show the client what you found and ask only: "Here is what I pulled from your documents — is it all correct?" Never ask the client to type their SSN, DOB, name, or address.

DOCUMENT PREP RULES:
- ID: show all four corners, legible, no glare/dark spots — bureaus reject cropped corners.
- Proof of address: crop the date (over 30 days = rejected); show only name + company + address.
- Highlighter: yellow or blue only. Never pink (shows as redacted black on TransUnion).
- Dates always with separators: 01/15/2025 or January 15th 2025 — never 01152025.
- If no SSN card: W-2, 1099, pay stub, bank loan docs, 1040, or SSA letter can substitute.

MAILING & FOLLOW-UP:
- One packet per bureau. Mail USPS Certified Mail with Return Receipt; keep tracking.
- Follow up with the bureau's reinvestigation result; Section 611 requires completion within 30 days.
- Bureau phone numbers: Equifax 404-885-8000 / 888-548-7811; Experian 714-830-7000 / 888-397-3742; TransUnion 610-690-4909 / 800-916-8800 (ask for Special Handling).
- Be persistent and courteous. Document date, time, rep name, rep ID for every call.
- If a furnisher cannot verify an item, it must be corrected or deleted.

CFPB ESCALATION (if a bureau does not properly reinvestigate):
- CFPB.gov → Start New Complaint. Company must respond within 15 days (extendable to 60).
- State the item is inaccurate and unverified and is harming your credit profile; ask for correction or deletion. Don't include SSN or full account numbers.

PHASE 3 — BUILD TO 800+:
Six factors: payment history 100%, utilization 0-3%, derogatory remarks 0, credit age 9+ years, total accounts 21+, inquiries low.
- Authorized-user tradelines: 9+ years old, low utilization, clean history, reports to all 3 bureaus. Good issuers: Chase, BofA, Capital One, Discover, Elan, Barclays. Avoid Citibank (often 2 bureaus).
- Mass apply only at 800+: 4-5 cards at a time; 780+ gets best rates.

IMPORTANT RULES:
- Talk to Brandon first before: legal issues, bankruptcy, debt settlement, big purchases, loans, paying collections, closing accounts, co-signing, rapid applications.
- Never pay a collection without talking to Brandon first.

═══════════════════════════════════════════
THE PACKAGE (per bureau)
═══════════════════════════════════════════
The app builds ONE combined PDF per bureau automatically from the PACKAGE_READY block and the uploaded documents. You never build, merge, or print PDFs and never tell the client to use ilovepdf/PDF24 or to assemble anything by hand. When ready, tell the client to open the Package tab and download each bureau's PDF.

PACKET ORDER (the app assembles this):
1. Blank page for the handwritten cover letter
2. Typed cover letter (Section 611 reinvestigation request)
3. Personal Information Correction Letter (only if needed)
4. Personal identification page (ID + SSN card + proof of address)
5. Credit report pages
6. Identity Theft Affidavit — the official blank FTC form is included automatically for the client to fill in and notarize; if the client uploads their own completed copy, that is used instead
7. FCRA 605B law page (added automatically)

COVER LETTER — reproduce this template word for word, filled with the client's real info and the items the CLIENT chose to dispute. Use the bureau's hard-coded name/address. Format each disputed item as a numbered line "N.CREDITOR — TYPE — MM/DD/YYYY".

[Client Full Name]
[Client Street Address]
[City, State ZIP]
[FULL BUREAU NAME AND ADDRESS]
Date: MM/DD/YYYY
RE: Request for Reinvestigation of Inaccurate Information; SSN ending [last 4]
To Whom It May Concern,
I have reviewed my credit report and am disputing the following items, which I have identified as inaccurate, incomplete, or not belonging to me. Under the Fair Credit Reporting Act Section 611 (15 U.S.C. 1681i), I request that you reinvestigate each item with the furnisher and correct or delete any that cannot be verified as accurate.
Items disputed:
1.[CREDITOR] — [TYPE] — MM/DD/YYYY
2.[CREDITOR] — [TYPE] — MM/DD/YYYY
3.[CREDITOR] — [TYPE] — MM/DD/YYYY
For each item above, please confirm its accuracy directly with the furnisher. If an item cannot be verified, please delete it and provide me with an updated copy of my credit report. Please complete this reinvestigation within 30 days as required by Section 611.
My contact information is as follows:
[Client Full Name]
[Client Street Address]
[City, State ZIP]

PERSONAL INFORMATION CORRECTION LETTER — reproduce word for word (only if personal info is incorrect on the report). The app fills the exact bureau name/address and the client details automatically; you may emit it for preview:
Date MM/DD/YYYY
Credit Bureau Name: [Bureau Name]
Credit Bureau Address: [bureau address]
To Whom It May Concern:
I am writing to update/correct my personal information on file with your company.
Please update my address to: [Current Address]
Please update my name to: [Full Legal Name]
My only social security number is: [SSN ending in last 4]
My only and correct date of birth is: [DOB]
I do not wish to have any telephone numbers on my report.
Please remove all the other addresses off my report, as they are not deliverable to me by the U.S. post office, and they are not reportable as per the FCRA, since they are inaccurate.
Sincerely, [Full Legal Name]
Enc. Driver License, Passport, SSN Card, and Proof of Residence

BUREAU MAILING ADDRESSES (use these EXACTLY):
Equifax: Equifax Information Services, LLC., P.O. Box 740256, Atlanta, GA 30374-0256
Experian: Experian, P.O. Box 4500, Allen, TX 75013
TransUnion: TransUnion Consumer Solutions, P.O. Box 2000, Chester, PA 19016-2000

THE AFFIDAVIT:
Do NOT fill out the Identity Theft Affidavit and do NOT decide which items go on it. The client completes it themselves and chooses which items, if any, they personally know were unauthorized.
WHEN TO ASK (sequence): Once the client has provided the credit report, photo ID, Social Security card, and proof of address, and you have identified and listed the negative items and the client has confirmed your list, then — before building the package — ask one plain question: "Were any of these items opened or used without your authorization — that is, identity theft? If so, I'll have you complete the FTC affidavit right here. If not, we'll dispute them as inaccurate." Do not build the package in the same turn as this question.
IN-CHAT IDENTITY-THEFT STEPS: When the client answers that one or more items WERE identity theft, in your next reply:
- Briefly tell them to file their own report at IdentityTheft.gov, then output the token FTC_REPORT_STEP on its own line (an upload box for the report they create).
- Then guide them to complete the official FTC affidavit and output the token AFFIDAVIT_STEP on its own line. The fill-in form opens in the chat for THEM to type their own answers, which print onto the official FTC form to sign and notarize.
HOW TO GUIDE THE FORM (do this when you show AFFIDAVIT_STEP): explain how to complete it, not what to claim. Tell them: enter your legal name, date of birth, SSN, driver's license, and current address; for the three declarations, check only what is true for you; in the accounts section, list ONLY the specific items you personally know were opened or used without your authorization — in your own words; then print, sign, and have it notarized. You may explain what each field means. You must NOT tell the client which accounts to list, must NOT suggest that any identified negative is fraud, and must NOT characterize items as identity theft on their behalf. The choice of which items to include is entirely theirs.
Output each token at most once. If the client says none were identity theft (only inaccurate or not theirs), do NOT output the tokens — proceed to build and dispute on accuracy grounds under Section 611.

THE FTC REPORT:
The FTC Identity Theft Report is filed by the client themselves at IdentityTheft.gov, and only by clients who are genuinely identity theft victims. You may tell a client where to file it, but you do NOT script statements claiming specific accounts are fraud and you do NOT tell the client what to declare. That is the client's own statement to make.

═══════════════════════════════════════════
DOCUMENTS TO COLLECT
═══════════════════════════════════════════
1. Credit report (MyFreeScoreNow) — to identify items.
2. Government photo ID — all four corners, no glare.
3. Social Security card — all four corners.
4. Proof of current address — utility bill or bank statement within 30 days, date cropped.
5. (Optional) Identity Theft Affidavit — only if the client is a genuine victim and completes the app's affidavit step; never required, never blocked on.

TWO WAYS THE CLIENT CAN UPLOAD — support BOTH:
- ALL AT ONCE: The client may drop every document and image together in one go. When several arrive in the same turn, read and extract from EVERY one of them that turn, tell the client everything you found across all of them (identity info, negative items, inquiries, personal-info issues), record each in "documentsReceived", and then ask only for whatever is still missing. Do not make them re-send one at a time.
- ONE AT A TIME: If the client uploads a single document, seems unsure, or asks for help, guide them through the list above in order, one item per turn, explaining each — the step-by-step experience is preserved for anyone who needs it.
Record each document in "documentsReceived" and never ask twice. Only ask for what is still missing. The FCRA 605B page is added automatically — do not ask for it.

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════
When you have the client name, address, DOB, SSN last-4, and the items the client chose to dispute, output the PACKAGE_READY block. The block is the ONLY thing that builds the PDFs. NEVER tell the client the packages are "ready" or "in the Package tab" unless THIS SAME REPLY contains the PACKAGE_READY block. Output the block itself — do not describe or promise it.

Output EXACTLY this (your short reply text may precede it if a question remains). The three bureau letters MUST be the COVER LETTER template reproduced word for word — only the bureau name/address, the client's info, and the numbered item lines change:

PACKAGE_READY:
{"clientName":"[full name]","clientAddress":"[full address]","dob":"[dob]","ssn4":"[last 4]","equifax":"[the Section 611 COVER LETTER reproduced verbatim, addressed to Equifax, items as numbered lines]","experian":"[same letter, addressed to Experian]","transunion":"[same letter, addressed to TransUnion]","personalInfoNeeded":true_or_false,"handwrittenNote":"Copy this letter by hand word for word on plain white paper in blue or black ink. Handwriting it shows the bureau this is a personal request, not a printed template. Do not type it.","disputeItems":{"equifax":["CREDITOR — TYPE — date"],"experian":["..."],"transunion":["..."]},"checklist":["MyFreeScoreNow credit report — relevant pages, highlighted in yellow or blue, NO pink","Government photo ID — all four corners, no dark spots","Social Security card — all four corners","Proof of current address — within 30 days, date cropped","Identity Theft Affidavit — ONLY if you are a genuine identity theft victim and completed it yourself; notarized","FCRA 605B page (added automatically)"],"packetOrder":"1. Cover Letter (handwritten) → 2. Personal Info Letter (if needed) → 3. ID Page → 4. Credit Report Pages → 5. Affidavit (only if you completed it) → 6. FCRA 605B","brandonsNotes":"[2-3 sentences for Brandon: anything unusual or worth double-checking]"}

═══════════════════════════════════════════
MEMORY PROTOCOL — CRITICAL (this is what stops re-asking)
═══════════════════════════════════════════
You are STATELESS between turns. The running state object is your only memory.

1. Before every turn you receive a "CONFIRMED CLIENT STATE" block. TREAT IT AS ABSOLUTE TRUTH. Any filled field is DONE — never ask for it again, never re-summarize a document you already read. Only ask for fields that are still null/empty.

2. At the very END of EVERY reply (after your message, and after any PACKAGE_READY block), output your updated memory EXACTLY like this with nothing after it:
###STATE###
{"clientName":null,"clientAddress":null,"dob":null,"ssn4":null,"disputeItems":{"equifax":[],"experian":[],"transunion":[]},"documentsReceived":[],"personalInfoIncorrect":null,"nextNeeded":"<the single next thing you are asking for>","collected":["<short labels of everything confirmed so far>"]}
###END###
Carry EVERY known value forward; never blank a field that was filled. The client never sees this block.

3. When a document is uploaded you see it ONCE. Extract everything immediately into state. On later turns the raw file is replaced by a placeholder — rely on CONFIRMED CLIENT STATE; never ask the client to re-upload or re-state.

4. Always move FORWARD. Each turn asks for the ONE next missing item (nextNeeded) or, when everything is present, generates the package. Never loop back.

CONVERSATION RULES:
- You are as knowledgeable as Brandon — answer any credit question with confidence and accuracy.
- TONE: precise, clear, professional. Short plain sentences. No emojis, no hype.
- NO MARKDOWN. No asterisks, bold, or headings — they render literally. Plain sentences; if you must list, use a simple hyphen.
- Keep replies brief: one line confirming what you received, then the single next step.
- Use the client's first name once known. Ask ONE thing at a time.
- NEVER say you cannot generate a PDF and never give manual PDF steps. To finish, OUTPUT THE PACKAGE_READY BLOCK.
- NEVER ask the client to type their SSN, DOB, name, or address — read these from documents.
- Never re-ask for info already provided or extracted.
- Disputes are made on accuracy grounds under Section 611 for items the client identifies. Do not assert identity theft on the client's behalf; the affidavit and any FTC report are the client's own to complete.`;

const BUREAUS = [
  { key: "equifax",     label: "Equifax",     color: "#B91C1C" },
  { key: "experian",    label: "Experian",    color: "#1E40AF" },
  { key: "transunion",  label: "TransUnion",  color: "#1D4ED8" },
];

// Exact bureau mailing addresses, used to build letters deterministically in code.
const BUREAU_ADDR = {
  equifax:    "Equifax Information Services, LLC., P.O. Box 740256, Atlanta, GA 30374-0256",
  experian:   "Experian, P.O. Box 4500, Allen, TX 75013",
  transunion: "TransUnion Consumer Solutions, P.O. Box 2000, Chester, PA 19016-2000",
};

// Mail-packet documents, in assembly order (after the letters).
const PACKET_SLOTS = [
  { key: "photoID",        label: "Driver's License / Photo ID" },
  { key: "passport",       label: "Passport" },
  { key: "ssnCard",        label: "Social Security Card" },
  { key: "proofResidence", label: "Proof of Residence (utility / electric bill)" },
  { key: "creditReport",   label: "Credit Report (MyFreeScoreNow)" },
  { key: "affidavit",      label: "Identity Theft Affidavit (only if you are a victim)" },
  { key: "ftcReport",      label: "FTC Identity Theft Report (you create it at IdentityTheft.gov, then upload it here)" },
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

// Official blank FTC Identity Theft Victim Complaint and Affidavit (form H-1 through
// H-6, 4 pages), embedded so it is always available. The app NEVER fills this in —
// it is included blank for the client to complete and notarize themselves.
const FTC_AFFIDAVIT_B64 = "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jpCTjpCSjY+RjI6Ri42Qi42PioyOiYuOiIqNiIqMh4mLhoiLhYeKhYaJhIaIg4WIgoSHgoOGgYOFgIKFf4GEf4CDfoCCfX+CfH6BfH2Ae31/enx/ent+eXp9eHp8d3l7d3h7dnd6dXd5dHZ4dHV4c3R3cnR2cXN1cHJ0cHF0b3BzbnBybW9xbW5wbG1wa2xvamtuaWttaWpsaGlrZ2hrZmdqZWdpZGZoZGVnY2RmYmNmYWJlYGFkYGFjX2BiXl9hXV5gXF1gW1xfW1xeWltdWVpcWFlbV1haVldZVVZYVFVXU1RWU1NVUlJUUVFTUFBST09RTk5QTU1PTExOS0tNSkpMSUlLSEhKSEdJR0ZIRkZHRUVGRERFQ0NEQkJDQUFCQEBBPz5APj0/PTw+PDs8Ojk7OTg6ODc4NzU3NjQ1NDM0MzEzMjAxMS8wMC0uLiwtLSosLCkqKygpKicoKCUmJyQlJiMkJSIiJCAhIx8gAgwA3ki8vwplbmRzdHJlYW0KZW5kb2JqCjExIDAgb2JqClsgL1NlcGFyYXRpb24gL0JsYWNrIDcgMCBSIDEwIDAgUiBdCmVuZG9iagoxMiAwIG9iago8PAovT1AgZmFsc2UKL09QTSAxCi9TQSBmYWxzZQovU00gMC4wMgovVHlwZSAvRXh0R1N0YXRlCi9vcCBmYWxzZQo+PgplbmRvYmoKMTMgMCBvYmoKPDwKL09QIHRydWUKL09QTSAxCi9TQSBmYWxzZQovU00gMC4wMgovVHlwZSAvRXh0R1N0YXRlCi9vcCB0cnVlCj4+CmVuZG9iagoxNCAwIG9iago8PAovT1AgdHJ1ZQovT1BNIDEKL1NBIHRydWUKL1NNIDAuMDIKL1R5cGUgL0V4dEdTdGF0ZQovb3AgdHJ1ZQo+PgplbmRvYmoKMTUgMCBvYmoKPDwKL09QIGZhbHNlCi9PUE0gMQovU0EgdHJ1ZQovU00gMC4wMgovVHlwZSAvRXh0R1N0YXRlCi9vcCBmYWxzZQo+PgplbmRvYmoKMTYgMCBvYmoKPDwKL0Jhc2VGb250IC9NSkdBRUorRnJ1dGlnZXJCTGFjawovRW5jb2RpbmcgMTcgMCBSCi9GaXJzdENoYXIgNDUKL0ZvbnREZXNjcmlwdG9yIDE4IDAgUgovTGFzdENoYXIgNzIKL1N1YnR5cGUgL1R5cGUxCi9Ub1VuaWNvZGUgMjAgMCBSCi9UeXBlIC9Gb250Ci9XaWR0aHMgWyAzMzMgNTAwIDUwMCA1MDAgNjEyIDYxMiA2MTIgNjEyIDYxMiA2MTIgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA3MjIgXQo+PgplbmRvYmoKMTcgMCBvYmoKPDwKL0RpZmZlcmVuY2VzIFsgNDUgL2h5cGhlbiA0OSAvb25lIC90d28gL3RocmVlIC9mb3VyIC9maXZlIC9zaXggNzIgL0ggXQovVHlwZSAvRW5jb2RpbmcKPj4KZW5kb2JqCjE4IDAgb2JqCjw8Ci9Bc2NlbnQgMAovQ2FwSGVpZ2h0IDAKL0NoYXJTZXQgKFwwNTdIXDA1N2h5cGhlblwwNTdvbmVcMDU3dHdvXDA1N3RocmVlXDA1N2ZvdXJcMDU3Zml2ZVwwNTdzaXgpCi9EZXNjZW50IDAKL0ZsYWdzIDQKL0ZvbnRCQm94IFsgLTE2NCAtMjIyIDEwMDAgOTU0IF0KL0ZvbnRGaWxlMyAxOSAwIFIKL0ZvbnROYW1lIC9NSkdBRUorRnJ1dGlnZXJCTGFjawovSXRhbGljQW5nbGUgMAovU3RlbVYgMAovVHlwZSAvRm9udERlc2NyaXB0b3IKPj4KZW5kb2JqCjE5IDAgb2JqCjw8Ci9TdWJ0eXBlIC9UeXBlMUMKL0xlbmd0aCA2ODkKPj4Kc3RyZWFtCgEABAIAAQEBFU1KR0FFSitGcnV0aWdlckJMYWNrAAEBARr4GwwV+BwMFvs4+3L6fPpOBegP8hGU+TwSAAIBAQ4bL0ZTVHlwZSAxIGRlZkZydXRpZ2VyQkxhY2sAAAEADgAAEgUAKQAACQIAAQAYACYAPQCIAQoBMwGKAg4CK8f4Shb5ovwL/aIHyflkFfeO/SX7jgYOIPfC918V9xj7o/sYBw74Zhb5Tvs4B/uB+y7e+xL3GOkF/JQHDvi3FvcY+6gHvbYF9yL3DtL3Au0aznK/Wa8erFxKnDobTUZ9cD8fkvsloZiolq6VGZSurJCoG82sblBialRIRh9sa0dNIC8I+xkHDvd++NAV27NwVnJ9d3B8H4B1c4VwG2RwjIx9H/sQB4yopYyiG+C1cFZrenNqfB9/cm2FZxs+UZahZR+C+ycFe7jPg+Yb3s+aqMAfzrCtxdkatn+ucqYecqZpnWCUCI0H4KK2vtoa0G6+UKwepFxNmD4bRUeBeEoflPsdBZ60wZTOGw74ghb3Ge73Eij4S/tiB/us/DUF+yj3zPsZB/tI95cV91L3uwWN+7sGDvd39+gVtq6EfKYfrHqccGcaQFxmLU1SmKRYHoj7KwV6z8mDxBvk0Z2wwB/Kt6vO5RrUcMJWsR6sXEycPhuJeYqIaB/3CPe79xL8WweG/AsFlra+kcUbDvfx+VoV+wE7ZT5XH15IdS/7CRoqnz6yUh5IudFq6BvXyqK5vB+8uaTDzBrLeL9mtB61ZFigTBtIWHNcah+JBvcdjMLP9hvIvH9ysB+W9x0FoFVPlkgb+wD8OhWfm6GVqBvGqWZBb4N0fHgfeHt1gW8bbnWVoHsfe6CDpKkaqJOjm58eDveu948W97/3cPu/9075TvtO+5/7cPef+079TgcOi4sG+PgU+EwVCmVuZHN0cmVhbQplbmRvYmoKMjAgMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL0xlbmd0aCAyNDUKPj4Kc3RyZWFtCmjeVFDLbsMgELzzFXtMlQOGVFUPyFKVqJIPfahOeyewdpFqQBgf/Pfl4aYtEuwuMyOGocfu1FkTgb4Gp3qMMBirA85uCQrhgqOxwDhoo+I2lVNN0gNN4n6dI06dHRwIQehbAucYVtg9lLV/ZPvmBuhL0BiMHWF3Zu8f6aJfvP/CCW2EBtoWNA6EHp+kf5YTAv2j/oXOq0fgZWabDadx9lJhkHZEEFy3IG7vW0Cr/2OEV8VlUJ8ykMpsGn5qSRGkPhWSdBuD/fCrXBxYIh3uCjP1lVmx/FjO42pfLSGkn5XQivPs2Vi85uqdzxbzJt8CDAAVt3sXCmVuZHN0cmVhbQplbmRvYmoKMjEgMCBvYmoKPDwKL0Jhc2VGb250IC9NSkdBRUsrSHVtYW5pc3Q1MjFCVC1Sb21hbgovRW5jb2RpbmcgMjIgMCBSCi9GaXJzdENoYXIgMzIKL0ZvbnREZXNjcmlwdG9yIDIzIDAgUgovTGFzdENoYXIgMTQ0Ci9TdWJ0eXBlIC9UeXBlMQovVG9Vbmljb2RlIDI1IDAgUgovVHlwZSAvRm9udAovV2lkdGhzIFsgMjUyIDYwMCA2MDAgNzY5IDUwNSA2MDAgNjUyIDYwMCAzMTUgMzE1IDYwMCA2MDAgMjUyIDMzOCAyNTIgMjgyIDUwNSA1MDUgNTA1IDUwNSA1MDUgNTA1IDUwNSA1MDUgNTA1IDUwNSAyNTIgNjAwIDYwMCA2MDAgNjAwIDMxMyA2MDAgNjIzIDU3OSA2OTQgNzQxIDU0NCA1MDMgNzA4IDYwMCAyNTAgNjAwIDYwMCA1MDUgODA4IDc3OCA4MDEgNTQyIDYwMCA1NjUgNDYxIDYxMyA3MjcgNTkzIDkzMSA2MDAgNTgzIDYzNyA2MDAgNjAwIDYwMCA2MDAgNTAwIDYwMCA0MzMgNTE3IDQ0MCA1MTcgNDg4IDI2NCA0NDcgNTAxIDIxMSAyMTMgNDgzIDIxMSA3OTQgNDk5IDUzNSA1MTcgNTE3IDM3NSAzNzYgMzIyIDQ5OSA0NDQgNzQ4IDQ3NiA0NDQgNDQxIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDEwMDAgNTAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA0MzAgNDMwIDYwMCAyMzYgXQo+PgplbmRvYmoKMjIgMCBvYmoKPDwKL0RpZmZlcmVuY2VzIFsgMzIgL3NwYWNlIDM1IC9udW1iZXJzaWduIC9kb2xsYXIgMzggL2FtcGVyc2FuZCA0MCAvcGFyZW5sZWZ0IC9wYXJlbnJpZ2h0IDQ0IC9jb21tYSAvaHlwaGVuIC9wZXJpb2QgL3NsYXNoIC96ZXJvIC9vbmUgL3R3byAvdGhyZWUgL2ZvdXIgL2ZpdmUgL3NpeCAvc2V2ZW4gL2VpZ2h0IC9uaW5lIC9jb2xvbiA2MyAvcXVlc3Rpb24gNjUgL0EgL0IgL0MgL0QgL0UgL0YgL0cgNzMgL0kgNzYgL0wgL00gL04gL08gL1AgODIgL1IgL1MgL1QgL1UgL1YgL1cgODkgL1kgL1ogOTUgL3VuZGVyc2NvcmUgOTcgL2EgL2IgL2MgL2QgL2UgL2YgL2cgL2ggL2kgL2ogL2sgL2wgL20gL24gL28gL3AgL3EgL3IgL3MgL3QgL3UgL3YgL3cgL3ggL3kgL3ogMTMyIC9lbWRhc2ggL2VuZGFzaCAxNDEgL3F1b3RlZGJsbGVmdCAvcXVvdGVkYmxyaWdodCAxNDQgL3F1b3RlcmlnaHQgXQovVHlwZSAvRW5jb2RpbmcKPj4KZW5kb2JqCjIzIDAgb2JqCjw8Ci9Bc2NlbnQgNjgyCi9DYXBIZWlnaHQgNjgyCi9DaGFyU2V0IChcMDU3c3BhY2VcMDU3TFwwNTdlXDA1N2FcMDU3dlwwNTdwYXJlbmxlZnRcMDU3dGhyZWVcMDU3cGFyZW5yaWdodFwwNTdiXDA1N2xcMDU3blwwNTdrXDA1N3VcMDU3dFwwNTdpXDA1N3lcMDU3b1wwNTdwXDA1N3JcMDU3ZFwwNTdoXDA1N3NcMDU3ZlwwNTdtXDA1N3dcMDU3Z1wwNTdjb21tYVwwNTdjXDA1N3BlcmlvZFwwNTdTXDA1N2VpZ2h0XDA1N2h5cGhlblwwNTdvbmVcMDU3emVyb1wwNTdQXDA1N3R3b1wwNTdDXDA1N01cMDU3Y29sb25cMDU3dW5kZXJzY29yZVwwNTdGXDA1N3hcMDU3c2xhc2hcMDU3Zm91clwwNTdxdW90ZXJpZ2h0XDA1N05cMDU3Zml2ZVwwNTdhbXBlcnNhbmRcMDU3QVwwNTdaXDA1N3NpeFwwNTdJXDA1N3NldmVuXDA1N25pbmVcMDU3VFwwNTdSXDA1N3FcMDU3T1wwNTdCXDA1N251bWJlcnNpZ25cMDU3ZW5kYXNoXDA1N3pcMDU3ZW1kYXNoXDA1N0VcMDU3RFwwNTdVXDA1N0dcMDU3ZG9sbGFyXDA1N3F1b3RlZGJsbGVmdFwwNTdxdW90ZWRibHJpZ2h0XDA1N1lcMDU3cXVlc3Rpb25cMDU3VlwwNTdqXDA1N1cpCi9EZXNjZW50IC0yMjYKL0ZsYWdzIDQKL0ZvbnRCQm94IFsgLTE2NyAtMjM2IDEzODcgOTU3IF0KL0ZvbnRGaWxlMyAyNCAwIFIKL0ZvbnROYW1lIC9NSkdBRUsrSHVtYW5pc3Q1MjFCVC1Sb21hbgovSXRhbGljQW5nbGUgMAovU3RlbVYgMAovVHlwZSAvRm9udERlc2NyaXB0b3IKL1hIZWlnaHQgNDUwCj4+CmVuZG9iagoyNCAwIG9iago8PAovRmlsdGVyIC9GbGF0ZURlY29kZQovU3VidHlwZSAvVHlwZTFDCi9MZW5ndGggNTczOQo+PgpzdHJlYW0KaN6kWAl0G9W5lkOkGVIQW8Y4M3QmlLZA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L0ZvbnQKL1dpZHRocyBbIDI3MyA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDI3MiA2MDAgMjcyIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgMjcyIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDcyMSA2NzYgNjk5IDc3MiA1NzQgNTQ2IDYwMCA2MDAgMzE5IDYwMCA2MDAgNTQyIDYwMCA4MTkgNjAwIDYwMCA2MDAgNjUzIDU5NyA2NDYgNjAwIDY3OCA5NzkgNjAwIDY3MCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNTE2IDU3NCA0NzMgNTcyIDUzMiAyODcgNTI1IDU2NSAyNTIgNjAwIDYwMCAyNTIgODc1IDU2NCA1NTggNTcyIDYwMCA0MjggNDEyIDM5NyA1NjQgNDc4IDc1OSA2MDAgNDc4IDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCAyNzMgXQo+PgplbmRvYmoKMjcgMCBvYmoKPDwKL0RpZmZlcmVuY2VzIFsgMzIgL3NwYWNlIDQ0IC9jb21tYSA0NiAvcGVyaW9kIDU4IC9jb2xvbiA2NSAvQSAvQiAvQyAvRCAvRSAvRiA3MyAvSSA3NiAvTCA3OCAvTiA4MiAvUiAvUyAvVCA4NiAvViAvVyA4OSAvWSA5NyAvYSAvYiAvYyAvZCAvZSAvZiAvZyAvaCAvaSAxMDggL2wgL20gL24gL28gL3AgMTE0IC9yIC9zIC90IC91IC92IC93IDEyMSAveSAxNDQgL3F1b3RlcmlnaHQgXQovVHlwZSAvRW5jb2RpbmcKPj4KZW5kb2JqCjI4IDAgb2JqCjw8Ci9Bc2NlbnQgNjgyCi9DYXBIZWlnaHQgNjgyCi9DaGFyU2V0IChcMDU3c3BhY2VcMDU3TlwwNTdvXDA1N3dcMDU3QVwwNTdiXDA1N3VcMDU3dFwwNTdZXDA1N0lcMDU3ZFwwNTdlXDA1N25cMDU3aVwwNTd5XDA1N1RcMDU3aFwwNTdmXDA1N1ZcMDU3Y1wwNTdtXDA1N3F1b3RlcmlnaHRcMDU3c1wwNTdDXDA1N3BcMDU3bFwwNTdhXDA1N3ZcMDU3QlwwNTdyXDA1N2dcMDU3Y29sb25cMDU3RlwwNTdEXDA1N0xcMDU3RVwwNTdSXDA1N2NvbW1hXDA1N3BlcmlvZFwwNTdTXDA1N1cpCi9EZXNjZW50IC0yMjYKL0ZsYWdzIDQKL0ZvbnRCQm94IFsgLTE2NyAtMjM2IDE0MTAgOTYzIF0KL0ZvbnRGaWxlMyAyOSAwIFIKL0ZvbnROYW1lIC9NSkdBRUwrSHVtYW5pc3Q1MjFCVC1Cb2xkCi9JdGFsaWNBbmdsZSAwCi9TdGVtViAwCi9UeXBlIC9Gb250RGVzY3JpcHRvcgo+PgplbmRvYmoKMjkgMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL1N1YnR5cGUgL1R5cGUxQwovTGVuZ3RoIDMxNjAKPj4Kc3RyZWFtCmjelFd5cBxXmW8JzcxzYoZAaJXcL3TLgJ3DR3CykGIhKDZO7NhxjBLHji1Ht6xrdE3PrZ77sCRbmvvU3D2SdVoaHbYkHzgBJcHEBAIJC2W2soH8QZFsQVHFa/NGqe1JtrzF1m7VbvUf3a9/73vv9973vt/3vhKirJQoKSmhjhw6sPfp53YcVHc1dLezqm8+tmffsV37ehTNRXSrADeTwgOby/F3sOUBie3vJySo9Avo8fvQS18MPCDf8yWitKREXvnoMy8e0/e2VH6rsrnlzP8wElEiPsTnCeILBAEJ4qsS4hGC2EUQjxLE46XEEyXEPxPEPkAcKSNelBCnCAIQJfdVEjuJ3SKwV/Is8RzxPPFC6fGSk0QDUJQpJXrCRxCPiPwJivgK0UiEiE9KdpZMlG4rdZZmSldLXy99r/Svn+soqyjbWXa4zFY2LmElf5SekL4jOyTzgwT4cNP2TY9vWtqE72m954N7H7735uYtm+s3GzfPb/755ytSwhp+mvy7tDDwiVT2ozs/I4WKjVChQirHb8g/GiB1Z7U2HW3Tm7R6HeiWvRpY4WcXwMV8fPU6NWPPGZJ00qAOdkNWYzMYGIPBrmEpvbs/YKL9xrA95gLyd0dJQzxt5yGf9sfjTDweSPNUzp42xOm4QeNX/oMp69fEDbT8XfTropGtaBS4a8T/g5H9vxnhN8r+3/OgrQIQfOSfcESCa6VfwyPka2iLBK1Jr2Lx9awUJ+9USfBJKb6+USWR/wnZ0WXyY+mlKYcxxaSMQXU31W3T6sy0SdfprIMPSdFSGXr497KprNMUY2Imv7aPYu16zkKbOZVTAVcKe8gP3x6dWWFWpjNXb1Er5nnVBM1OtmVqYpORTGI0C2JZ/9gUta669MokPVF7ILYHYs9GlVSO7r2zC3WRjT2N6gYj4BobHY3w8MvJ/BmmJa+7/lPqVur6Qp6eX3w1+XOYzzvNeSZvzuvzSoD+SdacbI42B0CgqdHTCDHY1XloP7P/UNs3t1InAzWJOjpRN9ZysWNWscBeNoD+lav2V+Haijd0ibkUWk4sZYEcHRNKhGVy/YquZY6ZP5M4dZQ6qj91poVuaa3RVUN8v7BD+n5hmfzFDbf/IjPnn45MJH84s7g0fg2MX4u+9ib1muW6apVWr3Ys1M20584kmkIg1Piidy/EgeLinMJEOfoyXkNPoDF0Px5DDFpAXyq8slElk7cjWzmaRT4R96GHEC/+f774H0fR+fI7VXh/sdFSHKACrwlXcFWxjezCJ+WIEuEnCzukhVJhhwQ/slGFnhT2SuW/Qi7hQRI9/jvZJO8wjTKjRr+uj+q1azkTbepXOTrhtwsiPiUbdp9zw/PukXMjcCbnNCeYhGVUHVV8gE9WoJekuASZrBlzwhTbYoxyIYN3MTmZSY2D5HhwOk+9rb5aN0NP1x4Y3f2fHoyj73lIy+KScxm+fysxt8ZcmeOv3aTy9lluguYuqPmuRE/8dPoQb/JYRxwjipAqzEUAF7ZHo1QiEIkH6UCc98zAyRmnZZ6ZsywZVlUAVcpaks2R5iAINDd7WuD3jujPnGZqWtmaaupY4pX5Nnq+9Vbbx+0Lxpw5ZAUhq8fUT2ltnMFCWw19rg7Y0eaNtDFtkbrMy9MA75TNqfP9ixYgvyXsKRduIA26f2Mzvh9pCjdk8o+FEieJ/u3O0xJ8RIoPFrbiJ4WtEnxYim5uPC2RC19DvxfxR4UqtLtQJXlHiiaLXQ9IcUUBYEoAEiyVYkr83lL8fkbEi2YfCk+Uo5sylBM2SXCdFO/GffgR1CfBDVKUKdwjwT+RyQ+j4B9Il9k8aIH9ZnfAxtgCrnCMSvhH4xE6HpmJXUsALJEZrSaH2QV+8S3SFkmczcJEasQrBqqXD4xFwG2ZxWUbcAyCIadjyAkdrmH3ADPgGfKFKPSc7MfcUtcYneuqiRyEDS0uWzvTYVMYe3SDWFYxxo8nxiMgMj7uHYNTWZdFjG2rz6AeODcwODg0NEhhacfeng4WtLMGxRmqPtSZ1dDq7KzlMhwfcweyDO/PRtKJEYPPFLUBuROdQrfJSDDij3iAJxIdicK5CxZVikmrgoomqtnaqVHRKk2PpQ1ypmGPkTF5TH5zEHThLaRzbnZgGn7wdnr5KnP1Ev/6e9S72tebL9OXmo9nDsI+9qxDw6gdWoueA8iHt218XbZkztvmnEBeKRxFFMla1XatC7g02gEdrG0PZViGzZqnlqjF8FQ2S2f56dAyjCcHXSIbV8aeswIklbFB1seKVFnliBJ+57C6roapqWWr91F7+eqr9XT9lVvqf4UXxoc9PMN7sv5MEMjt6H1USrqMxkEjbO8NZ7WMhrdO5amF4HRanCZ1ITQHo9FBV4SJuCKOiBXgU6L3jA6TC6zhUhJViqG7Hfuk+pgupPEBn0bl7oOHTqhrm5jGWm3196nvp6oXa+m6xRvqt+BYzu1PMxl/OpwcBfIawY4eJLu03f3dVmDp6nZ1w7r2UFrJKNOmiXlqGN32yG5rftqwSq81vJDdB/f9QFNfy9TVq1/YTz2ZPbpSR9ev3FT/Fi7Oe4IXmYvBmdh0GuA8ukbGR9P+HORTdsMoEzME2JEugA9K3ZNBPh4HcryKWssF4s1/fz4jm/XwoSgdDSZ8OejznxsKMIGhwGBoEKDPybgR47D5PDhvNp+3wkM1XHcn09ndX3eUevnZh24VCJn8GNpXRwaS4545ODvmsiWZpDVgMlB6m1FnpW26XlcrbO31BPSMPmiLJql4MJIM0IgRKsmYqGRibrPrOCPNcVqHEiq1vhjHcFF7Ukyf/mQsSsdiKZFULuXgYgxWYC1psjg5PWV0WwJWOmCL2hOuJouC0+iARmtV9VIN6fZllmYvrZvfg7d/EhlbZpbG0vlrVN402cfTfdkz0ZM+83D/ee0wOO7tC8apeDK0MEInh2PD4eFr/vk4nwO5XHhmmYoNRgci9NmIK2wPg7c+wmbpd48aexuZxh5N0wmqOahIKemUckq/ZO5zam0mM5Bz6HQ5uiKL8rFEPAwiiaQ3BTNxOxdkQpyH7aDETLEdrcrWjZd7p+ip3pbYy7Cz22VRMqyV1atEdZzC2z/NFbdRTbnQhLcXmmQJ4TWSiyXsGZhJ+mJiJMd8yQyVcSS5GB3jdD41VOvtnLhnnF2vptR+fYyjPxugeCQ/TS5X0KnPaI0mE2EQjhdpZUcdXIgJirTai7S+KuIxEY//L/intE2f0W4Wabd1OU19TK+pR92lME8Y0uooiKp6fG1Q0VNcT5+FNahVYB1vE1cg7787/2fbkvCm/2/bohSHUd0dRo3q0W9JPpkLT8GpnJkVDxob7Gymmm2dOpZW6ZTmTqhQhrM6RsdbpxeKsZvkaUzgNFm79qb6PfjrNzMra8zaZX79Heoddv30Cr1y+kjmKfjU8+ra08xpUSL2U/v56rU6WtQDB/ob6YlGh6NwZtxcFDs2qBDnsiqKYqftsbRCo3HYY2KMHpNPFDt0ShYNRn1RD2go/IZEUVmCS1rSDuBI82dz8K0bmZVFZulyav2X1C+1643izE3HM4eKAmhXMxqHxqTrB3lcufGM6Pydou9QjSywPDqb4UEukwtfgOHwgCtc1B5bzLKAtlTowwY/5wUeIzdigr1Kq1bFqDVsh/I0QPd9emzk+LuodIh0XrgwMAXfWIuMzTAzufj8FWrSPsal6P40G2+Pmb0Gn9oPjmf6EjEq7AkEvLQ3GBlJwFTmrEMUR/u4eaof/EXGhvuCSi/w9vWMdMOX6k29HUxHb39bHfXC5Zo/tNK+Ac+ge3DKlLIG7CDgcNuslNlpNztpp0U/oIIGjdsn+tLXG+qOgK/LeHPONi7es/HhX6Fj5N7IiZyC7sotc6/DbHbYzTNZD+/NBoZQSYXBzjm5AXBWVGUT7NN5w1bGGnZl5yhUhR77M34MQbUMV+MGieKWeMiE0nK0vRg0+IrUyHJ6vQmY9TqnFqoN/piVscRc/AyFxkR8VVYdrRtX0IrxBe46nJ7whHgmF+QTWfHquA0t2kj0iqCQ4J3SHdi9DbkleLcUdRQUEjk6gKIiKkEhJMGh4o2htdjxYelD2I0JsedT4p38rklr0WSbwAlNpNh8EGt2IY0Ef0OK9he24K/gVyVoV7Fq+UhIi1WLvli16Ew6sWrpulu1LMRXfvhfVUug+24VYbtbtQSMYVvsLJCfOydFuS8L/0L+hwADAGnhnP8KZW5kc3RyZWFtCmVuZG9iagozMCAwIG9iago8PAovRmlsdGVyIC9GbGF0ZURlY29kZQovTGVuZ3RoIDMyNAo+PgpzdHJlYW0KaN5UUk1vgzAMvfMrfOzUAx8NQZUQUtVtUg/70NrtngbTIY0QBXrov58dd92GRPJiv2c/HNLt7n7n+hnS1zDaPc7Q9a4NOI3nYBGOeOod5AW0vZ2vp7jawXhISby/TDMOO9eNUNdJ+kbJaQ4XWGzis3xcLbM7SF9Ci6F3J1gc8vcPCuzP3n/hgG6GDJoGWuySdPtk/LMZENI/6t/U4eIRinjOrzbGFidvLAbjTgh1kTVQr2lB1/7PJXkmkmNnP01IhJpltBG2greMUfAD4ZWJeLUhrNYR00ZY+Ir5SviK+aVwSuZUgivG7Iga5oTJ2NWB/vEj/mqVE0lpqZZztYJwqaRkwQFOlpUENAU0S7Q00izRbKySL9PsruIalUgIS3tpyCPiW7wN3Z5DoPuIVx3nzZPuHd7+Bj96Hiy/ybcAAwDCE599CmVuZHN0cmVhbQplbmRvYmoKMzEgMCBvYmoKPDwKL0Jhc2VGb250IC9NSkdBRkwrSHVtYW5pc3Q1MjFCVC1JdGFsaWMKL0VuY29kaW5nIDMyIDAgUgovRmlyc3RDaGFyIDMyCi9Gb250RGVzY3JpcHRvciAzMyAwIFIKL0xhc3RDaGFyIDE0NAovU3VidHlwZSAvVHlwZTEKL1RvVW5pY29kZSAzNSAwIFIKL1R5cGUgL0ZvbnQKL1dpZHRocyBbIDI1MiA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgMzM4IDMzOCA2MDAgNjAwIDI1MiAzMzggMjUyIDI4MiA2MDAgNTA1IDUwNSA1MDUgNTA1IDUwNSA1MDUgNjAwIDYwMCA2MDAgMjUyIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDUyMSA2MDAgNTY5IDY2MiA2MDAgNjAwIDYwMCA2MDAgMjUwIDYwMCA2MDAgNjAwIDYwMCA3MDEgNjY4IDQ2MyA2MDAgNjAwIDYwMCA2MDAgNjAwIDUxNCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDUwMCA2MDAgNDYzIDQ3NSA0MTIgNDYzIDQ0OCAyNTggNDE3IDQ3NyAyMTkgNjAwIDYwMCAyMTkgNzM4IDQ3NyA0NTQgNDc1IDYwMCAzMTIgMzY2IDMzMSA0NzcgMzcwIDYyNSA2MDAgMzkxIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCAyMzYgXQo+PgplbmRvYmoKMzIgMCBvYmoKPDwKL0RpZmZlcmVuY2VzIFsgMzIgL3NwYWNlIDQwIC9wYXJlbmxlZnQgL3BhcmVucmlnaHQgNDQgL2NvbW1hIC9oeXBoZW4gL3BlcmlvZCAvc2xhc2ggNDkgL29uZSAvdHdvIC90aHJlZSAvZm91ciAvZml2ZSAvc2l4IDU4IC9jb2xvbiA2NSAvQSA2NyAvQyAvRCA3MyAvSSA3OCAvTiAvTyAvUCA4NiAvViA5NSAvdW5kZXJzY29yZSA5NyAvYSAvYiAvYyAvZCAvZSAvZiAvZyAvaCAvaSAxMDggL2wgL20gL24gL28gL3AgMTE0IC9yIC9zIC90IC91IC92IC93IDEyMSAveSAxNDQgL3F1b3RlcmlnaHQgXQovVHlwZSAvRW5jb2RpbmcKPj4KZW5kb2JqCjMzIDAgb2JqCjw8Ci9Bc2NlbnQgNjgyCi9DYXBIZWlnaHQgMAovQ2hhclNldCAoXDA1N3NwYWNlXDA1N3BhcmVubGVmdFwwNTd0XDA1N2hcMDU3ZVwwNTd2XDA1N2lcMDU3Y1wwNTdtXDA1N3BhcmVucmlnaHRcMDU3QVwwNTdvXDA1N2xcMDU3dVwwNTduXDA1N2FcMDU3clwwNTd5XDA1N2ZcMDU3Z1wwNTdwXDA1N3dcMDU3Y29tbWFcMDU3ZFwwNTdzXDA1N2JcMDU3aHlwaGVuXDA1N3BlcmlvZFwwNTdWXDA1N3NsYXNoXDA1N3F1b3RlcmlnaHRcMDU3TlwwNTd1bmRlcnNjb3JlXDA1N1BcMDU3dHdvXDA1N0NcMDU3dGhyZWVcMDU3SVwwNTdvbmVcMDU3c2l4XDA1N0RcMDU3Zm91clwwNTdPXDA1N2ZpdmVcMDU3Y29sb24pCi9EZXNjZW50IC0yMjYKL0ZsYWdzIDY4Ci9Gb250QkJveCBbIC0xNjcgLTIzNiAxMzg3IDk1NSBdCi9Gb250RmlsZTMgMzQgMCBSCi9Gb250TmFtZSAvTUpHQUZMK0h1bWFuaXN0NTIxQlQtSXRhbGljCi9JdGFsaWNBbmdsZSAtMTUKL1N0ZW1WIDAKL1R5cGUgL0ZvbnREZXNjcmlw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nzLdPxqomrQPZP73CgVwa9LQmzTYqT82eph5eXD4yF4bU2v3jAk7HQeXA/y6jw+f27dukjj4NQbpIcx/BRgAZPqjtQplbmRzdHJlYW0KZW5kb2JqCjQ0IDAgb2JqCjw8Ci9Db2xvclNwYWNlIDw8Ci9DczYgNyAwIFIKL0NzOCA5IDAgUgovQ3M5IDExIDAgUgo+PgovRXh0R1N0YXRlIDw8Ci9HUzEgMTIgMCBSCi9HUzIgMTMgMCBSCj4+Ci9Gb250IDw8Ci9GMSAxNiAwIFIKL0YyIDIxIDAgUgovRjMgMjYgMCBSCi9GNCAzMSAwIFIKL0Y2IDQ1IDAgUgo+PgovUHJvY1NldCBbIC9QREYgL1RleHQgXQo+PgplbmRvYmoKNDUgMCBvYmoKPDwKL0Jhc2VGb250IC9NSkdCREkrSHVtYW5pc3Q1MjFCVC1Cb2xkSXRhbGljCi9FbmNvZGluZyA0NiAwIFIKL0ZpcnN0Q2hhciAzMgovRm9udERlc2NyaXB0b3IgNDcgMCBSCi9MYXN0Q2hhciA4NAovU3VidHlwZSAvVHlwZTEKL1RvVW5pY29kZSA0OSAwIFIKL1R5cGUgL0ZvbnQKL1dpZHRocyBbIDI2NyA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjAwIDYwMCA2MDAgNjg1IDYwMCA1NzEgNDk4IDYwMCA3NDUgMjkxIDYwMCA2MDAgNjAwIDYwMCA3NjggNzcwIDU5NSA2MDAgNjIwIDUyOSA2MDQgXQo+PgplbmRvYmoKNDYgMCBvYmoKPDwKL0RpZmZlcmVuY2VzIFsgMzIgL3NwYWNlIDY3IC9DIDY5IC9FIC9GIDcyIC9IIC9JIDc4IC9OIC9PIC9QIDgyIC9SIC9TIC9UIF0KL1R5cGUgL0VuY29kaW5nCj4+CmVuZG9iago0NyAwIG9iago8PAovQXNjZW50IDAKL0NhcEhlaWdodCA2ODIKL0NoYXJTZXQgKFwwNTdzcGFjZVwwNTdJXDA1N05cMDU3VFwwNTdIXDA1N0VcMDU3UFwwNTdSXDA1N1NcMDU3Q1wwNTdPXDA1N0YpCi9EZXNjZW50IDAKL0ZsYWdzIDY4Ci9Gb250QkJveCBbIC0xNjcgLTIzNiAxNDEwIDk2MyBdCi9Gb250RmlsZTMgNDggMCBSCi9Gb250TmFtZSAvTUpHQkRJK0h1bWFuaXN0NTIxQlQtQm9sZEl0YWxpYwovSXRhbGljQW5nbGUgLTE1Ci9TdGVtViAwCi9UeXBlIC9Gb250RGVzY3JpcHRvcgo+PgplbmRvYmoKNDggMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL1N1YnR5cGUgL1R5cGUxQwovTGVuZ3RoIDEwNzYKPj4Kc3RyZWFtCmjedFJrTFN3FL+3cu9unNa4eDtyr97Lh0mCm3GyjL2iZMQ5nGGTAPIQ5F0K3La0ULmFitAi4lpo6ctiK21pKZSWtlAFqWQPnM7oZJroh2VZ5pcFt33RT/8Lty4rsK/LSc7JOef3OzkvGEoTQDAMZxR88XnesRNv56uktbLm9o73sw/nFR/MkzMNJzpqmeb6Dcw+jtyBc3t3iPhP+N69iHa9FAHbd4F9u63rz9+ABDAszDx0vKhY3daYkZPR0Cj+31oQnBLoLQjKhKEsGDokgN4TQDtTfUAEREJ2aBl6Du+B98Mn4b8FpYIX24zbZo5wCf4zfB1NDv6DvnZ7bQXn0l/Zk+moUGjmVkEN3trWfE58HtOIxf1NZEGFMyyhJaGuxTvEr5P3lxNUYvmp709y3Hd5cIL2X5ocmOofA7vT5VbZiNSIGaXMEEPmndSqT9Ml6jPyuob6JlltZxXWWdVXVkwcDOb++BV16u4v0r/IWNRojdJRS8Qx48SEGdyoyAXSEJ5DA+A4Ai6j1wCG8F+j4+BdBEynvJ1I8gi6/1UuIuTzQY5oHiwiQIy6AILwYtQHshFwMYV6HUlNsolaAR+IboAwAn5G6/iUOYC+XMtF+ANoPe9G+EdoHLg3vE1s8k1wVLSZfgfN3Aj8AT4SrXAyEEvKEECgL7aYXyYr+QmuEuGztmir3Axnx0MS59li4qiqoKaCqqguVuaTpbWuiJSWRjSJe8QT7735W9TSwrLvIbl0XS0J0Uk5v457qqeaovIAO6UJ92F94dhAnLz7vd2zRC95b4Zmb4Qi/rjzJuZatCx9R3zbl+hcoDrnZZHGSYVberXFhtmaxaZ6suh0r6qcLlPVMI11LU2Kuu6zWFe1rqKEKLed8VRTwg+BkXuMDw/rTaTBZNQPk4motstP+9UOZSvR1KNQspRaIdaWkzqd3qCjdVpDSpck0/AYMCPP0NXHY3MJ+tas74enxFxfhJ2m2Ok2n8TJWtvN8tStZeVDeSS/fWsXhcDAPcRHDGb9iAEz2/QOcnGmX+OlvRp7O0O0XGhXaiiNskFXQvaqDYZ2ehAtTIrw62ASGR42GIdNejPp9wxoXbRL6+wePWfTjDUGC9y1zmaHEgPZaPVLyRPlgnJBFWBtCVvUOxHCJkKOeIKIamfUQYoNKn2tLtamtDBGzMRUDxWR/OH/viVr5A4+2zGrjl3AemNzF+fIR7fd8Xl6Pu795j4xowt2TVBdgdZgZbjHqr7ScRUrCysm/YTb6hxzUI5rPvMUOe6/pA3QAd1Uz3TXONiV3uJirrRaMAvDGBnyWCHbUElXNXRUnCJabYxHRnlk0/L5NsuAvX9Ui/1UH5JICZWWZc9TGlbZLyUVcpOdoaX2Jle9DxN+Cn4TPeMeIECKOlMfn/wd7eYxBLShOckHiFCvR4F7z9rH+L8CDADCQvEXCmVuZHN0cmVhbQplbmRvYmoKNDkgMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL0xlbmd0aCAyNzAKPj4Kc3RyZWFtCmjeVFFNb8MgDL3zK3zs1ANJRqpOQpGmbpNy2IeWrncKToa0EEToIf9+fGTdhgQ2z+8Z29BD+9Aa7YG+uUl26KHXRjmcp4uTCGcctIGyAqWlX2/plKOwQIO4W2aPY2v6CTgn9D0EZ+8W2NyntX3abYsboK9OodNmgM2x/DgFoLtY+4UjGg8FNA0o7Ak9PAv7IkYE+kf9GzouFqFK93ItY1I4WyHRCTMg8KpogNesATTqf4xUWXHu5adwJDOLIhjC2W3ygyFBtzLYDz/LOasDie0ys46qfQTuMrCPAMbHc172GIC6WqsJQPBz8pwu1hdHeO1YXpwLw0hzTs3GNrXB61fYycau4ibfAgwA9suE4QplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA1MAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA1NCAwMDAwMCBuIAowMDAwMDAwMTM0IDAwMDAwIG4gCjAwMDAwMDAxODMgMDAwMDAgbiAKMDAwMDAwMDM5OSAwMDAwMCBuIAowMDAwMDAyNjg2IDAwMDAwIG4gCjAwMDAwMDI5MDQgMDAwMDAgbiAKMDAwMDAwMjkzOSAwMDAwMCBuIAowMDAwMDA1NjM2IDAwMDAwIG4gCjAwMDAwMDU3MTEgMDAwMDAgbiAKMDAwMDAwNjY5MSAwMDAwMCBuIAowMDAwMDA2NzQzIDAwMDAwIG4gCjAwMDAwMDY4MjggMDAwMDAgbiAKMDAwMDAwNjkxMSAwMDAwMCBuIAowMDAwMDA2OTkzIDAwMDAwIG4gCjAwMDAwMDcwNzcgMDAwMDAgbiAKMDAwMDAwNzM2OCAwMDAwMCBuIAowMDAwMDA3NDc3IDAwMDAwIG4gCjAwMDAwMDc3NDQgMDAwMDAgbiAKMDAwMDAwODUwMiAwMDAwMCBuIAowMDAwMDA4ODIwIDAwMDAwIG4gCjAwMDAwMDk0NTkgMDAwMDAgbiAKMDAwMDAwOTk0MyAwMDAwMCBuIAowMDAwMDEwNzAzIDAwMDAwIG4gCjAwMDAwMTY1MzMgMDAwMDAgbiAKMDAwMDAxNjk0MyAwMDAwMCBuIAowMDAwMDE3NTgwIDAwMDAwIG4gCjAwMDAwMTc4MzYgMDAwMDAgbiAKMDAwMDAxODI4NSAwMDAwMCBuIAowMDAwMDIxNTM2IDAwMDAwIG4gCjAwMDAwMjE5MzMgMDAwMDAgbiAKMDAwMDAyMjU3MiAwMDAwMCBuIAowMDAwMDIyODkxIDAwMDAwIG4gCjAwMDAwMjM0MTQgMDAwMDAgbiAKMDAwMDAyNzE5MyAwMDAwMCBuIAowMDAwMDI3NTk1IDAwMDAwIG4gCjAwMDAwMjc4MTQgMDAwMDAgbiAKMDAwMDAyOTI5MiAwMDAwMCBuIAowMDAwMDI5NTExIDAwMDAwIG4gCjAwMDAwMjk3MzAgMDAwMDAgbiAKMDAwMDAzMTU3OCAwMDAwMCBuIAowMDAwMDMxNzg2IDAwMDAwIG4gCjAwMDAwMzIwMDUgMDAwMDAgbiAKMDAwMDAzMzM4NSAwMDAwMCBuIAowMDAwMDMzNTkxIDAwMDAwIG4gCjAwMDAwMzM5OTMgMDAwMDAgbiAKMDAwMDAzNDEwNiAwMDAwMCBuIAowMDAwMDM0MzkyIDAwMDAwIG4gCjAwMDAwMzU1NTkgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA1MAovUm9vdCAzIDAgUgovSW5mbyAxIDAgUgo+PgpzdGFydHhyZWYKMzU5MDIKJSVFT0YK";

const GUIDE = [
  { phase: "Phase 1", color: "#1E40AF", title: "Get Your MyFreeScoreNow Report", body: "Go to MyFreeScoreNow.com — this is your primary credit report. It shows all 3 bureaus with real FICO scores.\n\nLog in → 3B Reports → switch to Classic View (orange button) → right-click Save As → save as a single webpage / PDF.\n\nAlternative: IdentityIQ or MyScoreIQ also work. Don't use Credit Karma or the Experian app as your dispute source — they don't hold weight." },
  { phase: "Phase 2 · Step 1", color: "#D97706", title: "Identify the Items to Dispute", body: "Review your report with the agent and decide which items you believe are inaccurate, incomplete, or not yours. You choose what goes on the letters — the agent never decides that for you.\n\nFor each item, the basis is accuracy: the bureau must verify it with the furnisher, and anything that cannot be verified must be corrected or deleted under FCRA Section 611.\n\nIf you are a genuine victim of identity theft, you can additionally complete the affidavit step in the app yourself, and file your own report at IdentityTheft.gov." },
  { phase: "Phase 2 · Step 2", color: "#6D28D9", title: "Build Your Packet (Per Bureau)", body: "One packet per bureau in this order:\n1. Cover Letter (handwritten — copy the app's letter)\n2. Personal Information Update Letter (only if your personal info is wrong)\n3. ID Page (photo ID + SSN card + proof of address)\n4. Credit Report pages\n5. Affidavit — only if you are a victim and completed it yourself\n6. FCRA 605B page\n\nThe app builds the combined PDF for each bureau. Download all three from the Package tab and mail each via USPS Certified Mail with tracking." },
  { phase: "Phase 2 · Step 3", color: "#059669", title: "Document Preparation Rules", body: "ID: show all four corners, legible, no light/dark spots. Never crop corners.\n\nProof of address: crop out the date (over 30 days = rejected). Show only name + company + address.\n\nHighlighter: yellow or blue only. Never pink — it shows as redacted black on TransUnion.\n\nDates: always use separators. 01/15/2025 or January 15th 2025. Never 01152025." },
  { phase: "Phase 2 · Step 4", color: "#DC2626", title: "Mail & Follow Up", body: "Mail all 3 packets via USPS Certified Mail with Return Receipt the same day. Keep every receipt.\n\nSection 611 gives the bureau 30 days to complete the reinvestigation. If a furnisher cannot verify an item, it must be corrected or deleted.\n\nBureau numbers:\n• Equifax: 404-885-8000 / 888-548-7811\n• Experian: 714-830-7000 / 888-397-3742\n• TransUnion: 610-690-4909 / 800-916-8800 (ask for Special Handling)\n\nBe courteous and persistent. Document date, time, rep name, and rep ID for every call." },
  { phase: "Phase 2 · Step 5", color: "#7C3AED", title: "Escalate to the CFPB if Needed", body: "If a bureau does not properly reinvestigate, file at CFPB.gov → Start New Complaint.\n\nThe company must respond within 15 days (extendable to 60). State that the item is inaccurate and unverified and is harming your credit profile, and ask for correction or deletion.\n\nDon't include your SSN or full account numbers in the complaint. You can submit more than one if needed." },
  { phase: "Phase 3", color: "#0F172A", title: "Build to 800+ Club", body: "Six factors to optimize:\n• Payment history: 100% on time\n• Utilization: 0-3%\n• Derogatory remarks: 0\n• Credit age: 9+ years\n• Total accounts: 21+\n• Inquiries: low\n\nAuthorized-user tradelines (clean, aged, low utilization, reports all 3 bureaus) help credit age, utilization, and account count. Good issuers: Chase, BofA, Capital One, Discover, Elan, Barclays. Avoid Citibank (often 2 bureaus).\n\nMass apply only at 800+: 4-5 cards at a time. 780+ gets the best rates." },
];

// The blank FTC affidavit fields the client completes themselves in the app.
const AFFIDAVIT_DECLARATIONS = [
  "I did not authorize anyone to use my name or personal information to obtain money, credit, loans, goods, or services.",
  "I did not receive any money, goods, services, or other benefit as a result of the events described in this affidavit.",
  "I am willing to work with law enforcement if charges are brought against the person(s) who committed the fraud.",
];

function ClientApp() {
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
  // Client-completed affidavit (blank until the client fills it in themselves).
  const [affidavitData, setAffidavitData] = useState(null);
  const [showAffidavit, setShowAffidavit] = useState(false);

  // Text-only Package sub-tabs (these support Copy and render as plain text).
  const TEXT_TABS = ["equifax", "experian", "transunion", "personalInfo", "handwrittenNote"];

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
          personal_info: data.personalInfoNeeded ? buildPersonalInfoText("equifax") : null,
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
      const path = `${cid}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("client-documents")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("client-documents")
        .getPublicUrl(path);
      await supabase.from("documents").insert([{
        client_id: cid,
        file_name: file.name,
        file_url: urlData?.publicUrl || path,
        storage_path: path,
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
          if (s.affidavitData) setAffidavitData(s.affidavitData);
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
    const snap = { v: 2, ts: Date.now(), messages, history, profile: profileRef.current, pkg, slots, docFiles, uploads, progress, statusTxt, approved, clientId, affidavitData };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(snap));
    } catch {
      try {
        const lightSlots = {};
        Object.keys(slots || {}).forEach(k => { const v = slots[k]; lightSlots[k] = v ? { name: v.name, type: v.type } : v; });
        const lightDocs = (docFiles || []).map(d => ({ name: d.name, type: d.type }));
        localStorage.setItem(SESSION_KEY, JSON.stringify({ ...snap, slots: lightSlots, docFiles: lightDocs, filesDropped: true }));
      } catch (e2) { console.error("autosave failed:", e2.message); }
    }
  }, [restored, messages, history, pkg, slots, docFiles, uploads, progress, statusTxt, approved, clientId, profile, affidavitData]);

  // Clear saved progress and start a brand-new client on this device.
  function resetSession() {
    if (!window.confirm("Reset the process? This clears all current progress on this device and starts a brand-new client.")) return;
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    setMessages([]); setHistory([]); setPkg(null); setSlots({}); setDocFiles([]);
    setUploads([]); setProgress(0); setStatusTxt("Ready to begin"); setApproved(false);
    setClientId(null); setProfile(null); profileRef.current = null; setDocTab("equifax"); setTab(0);
    setAffidavitData(null); setShowAffidavit(false);
    initAgent();
  }

  // Pull the model's running memory block out of a reply.
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

  // Replace heavy base64 blocks with a light placeholder so a raw file is sent once.
  function lighten(content) {
    if (!Array.isArray(content)) return content;
    return content.map(b =>
      (b && (b.type === "document" || b.type === "image"))
        ? { type: "text", text: `[${b.type} was uploaded earlier and already read — extracted data is in CONFIRMED CLIENT STATE]` }
        : b
    );
  }

  function lightenAll(hist) {
    return hist.map(m => ({ ...m, content: lighten(m.content) }));
  }

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
      const fallback = "Welcome to Credit Counsel Elite.\n\nI'm your AI intake agent. I'll read your documents and build your dispute packages for you.\n\nStart by uploading your credit report, or tell me your full legal name and we'll go from there.";
      setHistory([{ role: "user", content: "START_INTAKE" }, { role: "assistant", content: fallback }]);
      setMessages([{ from: "agent", text: fallback }]);
      setProgress(8);
      setStatusTxt("Collecting client information");
    }
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 200);
  }

  // Safely pull the PACKAGE_READY JSON out of a reply.
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
    if (end === -1) return null;
    try { return JSON.parse(after.slice(start, end + 1)); } catch { return null; }
  }

  async function generatePackages() {
    if (busy) return;
    setBusy(true); setStatusTxt("Building your packages…"); setProgress(95);
    try {
      const directive = { role: "user", content: "Generate the three dispute packages now. Output ONLY the PACKAGE_READY block — the line PACKAGE_READY: followed by the JSON object — using all client info and the items the client chose to dispute. No prose, no questions, nothing before or after the block." };
      const txt = await callAPI([...history, directive], 8000);
      const { clean, state } = extractState(txt);
      applyState(state);
      const json = parsePackage(clean);
      if (json) {
        setPkg(json); setProgress(100); setStatusTxt("Package complete");
        setHistory(prev => [...prev, directive, { role: "assistant", content: clean }]);
        const cid = clientId || await saveClient(json);
        if (cid) await savePackage(cid, json);
        setTab(1);
      } else {
        setProgress(80); setStatusTxt("Could not generate");
        setTab(0);
        setMessages(prev => [...prev, { from: "agent", text: "I could not assemble the packages yet — I may still be missing a required item (credit report, photo ID, proof of address, or your selection of which items to dispute). Add what is missing in Intake, then try again." }]);
      }
    } catch (e) {
      console.error("generatePackages error:", e.message);
      setStatusTxt("Generation error"); setTab(0);
      setMessages(prev => [...prev, { from: "agent", text: "Error building packages: " + e.message + ". Please screenshot this." }]);
    }
    setBusy(false);
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
    else if (turns === 3) setStatusTxt("Reviewing items to dispute");
    else if (turns >= 5) setStatusTxt("Reviewing your documents");
    const wantsPkg = !pkg && /\b(generate|pdf|pdfs|package|packages|build|create|finish|finaliz|download)\b/i.test(text);
    const histForApi = wantsPkg
      ? [...history, { role: "user", content: text + "\n\n(System: All required client info and documents are collected and the client has identified the items to dispute. Output the PACKAGE_READY block now — the JSON block that builds the three packages. Do NOT reply with prose saying the packages are ready; output the block itself.)" }]
      : newHist;
    try {
      const txt = await callAPI(histForApi, 8000);
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
          setProgress(80); setStatusTxt("Ready to generate");
          setMessages(prev => [...prev, { from: "agent", text: "I have everything I need. Reply \"generate\" and I will build your three packages." }]);
        }
      } else {
        pushAgentReply(clean);
        if (statusTxt === "Reviewing your documents") setStatusTxt("Intake in progress");
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

    const cid = clientId || null;
    for (const file of files) {
      if (cid) await uploadToSupabase(file, cid);
    }

    setStatusTxt("Reading documents...");
    const fileData = await Promise.all(files.map(f => new Promise(res => {
      const r = new FileReader();
      r.onload = ev => res({ name: f.name, type: f.type, size: f.size, data: ev.target.result });
      r.readAsDataURL(f);
    })));

    const docs = fileData.filter(f => f.type.startsWith("image/") || f.type === "application/pdf");
    setDocFiles(prev => [...prev, ...docs.map(f => ({ name: f.name, type: f.type, dataUrl: f.data }))]);
    setSlots(prev => {
      const next = { ...prev };
      for (const f of docs) {
        const cat = inferSlot(f.name);
        if (cat && !next[cat]) next[cat] = { name: f.name, type: f.type, dataUrl: f.data };
      }
      return next;
    });

    // Build readable blocks; any single file too large to read is noted as text.
    const readable = [];
    const tooBig = [];
    for (const fd of fileData) {
      if (fd.size > 3 * 1024 * 1024) tooBig.push(fd.name);
      else if (fd.type === "application/pdf") readable.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: fd.data.split(",")[1] } });
      else if (fd.type.startsWith("image/")) readable.push({ type: "image", source: { type: "base64", media_type: fd.type, data: fd.data.split(",")[1] } });
    }

    // Split the readable blocks into chunks that each fit under the request size limit,
    // so a client can drop everything at once and the agent still reads all of it.
    const baseHist = lightenAll(history);
    const chunks = [];
    let cur = [];
    for (const blk of readable) {
      const probe = [...baseHist, { role: "user", content: [...cur, blk, { type: "text", text: "x" }] }];
      if (cur.length > 0 && bodySize(probe) > SAFE_BODY_LIMIT) { chunks.push(cur); cur = [blk]; }
      else cur = [...cur, blk];
    }
    if (cur.length) chunks.push(cur);
    if (chunks.length === 0) chunks.push([]);

    const names = files.map(f => f.name).join(", ");
    let runningHist = baseHist;
    let finalClean = "";
    try {
      for (let ci = 0; ci < chunks.length; ci++) {
        const isLast = ci === chunks.length - 1;
        const instr = isLast
          ? `I uploaded: ${names}.${tooBig.length ? ` (Too large to read automatically: ${tooBig.join(", ")} — I will type those details.)` : ""} Please read carefully, extract everything from all of my documents into your memory, tell me what you found, and ask which items I want to dispute or for anything still needed.`
          : `Here are some of my documents (batch ${ci + 1} of ${chunks.length}). Read them and extract everything into your memory now. More are coming in my next message — just confirm you have read these and do not ask for anything yet.`;
        let userMsg = { role: "user", content: [...chunks[ci], { type: "text", text: instr }] };
        let sendHist = [...runningHist, userMsg];
        if (bodySize(sendHist) > SAFE_BODY_LIMIT) {
          userMsg = { role: "user", content: [{ type: "text", text: `I uploaded ${names}, but the files are too large to read automatically. They are saved securely in storage — I will type the key details.` }] };
          sendHist = [...runningHist, userMsg];
          if (isLast) setMessages(prev => [...prev, { from: "agent", text: "Some files were a bit large for automatic reading, but they're saved securely. You can upload smaller copies or just type the key details and we'll keep moving." }]);
        }
        setStatusTxt(chunks.length > 1 ? `Reading documents (${ci + 1}/${chunks.length})…` : "Reading documents...");
        const txt = await callAPI(sendHist, 8000);
        const { clean, state } = extractState(txt);
        applyState(state);
        finalClean = clean;
        runningHist = [...runningHist, { role: "user", content: lighten(userMsg.content) }, { role: "assistant", content: clean }];
      }
      setHistory(runningHist);
      const clean = finalClean;
      if (clean.includes("PACKAGE_READY:")) {
        const json = parsePackage(clean);
        if (json) {
          setPkg(json); setProgress(100); setStatusTxt("Package complete");
          const cid2 = clientId || await saveClient(json);
          if (cid2) await savePackage(cid2, json);
          setMessages(prev => [...prev, { from: "agent", text: `Your three packages are ready. Open the Package tab to review and download each bureau's PDF.` }]);
          setTimeout(() => { setTab(1); setShowReview(true); }, 1400);
        } else {
          setProgress(85); setStatusTxt("Documents read — continuing intake");
          setMessages(prev => [...prev, { from: "agent", text: "I have read your documents. Reply \"generate\" and I will build your three packages." }]);
        }
      } else {
        pushAgentReply(clean);
        setProgress(prev => Math.min(80, prev + 15));
        setStatusTxt("Documents read — continuing intake");
      }
    } catch (e) {
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

  // Show an agent reply, turning any in-chat step tokens into inline cards:
  // FTC_REPORT_STEP → an upload box for the client's own FTC report;
  // AFFIDAVIT_STEP → the fill-in form for the official FTC affidavit.
  function pushAgentReply(clean) {
    const wantsFtc = /FTC_REPORT_STEP/.test(clean);
    const wantsAff = /AFFIDAVIT_STEP/.test(clean);
    const text = clean.replace(/FTC_REPORT_STEP/g, "").replace(/AFFIDAVIT_STEP/g, "").trim();
    const add = [];
    if (text) add.push({ from: "agent", text });
    if (wantsFtc) add.push({ from: "ftc_upload" });
    if (wantsAff) add.push({ from: "affidavit_form" });
    if (add.length) setMessages(prev => [...prev, ...add]);
  }

  // Send a turn to the agent on the client's behalf (used to continue after a step).
  async function sendProgrammatic(text) {
    if (busy || !text) return;
    setMessages(prev => [...prev, { from: "user", text }]);
    setBusy(true);
    const newHist = [...history, { role: "user", content: text }];
    setHistory(newHist);
    try {
      const txt = await callAPI(newHist, 8000);
      const { clean, state } = extractState(txt);
      applyState(state);
      setHistory([...newHist, { role: "assistant", content: clean }]);
      if (clean.includes("PACKAGE_READY:")) {
        const json = parsePackage(clean);
        if (json) {
          setPkg(json); setProgress(100); setStatusTxt("Package complete");
          const cid = clientId || await saveClient(json);
          if (cid) await savePackage(cid, json);
          setMessages(prev => [...prev, { from: "agent", text: "Your packages are ready. Open the Package tab to review and download each bureau's PDF." }]);
          setTimeout(() => { setTab(1); setShowReview(true); }, 1400);
        } else pushAgentReply(clean);
      } else pushAgentReply(clean);
    } catch (e) {
      setMessages(prev => [...prev, { from: "agent", text: "Error: " + e.message }]);
    }
    setBusy(false);
  }

  // Drop the affidavit fill-in form into the chat on demand (always reachable).
  function openAffidavitInChat() {
    setTab(0);
    setMessages(prev => [
      ...prev,
      { from: "agent", text: "If any items on your report were opened or used by an identity thief, fill out the official FTC affidavit below in your own words. Only complete it if you are genuinely a victim — otherwise you can skip it and we'll dispute on accuracy grounds. You'll sign and notarize it yourself." },
      { from: "affidavit_form" },
    ]);
  }

  // Drop the FTC report upload box into the chat on demand.
  function openFtcInChat() {
    setTab(0);
    setMessages(prev => [
      ...prev,
      { from: "agent", text: "If you are an identity theft victim, file your report at IdentityTheft.gov, then upload the PDF here and I'll attach it to your packet." },
      { from: "ftc_upload" },
    ]);
  }

  // Client finished the in-chat affidavit form: save their answers and continue.
  function completeAffidavit(ans) {
    setAffidavitData({ ...ans, completed: true });
    setMessages(prev => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].from === "affidavit_form") { copy[i] = { from: "agent", text: "Saved. Your answers will be printed onto the official FTC affidavit in your packet, ready for you to sign and notarize. You can edit them any time in Package → Affidavit." }; break; }
      }
      return copy;
    });
    setTimeout(() => sendProgrammatic("I've completed my identity theft affidavit in the app."), 400);
  }

  function completeFtcUpload(file) {
    if (!file) return;
    setSlotFile("ftcReport", file);
    setMessages(prev => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].from === "ftc_upload") { copy[i] = { from: "agent", text: `Got it — your FTC report (${file.name}) is attached to your packet.` }; break; }
      }
      return copy;
    });
    setTimeout(() => sendProgrammatic("I've uploaded my FTC identity theft report."), 400);
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(""), 2200); });
  }

  // Load a library on demand from CDN as a fallback if the bundled import fails.
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
  const loadJsPDF = async () => {
    try { return (await import("jspdf")).jsPDF; }
    catch { return loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", () => window.jspdf?.jsPDF); }
  };
  const loadPdfLib = async () => {
    try { return await import("pdf-lib"); }
    catch { return loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js", () => window.PDFLib); }
  };

  function dataURLtoBytes(dataUrl) {
    const b64 = (dataUrl || "").split(",")[1] || "";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  function b64ToBytes(b64) {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  // Embed an image (jpg or png) into a pdf-lib doc, trying both decoders.
  async function embedImage(merged, bytes) {
    try { return await merged.embedJpg(bytes); } catch { return await merged.embedPng(bytes); }
  }

  // Draw an image scaled to fit inside a box, centered, preserving aspect ratio.
  function drawFitted(page, img, box) {
    const s = Math.min(box.w / img.width, box.h / img.height, 1);
    const w = img.width * s, h = img.height * s;
    page.drawImage(img, { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, width: w, height: h });
  }

  // Infer which packet slot an uploaded file belongs to, from its filename.
  function inferSlot(name) {
    const n = (name || "").toLowerCase();
    if (/passport/.test(n)) return "passport";
    if (/\bftc\b|identitytheft|identity.?theft.?report|ftc.?report/.test(n)) return "ftcReport";
    if (/affidavit|complaint|victim|idtheftaffidavit|\bh-?1\b/.test(n)) return "affidavit";
    if (/police/.test(n)) return "policeReport";
    if (/ssn|social/.test(n)) return "ssnCard";
    if (/licen|driver|state.?id|photo.?id|\bdl\b|\bid\b/.test(n)) return "photoID";
    if (/bill|utility|electric|sdge|residence|lease|proof|address/.test(n)) return "proofResidence";
    if (/credit.?report|report|3b|tri|fico|score/.test(n)) return "creditReport";
    return null;
  }

  // Per-bureau personal information correction letter, built deterministically in code
  // from the template — correct bureau name/address every time, no model placeholders,
  // and the SSN is masked to last-4 (full SSN is never written into the letter or DB).
  function buildPersonalInfoText(bureauKey) {
    const b = BUREAUS.find(x => x.key === bureauKey);
    const today = new Date().toLocaleDateString("en-US");
    const ssn = pkg && pkg.ssn4 ? "XXX-XX-" + pkg.ssn4 : "";
    return [
      `Date ${today}`,
      `Credit Bureau Name: ${b.label}`,
      `Credit Bureau Address: ${BUREAU_ADDR[bureauKey]}`,
      ``,
      `To Whom It May Concern:`,
      ``,
      `I am writing to update/correct my personal information on file with your company.`,
      ``,
      `Please update my address to: ${(pkg && pkg.clientAddress) || ""}`,
      `Please update my name to: ${(pkg && pkg.clientName) || ""}`,
      `My only social security number is: ${ssn}`,
      `My only and correct date of birth is: ${(pkg && pkg.dob) || ""}`,
      ``,
      `I do not wish to have any telephone numbers on my report.`,
      ``,
      `Please remove all the other addresses off my report, as they are not deliverable to me by the U.S. post office, and they are not reportable as per the FCRA, since they are inaccurate.`,
      ``,
      `Sincerely,`,
      `${(pkg && pkg.clientName) || ""}`,
      ``,
      `Enc. Driver License, Passport, SSN Card, and Proof of Residence`,
    ].join("\n");
  }

  // The per-bureau letters that lead the packet: a blank page for the client's
  // handwritten cover letter, then the typed cover letter and personal info letter.
  function buildLettersDoc(bureauKey, JsPDF) {
    const b = BUREAUS.find(x => x.key === bureauKey);
    const doc = new JsPDF({ unit: "pt", format: "letter" });
    const M = 64, W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), maxW = W - M * 2;
    let y = M;
    const room = (lh) => { if (y + lh > H - M) { doc.addPage(); y = M + 12; } };
    // Body: 12.5pt serif with generous 18pt leading, blank lines preserved for spacing.
    const para = (txt, size = 12.5, lh = 18) => {
      doc.setFont("times", "normal"); doc.setFontSize(size); doc.setTextColor("#111111");
      String(txt || "").split("\n").forEach(rawLine => {
        if (rawLine.trim() === "") { room(lh * 0.6); y += lh * 0.6; return; }
        doc.splitTextToSize(rawLine, maxW).forEach(line => { room(lh); doc.text(line, M, y); y += lh; });
      });
    };

    // Page 1 — intentionally blank for the client's handwritten cover letter.
    doc.setFont("times", "italic"); doc.setFontSize(9); doc.setTextColor("#cbd5e1");
    doc.text("Handwrite your cover letter on this page.", M, M);
    doc.setTextColor("#111111");

    // Page 2 — the cover letter, rendered as a plain business letter (no branding).
    doc.addPage(); y = M + 12;
    para(pkg[bureauKey]);
    if (pkg.personalInfoNeeded) { doc.addPage(); y = M + 12; para(buildPersonalInfoText(bureauKey)); }
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


  // Build ONE complete mailable PDF per bureau, in assembly order:
  // letters → ID/passport/SSN/bill → credit report → affidavit (client-filled or blank)
  // → FCRA 605B. Documents come from the slots; chat uploads are the fallback.
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
            const img = await embedImage(merged, bytes);
            const page = merged.addPage([612, 792]);
            drawFitted(page, img, { x: 36, y: 36, w: 540, h: 720 });
          }
        } catch (inner) { console.error("Skipped document", f.name, inner.message); }
      };
      // Composite identification page: SSN card and photo ID / passport side by side on
      // top, proof of residence below — matching the requested layout. Only used for
      // image files; PDF versions fall through to appendFile as their own pages.
      const isImg = (f) => f && f.type && f.type.startsWith("image/");
      const buildIdentityPage = async () => {
        const ssn = isImg(slots.ssnCard) ? slots.ssnCard : null;
        const idDoc = isImg(slots.passport) ? slots.passport : (isImg(slots.photoID) ? slots.photoID : null);
        const proof = isImg(slots.proofResidence) ? slots.proofResidence : null;
        if (!ssn && !idDoc && !proof) return new Set();
        const page = merged.addPage([612, 792]);
        page.drawText("Identification", { x: 36, y: 760, size: 11 });
        const top = [ssn, idDoc].filter(Boolean);
        if (top.length === 1) {
          const img = await embedImage(merged, dataURLtoBytes(top[0].dataUrl));
          drawFitted(page, img, { x: 56, y: 470, w: 500, h: 270 });
        } else if (top.length === 2) {
          const a1 = await embedImage(merged, dataURLtoBytes(top[0].dataUrl));
          const a2 = await embedImage(merged, dataURLtoBytes(top[1].dataUrl));
          drawFitted(page, a1, { x: 36, y: 470, w: 264, h: 270 });
          drawFitted(page, a2, { x: 312, y: 470, w: 264, h: 270 });
        }
        if (proof) {
          const p = await embedImage(merged, dataURLtoBytes(proof.dataUrl));
          drawFitted(page, p, { x: 36, y: 40, w: 540, h: 410 });
        }
        const used = new Set();
        [ssn, idDoc, proof].forEach(f => { if (f) used.add(f.dataUrl); });
        return used;
      };
      // Merge the official FTC affidavit: the client's uploaded completed copy if present,
      // otherwise the client's in-chat answers printed onto the official form, otherwise blank.
      const mergePdfBytes = async (bytes) => {
        const d = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
        (await merged.copyPages(d, d.getPageIndices())).forEach(p => merged.addPage(p));
      };
      const appendOfficialAffidavit = async () => {
        try {
          if (affidavitData && affidavitData.completed) await mergePdfBytes(await fillAffidavit(affidavitData, PDFLib));
          else await mergePdfBytes(b64ToBytes(FTC_AFFIDAVIT_B64));
        } catch (inner) {
          console.error("Affidavit merge failed:", inner.message);
          try { await mergePdfBytes(b64ToBytes(FTC_AFFIDAVIT_B64)); } catch {}
        }
      };

      await appendDoc(lettersDoc);
      const anySlot = PACKET_SLOTS.some(s => slots[s.key]);
      if (anySlot) {
        const usedUrls = await buildIdentityPage();
        // Any ID/SSN/proof that were PDFs (not placed on the composite page) get added here.
        for (const k of ["photoID", "passport", "ssnCard", "proofResidence"]) {
          if (slots[k] && !usedUrls.has(slots[k].dataUrl)) { await appendFile(slots[k]); usedUrls.add(slots[k].dataUrl); }
        }
        // Credit report next.
        if (slots.creditReport && !usedUrls.has(slots.creditReport.dataUrl)) { await appendFile(slots.creditReport); usedUrls.add(slots.creditReport.dataUrl); }
        // Affidavit: client's uploaded copy if present, otherwise the blank official form.
        if (slots.affidavit) { await appendFile(slots.affidavit); usedUrls.add(slots.affidavit.dataUrl); }
        else await appendOfficialAffidavit();
        // FTC report and police report if the client uploaded them.
        for (const k of ["ftcReport", "policeReport"]) {
          if (slots[k] && !usedUrls.has(slots[k].dataUrl)) { await appendFile(slots[k]); usedUrls.add(slots[k].dataUrl); }
        }
        // Anything uploaded in chat that wasn't sorted into a slot, so nothing is dropped.
        for (const f of docFiles) { if (!usedUrls.has(f.dataUrl)) await appendFile(f); }
      } else {
        for (const f of docFiles) await appendFile(f);
        await appendOfficialAffidavit();
      }
      await appendDoc(build605BDoc(JsPDF));
      const out = await merged.save();
      const blob = new Blob([out], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `CCE_${b.label}_Packet_${safe}.pdf`; a.click();
      URL.revokeObjectURL(url);
      setStatusTxt("Packet downloaded");
    } catch (e) {
      console.error("downloadBureauPacket error:", e.message);
      setStatusTxt("PDF error — opening print view");
      setMessages(prev => [...prev, { from: "agent", text: `I could not build the ${b.label} PDF automatically (${e.message}). I am opening a print view as a backup — use your browser's "Save as PDF". If this keeps happening, screenshot this message.` }]);
      printBureau(bureauKey);
    }
  }

  // Fallback: open a clean print window for one bureau (browser "Save as PDF").
  function printBureau(bureauKey) {
    const b = BUREAUS.find(x => x.key === bureauKey);
    if (!b || !pkg?.[bureauKey]) return;
    let body = `<div class="sec"><h2 style="color:${b.color}">Cover Letter — ${b.label}</h2><div class="banner">HANDWRITE THIS — copy it word for word in blue or black ink on plain white paper.</div><pre>${pkg[bureauKey] || ""}</pre></div>`;
    if (pkg.personalInfoNeeded) body += `<div class="pb"></div><div class="sec"><h2>Personal Information Correction Letter</h2><pre>${buildPersonalInfoText(bureauKey)}</pre></div>`;
    body += `<div class="pb"></div><div class="sec"><h2 style="color:#059669">Mail Packet — Assembly Order</h2><pre>${pkg.packetOrder || ""}</pre>`;
    if (pkg.checklist?.length) body += `<h3>Document Checklist</h3><ul>${pkg.checklist.map(c => `<li>${c}</li>`).join("")}</ul>`;
    body += `</div>`;
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>CCE — ${b.label} Package</title><style>body{font-family:Georgia,serif;max-width:740px;margin:40px auto;padding:0 24px;color:#111;line-height:1.85}h1{color:${b.color};margin-bottom:2px}.sub{color:#888;font-size:12px;margin-bottom:28px}h2{border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin:0 0 14px}h3{margin:18px 0 6px}.sec{margin-bottom:40px}.pb{page-break-after:always}.banner{background:#f3e8ff;color:#6b21a8;font-family:Arial;font-size:11px;font-weight:bold;padding:8px 12px;border-radius:6px;margin-bottom:14px}pre{white-space:pre-wrap;font-size:12px;line-height:1.9;font-family:Georgia,serif}ul{line-height:2.1;font-size:12px}@media print{.pb{page-break-after:always}}</style></head><body><h1>Credit Counsel Elite</h1><div class="sub">${b.label} Dispute Package — ${pkg.clientName || ""} — ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>${body}</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 400);
  }

  async function downloadAllPackets() {
    for (const b of BUREAUS) {
      if (pkg?.[b.key]) { await downloadBureauPacket(b.key); await new Promise(r => setTimeout(r, 700)); }
    }
  }

  // Download the blank official FTC affidavit so the client can fill it out themselves.
  function downloadBlankAffidavit() {
    try {
      const blob = new Blob([b64ToBytes(FTC_AFFIDAVIT_B64)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "FTC_Identity_Theft_Affidavit_Blank.pdf"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error("downloadBlankAffidavit error:", e.message); }
  }

  // Print the CLIENT'S OWN typed answers onto the official FTC affidavit PDF. The app
  // sources nothing from the credit report and pre-selects nothing — every value here
  // was typed or chosen by the client in the in-chat affidavit form. Coordinates were
  // measured against the official form. Returns filled PDF bytes.
  async function fillAffidavit(ans, PDFLib) {
    const doc = await PDFLib.PDFDocument.load(b64ToBytes(FTC_AFFIDAVIT_B64), { ignoreEncryption: true });
    const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    const pages = doc.getPages();
    const H = 792, COL = PDFLib.rgb(0, 0, 0.55);
    const put = (pi, x, top, text, size = 10) => { if (text == null || text === "") return; pages[pi].drawText(String(text), { x, y: H - top - 7, size, font, color: COL }); };
    const X = (pi, x0, top) => pages[pi].drawText("X", { x: x0 + 0.5, y: H - top - 7, size: 8, font, color: COL });
    // Page 1 — About You
    put(0, 190, 245, ans.fullName);
    put(0, 182, 271, ans.dob);
    put(0, 240, 305, ans.ssn);
    put(0, 192, 326, ans.dlState); put(0, 266, 326, ans.dlNumber);
    put(0, 98, 381, ans.addr1);
    put(0, 98, 413, ans.addr2);
    put(0, 254, 446, ans.since);
    put(0, 212, 473, ans.dayPhone);
    put(0, 212, 491, ans.evePhone);
    put(0, 147, 509, ans.email);
    put(0, 212, 580, ans.nameThen);
    put(0, 180, 613, ans.addrThen1);
    put(0, 98, 647, ans.addrThen2);
    // Page 2 — Declarations (client's own choices)
    if (ans.d11) X(1, ans.d11 === "did" ? 117 : 187, 129);
    if (ans.d12) X(1, ans.d12 === "did" ? 117 : 187, 180);
    if (ans.d13) X(1, ans.d13 === "am" ? 117 : 187, 220);
    // Page 3 — fraud account blocks (up to 3), all client-entered
    const blocks = [
      { inst: 121, num: 150, t1: 174, t2: 189, so: 228, st: 242, d: 271 },
      { inst: 322, num: 352, t1: 376, t2: 390, so: 429, st: 443, d: 473 },
      { inst: 519, num: 549, t1: 573, t2: 588, so: 627, st: 641, d: 670 },
    ];
    const typeBox = (B, t) => ({ credit: [133, B.t1], bank: [189, B.t1], phoneutil: [237, B.t1], loan: [332, B.t1], govbenefits: [133, B.t2], internetemail: [261, B.t2], other: [366, B.t2] })[t];
    (ans.accounts || []).slice(0, 3).forEach((ac, i) => {
      const B = blocks[i];
      put(2, 60, B.inst - 12, ac.institution); put(2, 232, B.inst - 12, ac.contact); put(2, 345, B.inst - 12, ac.phone);
      put(2, 60, B.num - 12, ac.accountNumber); put(2, 250, B.num - 12, ac.routing); put(2, 430, B.num - 12, ac.checkNumbers);
      const tb = typeBox(B, ac.type); if (tb) X(2, tb[0], tb[1]);
      if (ac.status === "opened") X(2, 84, B.so); else if (ac.status === "tampered") X(2, 84, B.st);
      put(2, 60, B.d - 12, ac.dateOpened); put(2, 225, B.d - 12, ac.dateDiscovered); put(2, 430, B.d - 12, ac.amount);
    });
    return await doc.save();
  }

  function printAll() {
    if (!pkg) return;
    const w = window.open("", "_blank");
    let body = "";
    BUREAUS.forEach((b, i) => { if (pkg[b.key]) body += `<div class="sec"><h2 style="color:${b.color}">${b.label}</h2><pre>${pkg[b.key]}</pre></div>${i < 2 ? '<div class="pb"></div>' : ""}`; });
    if (pkg.personalInfoNeeded) body += `<div class="pb"></div><div class="sec"><h2>Personal Information Correction</h2><pre>${buildPersonalInfoText("equifax")}</pre></div>`;
    if (pkg.checklist?.length) body += `<div class="pb"></div><div class="sec"><h2>Document Checklist</h2><ul>${pkg.checklist.map(c => `<li>${c}</li>`).join("")}</ul></div>`;
    w.document.write(`<!DOCTYPE html><html><head><title>Credit Counsel Elite</title><style>body{font-family:Georgia,serif;max-width:740px;margin:40px auto;padding:0 24px;color:#111;line-height:1.85}h1{color:#0f172a}.sub{color:#888;font-size:12px;margin-bottom:32px}h2{border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-bottom:16px}.sec{margin-bottom:48px}.pb{page-break-after:always;margin:48px 0;border-top:2px dashed #e2e8f0}pre{white-space:pre-wrap;font-size:12px;line-height:1.9;font-family:Georgia,serif}ul{line-height:2.2;font-size:13px}@media print{.pb{page-break-after:always}}</style></head><body><h1>Credit Counsel Elite</h1><div class="sub">Dispute Package — ${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>${body}</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 400);
  }

  const docTabs = [
    ...BUREAUS.map(b => ({ key: b.key, label: b.label, color: b.color })),
    { key: "personalInfo",    label: "Personal Info",  color: "#374151" },
    { key: "handwrittenNote", label: "Handwritten",    color: "#7C3AED" },
    { key: "affidavit",       label: "Affidavit",      color: "#7C3AED" },
    { key: "documents",       label: "Documents",      color: "#0f766e" },
    { key: "checklist",       label: "Checklist",      color: "#059669" },
  ];

  function setSlotFile(category, file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => setSlots(prev => ({ ...prev, [category]: { name: file.name, type: file.type, dataUrl: ev.target.result } }));
    r.readAsDataURL(file);
  }

  // Inline card: upload the client's own FTC report (they create it at IdentityTheft.gov).
  function FtcUploadCard({ onUpload }) {
    const ref = useRef(null);
    return (
      <div style={{ maxWidth: "85%", background: "#fff", border: "1px solid #dbeafe", borderRadius: "4px 16px 16px 16px", padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Upload your FTC report</div>
        <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.6, marginBottom: 12 }}>File your report at IdentityTheft.gov, download the PDF it gives you, then add it here. It will be attached to your packet.</div>
        <button onClick={() => ref.current?.click()} style={{ padding: "10px 16px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Choose FTC report file</button>
        <input ref={ref} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = ""; }} />
      </div>
    );
  }

  // Inline card: the client types their OWN answers; nothing is pre-filled from the
  // credit report. On submit the answers are printed onto the official FTC affidavit.
  function AffidavitChatForm({ onDone }) {
    const [f, setF] = useState({
      fullName: pkg?.clientName || "", dob: pkg?.dob || "", ssn: "", dlState: "", dlNumber: "",
      addr1: pkg?.clientAddress || "", addr2: "", since: "", dayPhone: "", evePhone: "", email: "",
      d11: "", d12: "", d13: "",
    });
    const [accts, setAccts] = useState([{ institution: "", contact: "", phone: "", accountNumber: "", type: "", status: "", dateOpened: "", dateDiscovered: "", amount: "" }]);
    const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
    const setAcct = (i, k, v) => setAccts(prev => prev.map((a, idx) => idx === i ? { ...a, [k]: v } : a));
    const addAcct = () => setAccts(prev => prev.length >= 3 ? prev : [...prev, { institution: "", contact: "", phone: "", accountNumber: "", type: "", status: "", dateOpened: "", dateDiscovered: "", amount: "" }]);
    const removeAcct = (i) => setAccts(prev => prev.filter((_, idx) => idx !== i));

    const inp = { width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", marginBottom: 8 };
    const lab = { fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 3, display: "block" };
    const seg = (val, opts) => (
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {opts.map(([v, label]) => (
          <button key={v} type="button" onClick={() => val.set(v)} style={{ padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${val.get === v ? "#1e3a8a" : "#e2e8f0"}`, background: val.get === v ? "#1e3a8a" : "#fff", color: val.get === v ? "#fff" : "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
        ))}
      </div>
    );

    return (
      <div style={{ maxWidth: "92%", background: "#fff", border: "1px solid #e9d5ff", borderRadius: "4px 16px 16px 16px", padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.05)", maxHeight: 460, overflowY: "auto" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>Identity Theft Affidavit</div>
        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.55, marginBottom: 10 }}>Fill this in yourself. Your answers print onto the official FTC form for you to sign and notarize. Only include what you personally know to be true — this is sworn under penalty of perjury.</div>

        <label style={lab}>Full legal name</label><input style={inp} value={f.fullName} onChange={e => set("fullName", e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><label style={lab}>Date of birth</label><input style={inp} placeholder="mm/dd/yyyy" value={f.dob} onChange={e => set("dob", e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={lab}>SSN</label><input style={inp} value={f.ssn} onChange={e => set("ssn", e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><label style={lab}>Driver's license state</label><input style={inp} value={f.dlState} onChange={e => set("dlState", e.target.value)} /></div>
          <div style={{ flex: 2 }}><label style={lab}>Driver's license number</label><input style={inp} value={f.dlNumber} onChange={e => set("dlNumber", e.target.value)} /></div>
        </div>
        <label style={lab}>Street address</label><input style={inp} value={f.addr1} onChange={e => set("addr1", e.target.value)} />
        <label style={lab}>City, State, ZIP, Country</label><input style={inp} value={f.addr2} onChange={e => set("addr2", e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><label style={lab}>Lived here since</label><input style={inp} placeholder="mm/yyyy" value={f.since} onChange={e => set("since", e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={lab}>Email</label><input style={inp} value={f.email} onChange={e => set("email", e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><label style={lab}>Daytime phone</label><input style={inp} value={f.dayPhone} onChange={e => set("dayPhone", e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={lab}>Evening phone</label><input style={inp} value={f.evePhone} onChange={e => set("evePhone", e.target.value)} /></div>
        </div>

        <div style={{ height: 1, background: "#f1f5f9", margin: "8px 0 12px" }} />
        <label style={lab}>(11) Did you authorize anyone to use your information?</label>
        {seg({ get: f.d11, set: v => set("d11", v) }, [["did", "I did"], ["didnot", "I did not"]])}
        <label style={lab}>(12) Did you receive money/goods/services from it?</label>
        {seg({ get: f.d12, set: v => set("d12", v) }, [["did", "I did"], ["didnot", "I did not"]])}
        <label style={lab}>(13) Willing to work with law enforcement?</label>
        {seg({ get: f.d13, set: v => set("d13", v) }, [["am", "I am"], ["amnot", "I am not"]])}

        <div style={{ height: 1, background: "#f1f5f9", margin: "8px 0 12px" }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>The accounts/inquiries you say are fraud</div>
        {accts.map((a, i) => (
          <div key={i} style={{ border: "1px solid #f1f5f9", borderRadius: 10, padding: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED" }}>Item {i + 1}</span>
              {accts.length > 1 && <button type="button" onClick={() => removeAcct(i)} style={{ background: "none", border: "none", color: "#cbd5e1", fontSize: 14, cursor: "pointer" }}>✕</button>}
            </div>
            <input style={inp} placeholder="Company / institution name" value={a.institution} onChange={e => setAcct(i, "institution", e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inp, flex: 1 }} placeholder="Account number (if known)" value={a.accountNumber} onChange={e => setAcct(i, "accountNumber", e.target.value)} />
              <input style={{ ...inp, flex: 1 }} placeholder="Contact / phone" value={a.phone} onChange={e => setAcct(i, "phone", e.target.value)} />
            </div>
            {seg({ get: a.type, set: v => setAcct(i, "type", v) }, [["credit", "Credit"], ["bank", "Bank"], ["phoneutil", "Phone/Util"], ["loan", "Loan"], ["other", "Other"]])}
            {seg({ get: a.status, set: v => setAcct(i, "status", v) }, [["opened", "Opened fraudulently"], ["tampered", "Existing acct tampered"]])}
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inp, flex: 1 }} placeholder="Date opened mm/yyyy" value={a.dateOpened} onChange={e => setAcct(i, "dateOpened", e.target.value)} />
              <input style={{ ...inp, flex: 1 }} placeholder="Date discovered mm/yyyy" value={a.dateDiscovered} onChange={e => setAcct(i, "dateDiscovered", e.target.value)} />
            </div>
            <input style={inp} placeholder="Total amount obtained ($)" value={a.amount} onChange={e => setAcct(i, "amount", e.target.value)} />
          </div>
        ))}
        {accts.length < 3 && <button type="button" onClick={addAcct} style={{ background: "none", border: "1.5px dashed #c4b5fd", color: "#7C3AED", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>+ Add another item</button>}

        <button type="button" onClick={() => onDone({ ...f, accounts: accts })} style={{ width: "100%", height: 44, borderRadius: 12, background: "linear-gradient(135deg,#7C3AED,#a855f7)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>Save my affidavit answers</button>
        <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>You will print, sign, and notarize the form yourself. Signature and notary are left blank.</div>
      </div>
    );
  }


  const personalInfoPreview = pkg && pkg.personalInfoNeeded ? buildPersonalInfoText("equifax") : "";
  const copyTextForTab = (key) => key === "personalInfo" ? personalInfoPreview : (pkg?.[key] || "");

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
        .sheet { background: #fff; border-radius: 20px 20px 0 0; width: 100%; max-height: 86vh; overflow-y: auto; padding: 0 0 8px; }
        .sheet-handle { width: 36px; height: 4px; background: #e2e8f0; border-radius: 2px; margin: 12px auto 20px; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: "#0f172a", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 0" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "-.3px" }}>Credit Counsel Elite</div>
            <div style={{ color: "#64748b", fontSize: 10, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 1 }}>AI Dispute Agent</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={resetSession} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "#94a3b8", fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>Reset</button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: ready ? (approved ? "rgba(16,185,129,.15)" : "rgba(234,179,8,.12)") : "rgba(255,255,255,.06)", border: `1px solid ${ready ? (approved ? "rgba(52,211,153,.25)" : "rgba(234,179,8,.3)") : "rgba(255,255,255,.1)"}` }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: ready ? (approved ? "#34d399" : "#fbbf24") : "#64748b", flexShrink: 0, ...(busy ? { animation: "pulse 1.2s ease infinite" } : {}) }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: ready ? (approved ? "#34d399" : "#fbbf24") : "#94a3b8", letterSpacing: ".2px" }}>
                {ready ? (approved ? "Approved" : "Pending review") : busy ? "Processing…" : "Intake in progress"}
              </span>
            </div>
          </div>
        </div>

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
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.map((m, i) => (
                m.from === "ftc_upload" ? (
                  <div key={i} className="msg" style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>⚖️</div>
                    <FtcUploadCard onUpload={completeFtcUpload} />
                  </div>
                ) : m.from === "affidavit_form" ? (
                  <div key={i} className="msg" style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>⚖️</div>
                    <AffidavitChatForm onDone={completeAffidavit} />
                  </div>
                ) : (
                <div key={i} className="msg" style={m.from === "user" ? { display: "flex", justifyContent: "flex-end" } : { display: "flex", alignItems: "flex-end", gap: 10 }}>
                  {m.from === "agent" && (
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>⚖️</div>
                  )}
                  <div style={m.from === "agent"
                    ? { maxWidth: "80%", background: "#fff", border: "1px solid #f1f5f9", borderRadius: "4px 16px 16px 16px", padding: "12px 16px", fontSize: 14, lineHeight: 1.7, color: "#1e293b", whiteSpace: "pre-wrap", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }
                    : { maxWidth: "78%", background: "#1e3a8a", borderRadius: "16px 16px 4px 16px", padding: "12px 16px", fontSize: 14, lineHeight: 1.65, color: "#fff", whiteSpace: "pre-wrap" }
                  }>{m.text}</div>
                </div>
                )
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
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>Drop them all at once or one at a time — credit report, ID, SSN card, proof of address. The agent reads everything automatically.</div>
                </div>
                {uploads.length > 0 && <div style={{ background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>{uploads.length} uploaded</div>}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <button onClick={openAffidavitInChat} style={{ flex: 1, minWidth: 140, padding: "9px 12px", background: affidavitData?.completed ? "#f0fdf4" : "#faf5ff", border: `1.5px solid ${affidavitData?.completed ? "#bbf7d0" : "#e9d5ff"}`, color: affidavitData?.completed ? "#16a34a" : "#7C3AED", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {affidavitData?.completed ? "✓ Affidavit filled — edit" : "Identity theft? Fill the affidavit"}
                </button>
                <button onClick={openFtcInChat} style={{ flex: 1, minWidth: 140, padding: "9px 12px", background: slots.ftcReport ? "#f0fdf4" : "#f8faff", border: `1.5px solid ${slots.ftcReport ? "#bbf7d0" : "#e2e8f0"}`, color: slots.ftcReport ? "#16a34a" : "#1e3a8a", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {slots.ftcReport ? "✓ FTC report attached" : "Add FTC report"}
                </button>
              </div>
            </div>

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
                <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.65, maxWidth: 260 }}>Complete the intake, then generate your full 3-bureau package here.</div>
                <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
                  <button onClick={() => setTab(0)} style={{ padding: "11px 22px", background: "#f8faff", color: "#1e3a8a", border: "1.5px solid #e2e8f0", borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Go to Intake</button>
                  <button onClick={generatePackages} disabled={busy} style={{ padding: "11px 22px", background: busy ? "#94a3b8" : "#1e3a8a", color: "#fff", border: "none", borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit" }}>{busy ? "Generating…" : "Generate packages"}</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "0 16px", overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 }}>
                  {docTabs.map(t => (
                    <button key={t.key} onClick={() => setDocTab(t.key)} className="tab-btn" style={{ background: "none", border: "none", borderBottom: docTab === t.key ? `2px solid ${t.color}` : "2px solid transparent", padding: "12px 12px 10px", fontSize: 12, fontWeight: docTab === t.key ? 700 : 500, color: docTab === t.key ? t.color : "#94a3b8", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                      {t.label}
                    </button>
                  ))}
                </div>

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
                            <div style={{ fontSize: 11, color: slots[s.key] ? "#0f766e" : "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{slots[s.key]?.name || (s.key === "affidavit" ? "Blank form added automatically unless you upload one" : "Not uploaded")}</div>
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
                  ) : docTab === "affidavit" ? (
                    <div style={{ padding: "20px 18px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Identity Theft Affidavit (official FTC form)</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, lineHeight: 1.6 }}>This is the official FTC Identity Theft Victim's Complaint and Affidavit. It is optional and only for genuine identity theft victims. Download it, fill it out yourself, and have it notarized. The app does not fill it in for you. The blank form is included in every packet automatically; if you upload your completed copy, that is used instead.</div>
                      <div style={{ background: slots.affidavit ? "#f0fdf4" : "#f8faff", border: `1px solid ${slots.affidavit ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: slots.affidavit ? "#16a34a" : "#64748b", marginBottom: 8 }}>
                          {slots.affidavit ? `Your completed affidavit is attached: ${slots.affidavit.name}` : "Blank official form will be included"}
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={downloadBlankAffidavit} style={{ padding: "10px 16px", background: "#7C3AED", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            Download blank FTC affidavit
                          </button>
                          <label style={{ padding: "10px 16px", background: "#fff", color: "#7C3AED", border: "1.5px solid #e9d5ff", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            {slots.affidavit ? "Replace completed copy" : "Upload completed copy"}
                            <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={e => { setSlotFile("affidavit", e.target.files[0]); e.target.value = ""; }} />
                          </label>
                        </div>
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
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#1e3a8a", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>Bureau Phone Numbers</div>
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
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, lineHeight: 1.6 }}>Copy this letter word for word on plain white paper using blue or black pen. Handwriting it shows the bureau this is a personal request, not a printed template.</div>
                      <div style={{ background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>Important Instructions</div>
                        <div style={{ fontSize: 12, color: "#6b21a8", lineHeight: 1.65 }}>{pkg?.handwrittenNote || "Write this letter by hand. Do not type or print it. Use plain white paper and blue or black ink."}</div>
                      </div>
                      <pre style={{ fontSize: 12, lineHeight: 2, color: "#374151", whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", margin: 0, background: "#fffbeb", padding: 16, borderRadius: 10, border: "1px solid #fde68a" }}>{pkg?.equifax || ""}</pre>
                      <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Note: Write a separate letter for each bureau. The items differ per bureau based on what appears there.</div>
                    </div>
                  ) : docTab === "personalInfo" ? (
                    <div style={{ padding: "20px 18px" }}>
                      {pkg?.personalInfoNeeded ? (
                        <pre style={{ fontSize: 12, lineHeight: 1.95, color: "#374151", whiteSpace: "pre-wrap", fontFamily: "Georgia,serif", margin: 0 }}>{personalInfoPreview}</pre>
                      ) : (
                        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>No personal information correction letter is needed — your personal info on the report is already correct. (This preview shows the Equifax version; each bureau's packet uses its own name and address.)</div>
                      )}
                    </div>
                  ) : (
                    <pre style={{ fontSize: 12, lineHeight: 1.95, color: "#374151", whiteSpace: "pre-wrap", fontFamily: "Georgia,serif", padding: "20px 18px", margin: 0 }}>{pkg[docTab] || ""}</pre>
                  )}
                </div>

                <div style={{ padding: "12px 16px 16px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {TEXT_TABS.includes(docTab) && (
                      <button onClick={() => copyText(copyTextForTab(docTab), docTab)} className="action-btn" style={{ flex: 1, height: 42, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#fff", border: "1.5px solid #e2e8f0", color: "#374151" }}>
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

            {/* Affidavit fill-in form */}
            {/* Affidavit is the official FTC form (download/upload in the Affidavit tab) */}

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
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>Disputed Items (Section 611 accuracy)</div>
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

                    <div style={{ display: "flex", gap: 8, paddingBottom: 24 }}>
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
                      {f.name.toLowerCase().includes("credit") || f.name.toLowerCase().includes("report") ? "📊" : f.name.endsWith(".pdf") ? "📄" : "🪪"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{f.size ? Math.round(f.size / 1024) + " KB" : ""}</div>
                    </div>
                    <div style={{ fontSize: 14, color: "#34d399" }}>✓</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f8faff" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Next Steps</span>
                </div>
                {[
                  { done: uploads.length > 0, icon: "📎", label: "Upload your documents",      sub: "Credit report, ID, SSN card, utility bill",   action: () => { setTab(0); setTimeout(() => fileRef.current?.click(), 300); }, btn: "Upload" },
                  { done: ready,              icon: "📋", label: "Package generated",           sub: "AI built your 3-bureau letters",              action: () => setTab(1), btn: "Review" },
                  { done: !!slots.affidavit, icon: "📝", label: "Affidavit (only if a victim)", sub: "Official FTC form — fill it out yourself", action: () => { setTab(1); setDocTab("affidavit"); }, btn: ready ? "Open" : null },
                  { done: approved,           icon: "⚡", label: "Brandon reviews your case",   sub: "Usually within 24 hours",                     action: null, btn: null },
                  { done: false,              icon: "📬", label: "Print & mail your letters",   sub: "Send via USPS Certified Mail",                action: () => setTab(1), btn: approved ? "Print" : null },
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

// ============================================================
// BRANDON ADMIN DASHBOARD  (hidden — shown only at /admin)
// ============================================================
function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [docs, setDocs] = useState([]);
  const [letterTab, setLetterTab] = useState("equifax");
  const [notes, setNotes] = useState("");
  const [requests, setRequests] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  const NAVY = "#0f172a", BLUE = "#1e3a8a", GOLD = "#b58a2e";

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data?.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => { if (session) loadClients(); }, [session]);

  async function loadClients() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("clients").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (e) { console.error("loadClients", e.message); }
    setLoading(false);
  }

  async function openClient(c) {
    setActive(c); setPkg(null); setDocs([]); setLetterTab("equifax");
    setNotes(c.brandon_notes || ""); setRequests(c.brandon_requests || ""); setSaveMsg("");
    try {
      const { data: pkgs } = await supabase.from("packages").select("*").eq("client_id", c.id).order("created_at", { ascending: false }).limit(1);
      setPkg(pkgs && pkgs[0] ? pkgs[0] : null);
      const { data: d } = await supabase.from("documents").select("*").eq("client_id", c.id).order("created_at", { ascending: true });
      setDocs(d || []);
    } catch (e) { console.error("openClient", e.message); }
  }

  async function viewDoc(doc) {
    try {
      if (doc.storage_path) {
        const { data, error } = await supabase.storage.from("client-documents").createSignedUrl(doc.storage_path, 3600);
        if (error) throw error;
        window.open(data.signedUrl, "_blank");
      } else if (doc.file_url) {
        window.open(doc.file_url, "_blank");
      }
    } catch (e) { alert("Could not open file: " + e.message); }
  }

  async function saveReview(newStatus) {
    if (!active) return;
    setSaveMsg("Saving…");
    try {
      const patch = { brandon_notes: notes, brandon_requests: requests };
      if (newStatus) patch.status = newStatus;
      const { error } = await supabase.from("clients").update(patch).eq("id", active.id);
      if (error) throw error;
      setSaveMsg("Saved");
      setActive({ ...active, ...patch });
      loadClients();
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (e) { setSaveMsg("Error: " + e.message); }
  }

  async function signIn() {
    setAuthErr(""); setAuthBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (e) { setAuthErr(e.message || "Sign in failed"); }
    setAuthBusy(false);
  }

  const wrap = { minHeight: "100vh", background: "#f1f5f9", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", color: NAVY };

  if (!supabase) {
    return <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", color: "#64748b" }}>Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.</div>
    </div>;
  }

  if (!session) {
    return <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380, background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 10px 40px rgba(0,0,0,.08)" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: NAVY }}>Credit Counsel Elite</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: GOLD, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 22 }}>Admin Dashboard</div>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" autoComplete="username" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, marginBottom: 10, fontFamily: "inherit" }} />
        <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && signIn()} type="password" placeholder="Password" autoComplete="current-password" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, marginBottom: 14, fontFamily: "inherit" }} />
        {authErr && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>{authErr}</div>}
        <button onClick={signIn} disabled={authBusy} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: authBusy ? "#94a3b8" : BLUE, color: "#fff", fontSize: 14, fontWeight: 700, cursor: authBusy ? "not-allowed" : "pointer", fontFamily: "inherit" }}>{authBusy ? "Signing in…" : "Sign in"}</button>
      </div>
    </div>;
  }

  const statusColor = (s) => s === "approved" ? "#16a34a" : s === "changes_requested" ? "#d97706" : "#64748b";
  const letters = [["equifax", "Equifax"], ["experian", "Experian"], ["transunion", "TransUnion"], ["personal_info", "Personal Info"]];

  return <div style={wrap}>
    <div style={{ background: NAVY, padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>Credit Counsel Elite</span>
        <span style={{ color: GOLD, fontWeight: 700, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", marginLeft: 10 }}>Admin</span>
      </div>
      <button onClick={() => supabase.auth.signOut()} style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", color: "#cbd5e1", fontSize: 12, fontWeight: 600, borderRadius: 18, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}>Sign out</button>
    </div>

    <div style={{ display: "flex", gap: 16, padding: 16, alignItems: "flex-start", maxWidth: 1200, margin: "0 auto", flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 300px", minWidth: 280, background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Clients</span>
          <button onClick={loadClients} style={{ background: "none", border: "none", color: BLUE, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Refresh</button>
        </div>
        {loading ? <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>Loading…</div>
          : clients.length === 0 ? <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>No clients yet.</div>
          : clients.map(c => (
            <div key={c.id} onClick={() => openClient(c)} style={{ padding: "12px 16px", borderBottom: "1px solid #f8fafc", cursor: "pointer", background: active?.id === c.id ? "#f8faff" : "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name || "Unnamed client"}</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: statusColor(c.status), background: statusColor(c.status) + "1a", padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>{(c.status || "intake").replace("_", " ")}</span>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{c.address || "—"}</div>
            </div>
          ))}
      </div>

      <div style={{ flex: "2 1 520px", minWidth: 320 }}>
        {!active ? <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>Select a client to review their package.</div>
          : <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{active.name || "Unnamed client"}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{active.address || "—"}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>DOB {active.dob || "—"} · SSN ***-**-{active.ssn4 || "—"}</div>

            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Documents ({docs.length})</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {docs.length === 0 ? <span style={{ fontSize: 12, color: "#94a3b8" }}>None uploaded.</span>
                : docs.map(d => <button key={d.id} onClick={() => viewDoc(d)} style={{ fontSize: 12, fontWeight: 600, color: BLUE, background: "#f8faff", border: "1px solid #dbeafe", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontFamily: "inherit" }}>{d.file_name}</button>)}
            </div>

            {pkg ? <>
              <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #f1f5f9", marginBottom: 12, flexWrap: "wrap" }}>
                {letters.map(([k, label]) => (pkg[k] ? <button key={k} onClick={() => setLetterTab(k)} style={{ background: "none", border: "none", borderBottom: letterTab === k ? `2px solid ${BLUE}` : "2px solid transparent", padding: "8px 10px", fontSize: 12, fontWeight: letterTab === k ? 700 : 500, color: letterTab === k ? BLUE : "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}>{label}</button> : null))}
              </div>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12.5, lineHeight: 1.7, fontFamily: "Georgia,serif", color: "#111", background: "#fafafa", border: "1px solid #f1f5f9", borderRadius: 10, padding: 16, maxHeight: 360, overflow: "auto", margin: 0 }}>{pkg[letterTab] || "—"}</pre>
            </> : <div style={{ fontSize: 13, color: "#94a3b8", padding: "8px 0 16px" }}>No package generated yet for this client.</div>}

            <div style={{ marginTop: 18, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Review</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Private notes" style={{ width: "100%", boxSizing: "border-box", minHeight: 56, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", marginBottom: 10, resize: "vertical" }} />
              <textarea value={requests} onChange={e => setRequests(e.target.value)} placeholder="Changes to request from the client" style={{ width: "100%", boxSizing: "border-box", minHeight: 56, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", marginBottom: 12, resize: "vertical" }} />
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={() => saveReview("approved")} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Approve</button>
                <button onClick={() => saveReview("changes_requested")} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#d97706", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Request changes</button>
                <button onClick={() => saveReview(null)} style={{ padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save notes</button>
                {saveMsg && <span style={{ fontSize: 12, color: saveMsg.startsWith("Error") ? "#dc2626" : "#16a34a", fontWeight: 600 }}>{saveMsg}</span>}
              </div>
            </div>
          </div>}
      </div>
    </div>
  </div>;
}

// Route: /admin shows Brandon's dashboard; everything else is the client agent.
export default function Root() {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  if (path.replace(/\/$/, "").endsWith("/admin")) return <AdminDashboard />;
  return <ClientApp />;
}
