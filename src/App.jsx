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
// In-progress affidavit answers live in their own small key. Keeping them out of the main
// snapshot means a draft can be written on a fast debounce without re-serialising the
// uploaded documents, and a quota failure on one can never take the other down.
const AFFIDAVIT_DRAFT_KEY = "cce_affidavit_draft_v1";

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

CORRECT NAME — CONFIRM IT:
The name on the credit report is not always the name the client wants used (for example, after marriage or a name change the report may still show an old last name). Whenever the report's name differs from the ID, OR whenever a personal-information correction is being made, you must ask the client to confirm the exact correct legal name to use going forward — for example: "Your report shows [name on report], but I want to use your correct legal name on everything. What is the exact full name you want used?" Use the name the client gives you on ALL letters and on the affidavit. The personal-information correction letter states only the correct name (the one to update to) — do not write an old-name-to-new-name format, just the correct name. Store the confirmed name as clientName in your state and never revert to the report's version.

DOCUMENT PREP RULES:
- Photo ID: show the photo and all four corners, legible, no glare/dark spots — bureaus reject cropped corners.
- Social Security card: show all four corners AND the signature on the front. Both the corners and the signature must be visible.
- Proof of address: no signature is needed. It must clearly show the client's name, current address, and the date. A utility bill or bank statement works.
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
HOW TO GUIDE THE FORM (do this when you show AFFIDAVIT_STEP): explain how to complete it, not what to claim. Tell them: enter your legal name, date of birth, SSN, driver's license, and current address; answer whether your name, address or phone has changed since the fraud, and if it has, enter what they were then; for the three declarations, check only what is true for you; the form asks whether you know who used your information — answer no and skip it if you don't, and enter only what you actually know if you do; the description of how the theft happened should match the personal statement in your own FTC report; in the accounts section, list ONLY the specific items you personally know were opened or used without your authorization — in your own words; then print, sign, and have it notarized. You may explain what each field means. You must NOT tell the client which accounts to list, must NOT suggest that any identified negative is fraud, and must NOT characterize items as identity theft on their behalf. The choice of which items to include is entirely theirs.
Output each token at most once. If the client says none were identity theft (only inaccurate or not theirs), do NOT output the tokens — proceed to build and dispute on accuracy grounds under Section 611.

THE FTC REPORT:
The FTC Identity Theft Report is filed by the client themselves at IdentityTheft.gov, and only by clients who are genuinely identity theft victims. You may tell a client where to file it, but you do NOT script statements claiming specific accounts are fraud and you do NOT tell the client what to declare. That is the client's own statement to make.

═══════════════════════════════════════════
DOCUMENTS TO COLLECT
═══════════════════════════════════════════
1. Credit report (MyFreeScoreNow) — to identify items.
2. Government photo ID — show the photo and all four corners, no glare.
3. Social Security card — all four corners AND the signature on the front.
4. Proof of current address — utility bill or bank statement showing your name, current address, and the date. No signature needed.
5. (Optional) Identity Theft Affidavit — only if the client is a genuine victim and completes the app's affidavit step; never required, never blocked on.

TWO WAYS THE CLIENT CAN UPLOAD — support BOTH:
- ALL AT ONCE: The client may drop every document and image together in one go. When several arrive in the same turn, read and extract from EVERY one of them that turn, tell the client everything you found across all of them (identity info, negative items, inquiries, personal-info issues), record each in "documentsReceived", and then ask only for whatever is still missing. Do not make them re-send one at a time.
- ONE AT A TIME: If the client uploads a single document, seems unsure, or asks for help, guide them through the list above in order, one item per turn, explaining each — the step-by-step experience is preserved for anyone who needs it.
Record each document in "documentsReceived" and never ask twice. Only ask for what is still missing. The FCRA 605B page is added automatically — do not ask for it.
MULTIPLE DOCUMENTS ON ONE FILE: A single uploaded file or image often contains more than one document — for example a photo ID and Social Security card on the same page, or an ID plus a utility bill. Look at the whole image. If you can see the Social Security card, the ID, and/or the proof of address anywhere in an uploaded file, record EACH of them in "documentsReceived" as received. NEVER ask the client to re-upload or "send separately" a document that is already visible in something they uploaded, even if it shares the page with other documents. If a required document is genuinely not visible in anything uploaded, ask only for that one.

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════
When you have the client name, address, DOB, SSN last-4, and the items the client chose to dispute, output the PACKAGE_READY block. The block is the ONLY thing that builds the PDFs. NEVER tell the client the packages are "ready" or "in the Package tab" unless THIS SAME REPLY contains the PACKAGE_READY block. Output the block itself — do not describe or promise it.

Output EXACTLY this (your short reply text may precede it if a question remains). The three bureau letters MUST be the COVER LETTER template reproduced word for word — only the bureau name/address, the client's info, and the numbered item lines change:

PACKAGE_READY:
{"clientName":"[full name]","clientAddress":"[full address]","dob":"[dob]","ssn4":"[last 4]","equifax":"[the Section 611 COVER LETTER reproduced verbatim, addressed to Equifax, items as numbered lines]","experian":"[same letter, addressed to Experian]","transunion":"[same letter, addressed to TransUnion]","personalInfoNeeded":true_or_false,"handwrittenNote":"Copy this letter by hand word for word on plain white paper in blue or black ink. Handwriting it shows the bureau this is a personal request, not a printed template. Do not type it.","disputeItems":{"equifax":["CREDITOR — TYPE — date"],"experian":["..."],"transunion":["..."]},"checklist":["MyFreeScoreNow credit report — relevant pages, highlighted in yellow or blue, NO pink","Government photo ID — show the photo and all four corners, no dark spots","Social Security card — all four corners AND the signature on the front","Proof of current address — utility bill or bank statement showing name, address, and date (no signature needed)","Identity Theft Affidavit — ONLY if you are a genuine identity theft victim and completed it yourself; notarized","FCRA 605B page (added automatically)"],"packetOrder":"1. Cover Letter (handwritten) → 2. Personal Info Letter (if needed) → 3. ID Page → 4. Credit Report Pages → 5. Affidavit (only if you completed it) → 6. FCRA 605B","brandonsNotes":"[2-3 sentences for Brandon: anything unusual or worth double-checking]"}

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
const FTC_AFFIDAVIT_B64 = "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IGcKODQuIDY4OC4gVGQKKGFjY2VzcyB0byB5b3VyIGluZm9ybWF0aW9uIG9yIHdoaWNoIGRvY3VtZW50cyBvciBpbmZvcm1hdGlvbiB3ZXJlIHVzZWRcKTopIFRqCkVUCjAuIEcKMC42IHcKNTQuIDY0Mi4gbQo0NzUuIDY0Mi4gbApTCjAuIEcKMC42IHcKNTQuIDYyNC4gbQo0NzUuIDYyNC4gbApTCjAuIEcKMC42IHcKNTQuIDYwNi4gbQo0NzUuIDYwNi4gbApTCjAuIEcKMC42IHcKNTQuIDU4OC4gbQo0NzUuIDU4OC4gbApTCjAuIEcKMC42IHcKNTQuIDU3MC4gbQo0NzUuIDU3MC4gbApTCjAuIEcKMC42IHcKNTQuIDU1Mi4gbQo0NzUuIDU1Mi4gbApTCjAuODUgZwo0ODIuIDcxNC4gOTYuIC01NS4gcmUKZgpCVAovRjEgNy4yIFRmCjguMjc5OTk5OTk5OTk5OTk5NCBUTAowLiBnCjQ4Ni4gNzAzLiBUZAooXCgxNFwpIGFuZCBcKDE1XCk6KSBUagpFVApCVAovRjEgNy4yIFRmCjguMjc5OTk5OTk5OTk5OTk5NCBUTAowLiBnCjQ4Ni4gNjk0LiBUZAooQXR0YWNoKSBUagpFVApCVAovRjEgNy4yIFRmCjguMjc5OTk5OTk5OTk5OTk5NCBUTAowLiBnCjQ4Ni4gNjg1LiBUZAooYWRkaXRpb25hbCkgVGoKRVQKQlQKL0YxIDcuMiBUZgo4LjI3OTk5OTk5OTk5OTk5OTQgVEwKMC4gZwo0ODYuIDY3Ni4gVGQKKHNoZWV0cyBhcykgVGoKRVQKQlQKL0YxIDcuMiBUZgo4LjI3OTk5OTk5OTk5OTk5OTQgVEwKMC4gZwo0ODYuIDY2Ny4gVGQKKG5lZWRlZC4pIFRqCkVUCjAuIGcKNTQuIDUzMC4gNDIxLiAtMTguIHJlCmYKQlQKL0YyIDEyIFRmCjEzLjc5OTk5OTk5OTk5OTk5ODkgVEwKMS4gZwo2MC4gNTE3LiBUZAooRG9jdW1lbnRhdGlvbikgVGoKRVQKQlQKL0Y5IDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMC4gZwo1NC4gNTAwLiBUZAooXCgxNlwpKSBUagpFVApCVAovRjkgMTEgVGYKMTIuNjQ5OTk5OTk5OTk5OTk4NiBUTAowLiBnCjg0LiA1MDAuIFRkCihJIGNhbiB2ZXJpZnkgbXkgaWRlbnRpdHkgd2l0aCB0aGVzZSBkb2N1bWVudHM6KSBUagpFVAowLiBHCjAuOCB3Cjg0LiA0ODcuIDguIC04LiByZQpTCkJUCi9GOSAxMSBUZgoxMi42NDk5OTk5OTk5OTk5OTg2IFRMCjAuIGcKMTAyLiA0ODAuIFRkCihBIHZhbGlkIGdvdmVybm1lbnQtaXNzdWVkIHBob3RvIGlkZW50aWZpY2F0aW9uIGNhcmQgXChmb3IgZXhhbXBsZSwgbXkgZHJpdmVyJ3MpIFRqCkVUCkJUCi9GOSAxMSBUZgoxMi42NDk5OTk5OTk5OTk5OTg2IFRMCjAuIGcKMTAyLiA0NjcuIFRkCihsaWNlbnNlLCBzdGF0ZS1pc3N1ZWQgSUQgY2FyZCwgb3IgbXkgcGFzc3BvcnRcKS4pIFRqCkVUCkJUCi9GMTEgOS41IFRmCjEwLjkyNDk5OTk5OTk5OTk5ODkgVEwKMC4gZwoxMDIuIDQ1Mi4gVGQKKElmIHlvdSBhcmUgdW5kZXIgMTYgYW5kIGRvbid0IGhhdmUgYSBwaG90by1JRCwgYSBjb3B5IG9mIHlvdXIgYmlydGggY2VydGlmaWNhdGUgb3IgYSBjb3B5IG9mKSBUagpUKiAoeW91ciBvZmZpY2lhbCBzY2hvb2wgcmVjb3JkIHNob3dpbmcgeW91ciBlbnJvbGxtZW50IGFuZCBsZWdhbCBhZGRyZXNzIGlzIGFjY2VwdGFibGUuKSBUagpFVAowLiBHCjAuOCB3Cjg0LiA0MTQuIDguIC04LiByZQpTCkJUCi9GOSAxMSBUZgoxMi42NDk5OTk5OTk5OTk5OTg2IFRMCjAuIGcKMTAyLiA0MDcuIFRkCihQcm9vZiBvZiByZXNpZGVuY3kgZHVyaW5nIHRoZSB0aW1lIHRoZSBkaXNwdXRlZCBjaGFyZ2VzIG9jY3VycmVkLCB0aGUgbG9hbiB3YXMpIFRqCkVUCkJUCi9GOSAxMSBUZgoxMi42NDk5OTk5OTk5OTk5OTg2IFRMCjAuIGcKMTAyLiAzOTQuIFRkCihtYWRlLCBvciB0aGUgb3RoZXIgZXZlbnQgdG9vayBwbGFjZSBcKGZvciBleGFtcGxlLCBhIGNvcHkgb2YgYSByZW50YWwvbGVhc2UpIFRqCkVUCkJUCi9GOSAxMSBUZgoxMi42NDk5OTk5OTk5OTk5OTg2IFRMCjAuIGcKMTAyLiAzODEuIFRkCihhZ3JlZW1lbnQgaW4gbXkgbmFtZSwgYSB1dGlsaXR5IGJpbGwsIG9yIGFuIGluc3VyYW5jZSBiaWxsXCkuKSBUagpFVAowLjg1IGcKNDgyLiA1MDAuIDk2LiAtMTAwLiByZQpmCkJUCi9GMSA3LjIgVGYKOC4yNzk5OTk5OTk5OTk5OTk0IFRMCjAuIGcKNDg2LiA0ODkuIFRkCihcKDE2XCk6IFJlbWluZGVyOikgVGoKRVQKQlQKL0YxIDcuMiBUZgo4LjI3OTk5OTk5OTk5OTk5OTQgVEwKMC4gZwo0ODYuIDQ4MC4gVGQKKEF0dGFjaCBjb3BpZXMpIFRqCkVUCkJUCi9GMSA3LjIgVGYKOC4yNzk5OTk5OTk5OTk5OTk0IFRMCjAuIGcKNDg2LiA0NzEuIFRkCihvZiB5b3VyIGlkZW50aXR5KSBUagpFVApCVAovRjEgNy4yIFRmCjguMjc5OTk5OTk5OTk5OTk5NCBUTAowLiBnCjQ4Ni4gNDYyLiBUZAooZG9jdW1lbnRzKSBUagpFVApCVAovRjEgNy4yIFRmCjguMjc5OTk5OTk5OTk5OTk5NCBUTAowLiBnCjQ4Ni4gNDUzLiBUZAood2hlbiBzZW5kaW5nKSBUagpFVApCVAovRjEgNy4yIFRmCjguMjc5OTk5OTk5OTk5OTk5NCBUTAowLiBnCjQ4Ni4gNDQ0LiBUZAoodGhpcyBmb3JtIHRvKSBUagpFVApCVAovRjEgNy4yIFRmCjguMjc5OTk5OTk5OTk5OTk5NCBUTAowLiBnCjQ4Ni4gNDM1LiBUZAooY3JlZGl0b3JzKSBUagpFVApCVAovRjEgNy4yIFRmCjguMjc5OTk5OTk5OTk5OTk5NCBUTAowLiBnCjQ4Ni4gNDI2LiBUZAooYW5kIGNyZWRpdCkgVGoKRVQKQlQKL0YxIDcuMiBUZgo4LjI3OTk5OTk5OTk5OTk5OTQgVEwKMC4gZwo0ODYuIDQxNy4gVGQKKHJlcG9ydGluZykgVGoKRVQKQlQKL0YxIDcuMiBUZgo4LjI3OTk5OTk5OTk5OTk5OTQgVEwKMC4gZwo0ODYuIDQwOC4gVGQKKGFnZW5jaWVzLikgVGoKRVQKMC4gZwo1NC4gMzYyLiA0MjEuIC0xOC4gcmUKZgpCVAovRjIgMTIgVGYKMTMuNzk5OTk5OTk5OTk5OTk4OSBUTAoxLiBnCjYwLiAzNDkuIFRkCihBYm91dCB0aGUgSW5mb3JtYXRpb24gb3IgQWNjb3VudHMpIFRqCkVUCkJUCi9GOSAxMSBUZgoxMi42NDk5OTk5OTk5OTk5OTg2IFRMCjAuIGcKNTQuIDMzMi4gVGQKKFwoMTdcKSkgVGoKRVQKQlQKL0Y5IDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMC4gZwo4NC4gMzMyLiBUZAooVGhlIGZvbGxvd2luZyBwZXJzb25hbCBpbmZvcm1hdGlvbiBcKGxpa2UgbXkgbmFtZSwgYWRkcmVzcywgU29jaWFsIFNlY3VyaXR5IG51bWJlciwgb3IpIFRqCkVUCkJUCi9GOSAxMSBUZgoxMi42NDk5OTk5OTk5OTk5OTg2IFRMCjAuIGcKODQuIDMxOS4gVGQKKGRhdGUgb2YgYmlydGhcKSBpbiBteSBjcmVkaXQgcmVwb3J0IGlzIGluYWNjdXJhdGUgYXMgYSByZXN1bHQgb2YgdGhpcyBpZGVudGl0eSB0aGVmdDopIFRqCkVUCkJUCi9GOSAxMSBUZgoxMi42NDk5OTk5OTk5OTk5OTg2IFRMCjAuIGcKODQuIDI5Mi4gVGQKKFwoQVwpKSBUagpFVAowLiBHCjAuNiB3CjEwNi4gMjkwLiBtCjQ3NS4gMjkwLiBsClMKQlQKL0Y5IDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMC4gZwo4NC4gMjcyLiBUZAooXChCXCkpIFRqCkVUCjAuIEcKMC42IHcKMTA2LiAyNzAuIG0KNDc1LiAyNzAuIGwKUwpCVAovRjkgMTEgVGYKMTIuNjQ5OTk5OTk5OTk5OTk4NiBUTAowLiBnCjg0LiAyNTIuIFRkCihcKENcKSkgVGoKRVQKMC4gRwowLjYgdwoxMDYuIDI1MC4gbQo0NzUuIDI1MC4gbApTCkJUCi9GOSAxMSBUZgoxMi42NDk5OTk5OTk5OTk5OTg2IFRMCjAuIGcKNTQuIDIyNy4gVGQKKFwoMThcKSkgVGoKRVQKQlQKL0Y5IDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMC4gZwo4NC4gMjI3LiBUZAooQ3JlZGl0IGlucXVpcmllcyBmcm9tIHRoZXNlIGNvbXBhbmllcyBhcHBlYXIgb24gbXkgY3JlZGl0IHJlcG9ydCBhcyBhIHJlc3VsdCBvZiB0aGlzKSBUagpFVApCVAovRjkgMTEgVGYKMTIuNjQ5OTk5OTk5OTk5OTk4NiBUTAowLiBnCjg0LiAyMTQuIFRkCihpZGVudGl0eSB0aGVmdDopIFRqCkVUCkJUCi9GOSAxMSBUZgoxMi42NDk5OTk5OTk5OTk5OTg2IFRMCjAuIGcKODQuIDE5Mi4gVGQKKENvbXBhbnkgTmFtZTopIFRqCkVUCjAuIEcKMC42IHcKMTc0LiAxOTAuIG0KNDc1LiAxOTAuIGwKUwpCVAovRjkgMTEgVGYKMTIuNjQ5OTk5OTk5OTk5OTk4NiBUTAowLiBnCjg0LiAxNzIuIFRkCihDb21wYW55IE5hbWU6KSBUagpFVAowLiBHCjAuNiB3CjE3NC4gMTcwLiBtCjQ3NS4gMTcwLiBsClMKQlQKL0Y5IDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMC4gZwo4NC4gMTUyLiBUZAooQ29tcGFueSBOYW1lOikgVGoKRVQKMC4gRwowLjYgdwoxNzQuIDE1MC4gbQo0NzUuIDE1MC4gbApTCkJUCi9GMiA5IFRmCjEwLjM0OTk5OTk5OTk5OTk5OTYgVEwKMC4gZwo0MC4gMjIuIFRkCihILTMpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCjY3IDAgb2JqCjw8Ci9MZW5ndGggNTEzMwo+PgpzdHJlYW0KMC42IHcKMC4gRwpCVAovRjExIDEwIFRmCjExLjUgVEwKMC4gZwo1NC4gNzQ1LiBUZAooVmljdGltJ3MgTmFtZSkgVGoKRVQKMC4gRwowLjYgdwoxMjAuIDc0My4gbQozMDAuIDc0My4gbApTCkJUCi9GMTEgMTAgVGYKMTEuNSBUTAowLiBnCjMxNi4gNzQ1LiBUZAooUGhvbmUgbnVtYmVyIFwoKSBUagpFVAozOTUuIDc0My4gbQo0NzAuIDc0My4gbApTCkJUCi9GMTEgMTAgVGYKMTEuNSBUTAowLiBnCjUwNS4gNzQ1LiBUZAooUGFnZSA1KSBUagpFVAowLiBnCjU0LiA3MjYuIDQyMS4gLTE4LiByZQpmCkJUCi9GMiAxMiBUZgoxMy43OTk5OTk5OTk5OTk5OTg5IFRMCjEuIGcKNjAuIDcxMy4gVGQKKFlvdXIgTGF3IEVuZm9yY2VtZW50IFJlcG9ydCkgVGoKRVQKQlQKL0Y5IDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMC4gZwo1NC4gNjk2LiBUZAooXCgyMFwpKSBUagpFVApCVAovRjkgMTEgVGYKMTIuNjQ5OTk5OTk5OTk5OTk4NiBUTAowLiBnCjg0LiA2OTYuIFRkCihPbmUgd2F5IHRvIGdldCBhIGNyZWRpdCByZXBvcnRpbmcgYWdlbmN5IHRvIHF1aWNrbHkgYmxvY2sgaWRlbnRpdHkgdGhlZnQtcmVsYXRlZCkgVGoKRVQKQlQKL0Y5IDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMC4gZwo4NC4gNjgzLjUgVGQKKGluZm9ybWF0aW9uIGZyb20gYXBwZWFyaW5nIG9uIHlvdXIgY3JlZGl0IHJlcG9ydCBpcyB0byBzdWJtaXQgYSBkZXRhaWxlZCBsYXcgZW5mb3JjZW1lbnQpIFRqCkVUCkJUCi9GOSAxMSBUZgoxMi42NDk5OTk5OTk5OTk5OTg2IFRMCjAuIGcKODQuIDY3MS4gVGQKKHJlcG9ydCBcKCJJZGVudGl0eSBUaGVmdCBSZXBvcnQiXCkuIFlvdSBjYW4gb2J0YWluIGFuIElkZW50aXR5IFRoZWZ0IFJlcG9ydCBieSB0YWtpbmcgdGhpcykgVGoKRVQKQlQKL0Y5IDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMC4gZwo4NC4gNjU4LjUgVGQKKGZvcm0gdG8geW91ciBsb2NhbCBsYXcgZW5mb3JjZW1lbnQgb2ZmaWNlLCBhbG9uZyB3aXRoIHlvdXIgc3VwcG9ydGluZyBkb2N1bWVudGF0aW9uLikgVGoKRVQKQlQKL0Y5IDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMC4gZwo4NC4gNjQ2LiBUZAooQXNrIGFuIG9mZmljZXIgdG8gd2l0bmVzcyB5b3VyIHNpZ25hdHVyZSBhbmQgY29tcGxldGUgdGhlIHJlc3Qgb2YgdGhlIGluZm9ybWF0aW9uIGluIHRoaXMpIFRqCkVUCkJUCi9GOSAxMSBUZgoxMi42NDk5OTk5OTk5OTk5OTg2IFRMCjAuIGcKODQuIDYzMy41IFRkCihzZWN0aW9uLiBJdCdzIGltcG9ydGFudCB0byBnZXQgeW91ciByZXBvcnQgbnVtYmVyLCB3aGV0aGVyIG9yIG5vdCB5b3UgYXJlIGFibGUgdG8gZmlsZSBpbikgVGoKRVQKQlQKL0Y5IDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMC4gZwo4NC4gNjIxLiBUZAoocGVyc29uIG9yIGdldCBhIGNvcHkgb2YgdGhlIG9mZmljaWFsIGxhdyBlbmZvcmNlbWVudCByZXBvcnQuIEF0dGFjaCBhIGNvcHkgb2YgYW55KSBUagpFVApCVAovRjkgMTEgVGYKMTIuNjQ5OTk5OTk5OTk5OTk4NiBUTAowLiBnCjg0LiA2MDguNSBUZAooY29uZmlybWF0aW9uIGxldHRlciBvciBvZmZpY2lhbCBsYXcgZW5mb3JjZW1lbnQgcmVwb3J0IHlvdSByZWNlaXZlIHdoZW4gc2VuZGluZyB0aGlzKSBUagpFVApCVAovRjkgMTEgVGYKMTIuNjQ5OTk5OTk5OTk5OTk4NiBUTAowLiBnCjg0LiA1OTYuIFRkCihmb3JtIHRvIGNyZWRpdCByZXBvcnRpbmcgYWdlbmNpZXMuKSBUagpFVApCVAovRjkgMTEgVGYKMTIuNjQ5OTk5OTk5OTk5OTk4NiBUTAowLiBnCjg0LiA1NjAuIFRkCihTZWxlY3QgT05FOikgVGoKRVQKMC4gRwowLjggdwoxMDIuIDU1Mi4gOC4gLTguIHJlClMKQlQKL0Y5IDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMC4gZwoxMTYuIDU0NC4gVGQKKEkgaGF2ZSBub3QgZmlsZWQgYSBsYXcgZW5mb3JjZW1lbnQgcmVwb3J0LikgVGoKRVQKMC4gRwowLjggdwoxMDIuIDUzNC4gOC4gLTguIHJlClMKQlQKL0Y5IDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMC4gZwoxMTYuIDUyNi4gVGQKKEkgd2FzIHVuYWJsZSB0byBmaWxlIGFueSBsYXcgZW5mb3JjZW1lbnQgcmVwb3J0LikgVGoKRVQKMC4gRwowLjggdwoxMDIuIDUxNi4gOC4gLTguIHJlClMKQlQKL0Y5IDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMC4gZwoxMTYuIDUwOC4gVGQKKEkgZmlsZWQgYW4gYXV0b21hdGVkIHJlcG9ydCB3aXRoIHRoZSBsYXcgZW5mb3JjZW1lbnQgYWdlbmN5IGxpc3RlZCBiZWxvdy4pIFRqCkVUCjAuIEcKMC44IHcKMTAyLiA0ODYuIDguIC04LiByZQpTCkJUCi9GOSAxMSBUZgoxMi42NDk5OTk5OTk5OTk5OTg2IFRMCjAuIGcKMTE2LiA0NzguIFRkCihJIGZpbGVkIG15IHJlcG9ydCBpbiBwZXJzb24gd2l0aCB0aGUgbGF3IGVuZm9yY2VtZW50IG9mZmljZXIgYW5kIGFnZW5jeSBsaXN0ZWQpIFRqCkVUCkJUCi9GOSAxMSBUZgoxMi42NDk5OTk5OTk5OTk5OTg2IFRMCjAuIGcKMTE2LiA0NjYuIFRkCihiZWxvdy4pIFRqCkVUCjAuIEcKMC42IHcKNTQuIDQzMi4gbQo0NzUuIDQzMi4gbApTCkJUCi9GOSA5IFRmCjEwLjM0OTk5OTk5OTk5OTk5OTYgVEwKMC4gZwo1NC4gNDIwLiBUZAooTGF3IEVuZm9yY2VtZW50IERlcGFydG1lbnQpIFRqCkVUCkJUCi9GOSA5IFRmCjEwLjM0OTk5OTk5OTk5OTk5OTYgVEwKMC4gZwozNjAuIDQyMC4gVGQKKFN0YXRlKSBUagpFVAowLiBHCjAuNiB3CjU0LiAzODIuIG0KMjEwLiAzODIuIGwKUwowLiBHCjAuNiB3CjIzMC4gMzgyLiBtCjQwMC4gMzgyLiBsClMKQlQKL0Y5IDkgVGYKMTAuMzQ5OTk5OTk5OTk5OTk5NiBUTAowLiBnCjU0LiAzNzAuIFRkCihSZXBvcnQgTnVtYmVyKSBUagpFVApCVAovRjkgOSBUZgoxMC4zNDk5OTk5OTk5OTk5OTk2IFRMCjAuIGcKMjMwLiAzNzAuIFRkCihGaWxpbmcgRGF0ZSBcKG1tL2RkL3l5eXlcKSkgVGoKRVQKMC4gRwowLjYgdwo1NC4gMzIyLiBtCjQ3NS4gMzIyLiBsClMKQlQKL0Y5IDkgVGYKMTAuMzQ5OTk5OTk5OTk5OTk5NiBUTAowLiBnCjU0LiAzMTAuIFRkCihPZmZpY2VyJ3MgTmFtZSBcKHBsZWFzZSBwcmludFwpKSBUagpFVApCVAovRjkgOSBUZgoxMC4zNDk5OTk5OTk5OTk5OTk2IFRMCjAuIGcKMzAwLiAzMTAuIFRkCihPZmZpY2VyJ3MgU2lnbmF0dXJlKSBUagpFVAowLiBHCjAuNiB3CjU0LiAyNjQuIG0KMjEwLiAyNjQuIGwKUwpCVAovRjkgMTEgVGYKMTIuNjQ5OTk5OTk5OTk5OTk4NiBUTAowLiBnCjMwMC4gMjY0LiBUZAooXCgpIFRqCkVUCjAuIEcKMC42IHcKMzE1LiAyNjQuIG0KNDcwLiAyNjQuIGwKUwpCVAovRjkgOSBUZgoxMC4zNDk5OTk5OTk5OTk5OTk2IFRMCjAuIGcKNTQuIDI1Mi4gVGQKKEJhZGdlIE51bWJlcikgVGoKRVQKQlQKL0Y5IDkgVGYKMTAuMzQ5OTk5OTk5OTk5OTk5NiBUTAowLiBnCjMwMC4gMjUyLiBUZAooUGhvbmUgTnVtYmVyKSBUagpFVApCVAovRjkgMTAuNSBUZgoxMi4wNzQ5OTk5OTk5OTk5OTkzIFRMCjAuIGcKNTQuIDIxMi4gVGQKKERpZCB0aGUgdmljdGltIHJlY2VpdmUgYSBjb3B5IG9mIHRoZSByZXBvcnQgZnJvbSB0aGUgbGF3IGVuZm9yY2VtZW50IG9mZmljZXI/KSBUagpFVAowLiBHCjAuOCB3CjQ1Mi4gMjE5LiA4LiAtOC4gcmUKUwpCVAovRjkgMTAuNSBUZgoxMi4wNzQ5OTk5OTk5OTk5OTkzIFRMCjAuIGcKNDY1LiAyMTIuIFRkCihZZXMpIFRqCkVUCkJUCi9GOSAxMC41IFRmCjEyLjA3NDk5OTk5OTk5OTk5OTMgVEwKMC4gZwo1MDAuIDIxMi4gVGQKKE9SKSBUagpFVAowLiBHCjAuOCB3CjUyNS4gMjE5LiA4LiAtOC4gcmUKUwpCVAovRjkgMTAuNSBUZgoxMi4wNzQ5OTk5OTk5OTk5OTkzIFRMCjAuIGcKNTM4LiAyMTIuIFRkCihObykgVGoKRVQKQlQKL0Y5IDEwLjUgVGYKMTIuMDc0OTk5OTk5OTk5OTk5MyBUTAowLiBnCjU0LiAxODAuIFRkCihWaWN0aW0ncyBGVEMgY29tcGxhaW50IG51bWJlciBcKGlmIGF2YWlsYWJsZVwpOikgVGoKRVQKMC4gRwowLjYgdwozMDAuIDE3OC4gbQo0NzAuIDE3OC4gbApTCjAuODUgZwo0ODIuIDY5Ni4gOTYuIC0xMzYuIHJlCmYKQlQKL0YxIDcuMiBUZgo4LjI3OTk5OTk5OTk5OTk5OTQgVEwKMC4gZwo0ODYuIDY4NS4gVGQKKFwoMjBcKTopIFRqCkVUCkJUCi9GMSA3LjIgVGYKOC4yNzk5OTk5OTk5OTk5OTk0IFRMCjAuIGcKNDg2LiA2NzYuIFRkCihDaGVjayAiSSBoYXZlKSBUagpFVApCVAovRjEgNy4yIFRmCjguMjc5OTk5OTk5OTk5OTk5NCBUTAowLiBnCjQ4Ni4gNjY3LiBUZAoobm90Li4uIiBpZiB5b3UpIFRqCkVUCkJUCi9GMSA3LjIgVGYKOC4yNzk5OTk5OTk5OTk5OTk0IFRMCjAuIGcKNDg2LiA2NTguIFRkCihoYXZlIG5vdCB5ZXQpIFRqCkVUCkJUCi9GMSA3LjIgVGYKOC4yNzk5OTk5OTk5OTk5OTk0IFRMCjAuIGcKNDg2LiA2NDkuIFRkCihmaWxlZCBhIHJlcG9ydCkgVGoKRVQKQlQKL0YxIDcuMiBUZgo4LjI3OTk5OTk5OTk5OTk5OTQgVEwKMC4gZwo0ODYuIDY0MC4gVGQKKHdpdGggbGF3KSBUagpFVApCVAovRjEgNy4yIFRmCjguMjc5OTk5OTk5OTk5OTk5NCBUTAowLiBnCjQ4Ni4gNjMxLiBUZAooZW5mb3JjZW1lbnQgb3IpIFRqCkVUCkJUCi9GMSA3LjIgVGYKOC4yNzk5OTk5OTk5OTk5OTk0IFRMCjAuIGcKNDg2LiA2MjIuIFRkCih5b3UgaGF2ZSBjaG9zZW4pIFRqCkVUCkJUCi9GMSA3LjIgVGYKOC4yNzk5OTk5OTk5OTk5OTk0IFRMCjAuIGcKNDg2LiA2MTMuIFRkCihub3QgdG8uIENoZWNrICJJKSBUagpFVApCVAovRjEgNy4yIFRmCjguMjc5OTk5OTk5OTk5OTk5NCBUTAowLiBnCjQ4Ni4g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";

const GUIDE = [
  { phase: "Phase 1", color: "#1E40AF", title: "Get Your MyFreeScoreNow Report", body: "Go to MyFreeScoreNow.com — this is your primary credit report. It shows all 3 bureaus with real FICO scores.\n\nLog in → 3B Reports → switch to Classic View (orange button) → right-click Save As → save as a single webpage / PDF.\n\nAlternative: IdentityIQ or MyScoreIQ also work. Don't use Credit Karma or the Experian app as your dispute source — they don't hold weight." },
  { phase: "Phase 2 · Step 1", color: "#D97706", title: "Identify the Items to Dispute", body: "Review your report with the agent and decide which items you believe are inaccurate, incomplete, or not yours. You choose what goes on the letters — the agent never decides that for you.\n\nFor each item, the basis is accuracy: the bureau must verify it with the furnisher, and anything that cannot be verified must be corrected or deleted under FCRA Section 611.\n\nIf you are a genuine victim of identity theft, you can additionally complete the affidavit step in the app yourself, and file your own report at IdentityTheft.gov." },
  { phase: "Phase 2 · Step 2", color: "#6D28D9", title: "Build Your Packet (Per Bureau)", body: "One packet per bureau in this order:\n1. Cover Letter (handwritten — copy the app's letter)\n2. Personal Information Update Letter (only if your personal info is wrong)\n3. ID Page (photo ID + SSN card + proof of address)\n4. Credit Report pages\n5. Affidavit — only if you are a victim and completed it yourself\n6. FCRA 605B page\n\nThe app builds the combined PDF for each bureau. Download all three from the Package tab and mail each via USPS Certified Mail with tracking." },
  { phase: "Phase 2 · Step 3", color: "#059669", title: "Document Preparation Rules", body: "Photo ID: show the photo and all four corners, legible, no light/dark spots. Never crop corners.\n\nSocial Security card: show all four corners and the signature on the front.\n\nProof of address: no signature needed — just show your name, current address, and the date (a utility bill or bank statement works).\n\nHighlighter: yellow or blue only. Never pink — it shows as redacted black on TransUnion.\n\nDates: always use separators. 01/15/2025 or January 15th 2025. Never 01152025." },
  { phase: "Phase 2 · Step 4", color: "#DC2626", title: "Mail & Follow Up", body: "Mail all 3 packets via USPS Certified Mail with Return Receipt the same day. Keep every receipt.\n\nSection 611 gives the bureau 30 days to complete the reinvestigation. If a furnisher cannot verify an item, it must be corrected or deleted.\n\nBureau numbers:\n• Equifax: 404-885-8000 / 888-548-7811\n• Experian: 714-830-7000 / 888-397-3742\n• TransUnion: 610-690-4909 / 800-916-8800 (ask for Special Handling)\n\nBe courteous and persistent. Document date, time, rep name, and rep ID for every call." },
  { phase: "Phase 2 · Step 5", color: "#7C3AED", title: "Escalate to the CFPB if Needed", body: "If a bureau does not properly reinvestigate, file at CFPB.gov → Start New Complaint.\n\nThe company must respond within 15 days (extendable to 60). State that the item is inaccurate and unverified and is harming your credit profile, and ask for correction or deletion.\n\nDon't include your SSN or full account numbers in the complaint. You can submit more than one if needed." },
  { phase: "Phase 3", color: "#0F172A", title: "Build to 800+ Club", body: "Six factors to optimize:\n• Payment history: 100% on time\n• Utilization: 0-3%\n• Derogatory remarks: 0\n• Credit age: 9+ years\n• Total accounts: 21+\n• Inquiries: low\n\nAuthorized-user tradelines (clean, aged, low utilization, reports all 3 bureaus) help credit age, utilization, and account count. Good issuers: Chase, BofA, Capital One, Discover, Elan, Barclays. Avoid Citibank (often 2 bureaus).\n\nMass apply only at 800+: 4-5 cards at a time. 780+ gets the best rates." },
];

// The affidavit prints the street on one line and City / State / ZIP / Country on the
// line below it. Anything we already hold is one combined string, so split it before it
// is offered back to the client — never print a whole address onto the street line.
function splitAddress(full) {
  const s = String(full || "").replace(/\s+/g, " ").trim();
  const out = { street: "", city: "", state: "", zip: "" };
  if (!s) return out;
  let m = s.match(/^(.*?),\s*([^,]+?),\s*([A-Za-z]{2})\.?,?\s*(\d{5}(?:-\d{4})?)?$/);
  if (!m) m = s.match(/^(.*?),\s*([^,]+?)\s+([A-Za-z]{2})\.?\s+(\d{5}(?:-\d{4})?)$/);
  if (!m) m = s.match(/^(.*?)\s+([A-Za-z][A-Za-z .'-]*?)\s+([A-Za-z]{2})\.?\s+(\d{5}(?:-\d{4})?)$/);
  if (m) return { street: m[1].trim().replace(/,$/, ""), city: m[2].trim(), state: m[3].toUpperCase(), zip: m[4] || "" };
  out.street = s;
  return out;
}

// The blank FTC affidavit fields the client completes themselves in the app.
const AFFIDAVIT_DECLARATIONS = [
  "I did not authorize anyone to use my name or personal information to obtain money, credit, loans, goods, or services.",
  "I did not receive any money, goods, services, or other benefit as a result of the events described in this affidavit.",
  "I am willing to work with law enforcement if charges are brought against the person(s) who committed the fraud.",
];

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

// The client types their OWN answers here; nothing is sourced from the parsed credit
// report. These two components MUST stay at module scope. Declared inside ClientApp they
// got a new function identity on every parent render, so React unmounted and remounted
// them and wiped everything the client had typed.
const BLANK_ACCT = { institution: "", contact: "", phone: "", extension: "", accountNumber: "", routing: "", checkNumbers: "", type: "", status: "", dateOpened: "", dateDiscovered: "", amount: "" };

function AffidavitChatForm({ initial, seedName, seedAddress, seedDob, onDone, onDraft }) {
  // Seed order: an in-progress draft always wins (it is the newest thing the client
  // typed), then previously saved answers when they reopen the form to edit, then the
  // name/address already on file. The draft is what makes an accidental remount or a
  // page refresh non-destructive — nothing typed here is ever thrown away.
  const buildSeed = () => {
    const parsed = splitAddress(seedAddress || "");
    const base = {
      fullName: seedName || "", dob: seedDob || "", ssn: "", dlState: "", dlNumber: "",
      addr1: parsed.street, apt: "", city: parsed.city, state: parsed.state, zip: parsed.zip, country: "",
      since: "", dayArea: "", dayPhone: "", eveArea: "", evePhone: "", email: "",
      changed: "", atFraudName: "", atFraudAddr1: "", atFraudApt: "", atFraudCity: "", atFraudState: "",
      atFraudZip: "", atFraudCountry: "", atFraudDayArea: "", atFraudDayPhone: "", atFraudEveArea: "",
      atFraudEvePhone: "", atFraudEmail: "",
      d11: "", d12: "", d13: "",
      knowsPerson: "", person: "", personAddr1: "", personApt: "", personCity: "", personState: "",
      personZip: "", personCountry: "", personArea1: "", personPhone1: "", personArea2: "", personPhone2: "", personInfo: "",
      crimeInfo: "", doc16ID: false, doc16Proof: false,
      info17A: "", info17B: "", info17C: "",
      company18A: "", company18B: "", company18C: "",
      law20: "", ftcNumber: "",
    };
    const src = initial && typeof initial === "object" ? initial : null;
    if (!src) return { fields: base, accounts: [{ ...BLANK_ACCT }] };
    const fields = { ...base };
    Object.keys(base).forEach(k => { if (src[k] !== undefined && src[k] !== null) fields[k] = src[k]; });
    // An older saved session stored one combined address line; split it on the way back in.
    if (!fields.city && !fields.state && !fields.zip && src.addr2) {
      const p = splitAddress(src.addr2);
      fields.city = p.city || src.addr2; fields.state = p.state; fields.zip = p.zip;
    }
    // Re-open the optional sections when the saved answers actually contain something,
    // so an edit never silently hides work the client already did.
    if (!fields.changed && Object.keys(src).some(k => k.startsWith("atFraud") && src[k])) fields.changed = "yes";
    if (!fields.knowsPerson && (src.person || src.personAddr1 || src.personInfo)) fields.knowsPerson = "yes";
    const accounts = Array.isArray(src.accounts) && src.accounts.length
      ? src.accounts.map(a => ({ ...BLANK_ACCT, ...a }))
      : [{ ...BLANK_ACCT }];
    return { fields, accounts };
  };

  const [f, setF] = useState(() => buildSeed().fields);
  const [accts, setAccts] = useState(() => buildSeed().accounts);
  const [saved, setSaved] = useState(false);

  // Report every keystroke up to the parent, which holds it in a ref and writes it to
  // storage on a debounce. This deliberately does NOT set parent state — re-rendering
  // the whole chat on each character would make a long conversation crawl.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSaved(false);
    if (onDraft) onDraft({ ...f, accounts: accts });
  }, [f, accts]);

  const blankAcct = BLANK_ACCT;
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const setAcct = (i, k, v) => setAccts(prev => prev.map((a, idx) => idx === i ? { ...a, [k]: v } : a));
  const addAcct = () => setAccts(prev => prev.length >= 3 ? prev : [...prev, { ...blankAcct }]);
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
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 3 }}><label style={lab}>Number & street name</label><input style={inp} value={f.addr1} onChange={e => set("addr1", e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={lab}>Apt / suite</label><input style={inp} value={f.apt} onChange={e => set("apt", e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 2 }}><label style={lab}>City</label><input style={inp} value={f.city} onChange={e => set("city", e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={lab}>State</label><input style={inp} value={f.state} onChange={e => set("state", e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={lab}>ZIP</label><input style={inp} value={f.zip} onChange={e => set("zip", e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={lab}>Country</label><input style={inp} value={f.country} onChange={e => set("country", e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><label style={lab}>Lived here since</label><input style={inp} placeholder="mm/yyyy" value={f.since} onChange={e => set("since", e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={lab}>Email</label><input style={inp} value={f.email} onChange={e => set("email", e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><label style={lab}>Area code</label><input style={inp} placeholder="619" value={f.dayArea} onChange={e => set("dayArea", e.target.value)} /></div>
          <div style={{ flex: 2 }}><label style={lab}>Daytime phone</label><input style={inp} value={f.dayPhone} onChange={e => set("dayPhone", e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><label style={lab}>Area code</label><input style={inp} placeholder="619" value={f.eveArea} onChange={e => set("eveArea", e.target.value)} /></div>
          <div style={{ flex: 2 }}><label style={lab}>Evening phone</label><input style={inp} value={f.evePhone} onChange={e => set("evePhone", e.target.value)} /></div>
        </div>

        <div style={{ height: 1, background: "#f1f5f9", margin: "8px 0 12px" }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>(8)–(10) At the time of the fraud</div>
        <label style={lab}>Has your name, address, or phone changed since the fraud happened?</label>
        {seg({ get: f.changed, set: v => set("changed", v) }, [["yes", "Yes, it changed"], ["no", "No, same as above"]])}
        {f.changed === "yes" && (
          <div style={{ border: "1px solid #f1f5f9", borderRadius: 10, padding: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.5, marginBottom: 8 }}>Enter what your information was back then. Leave anything that didn't change blank.</div>
            <label style={lab}>Full legal name at the time</label><input style={inp} value={f.atFraudName} onChange={e => set("atFraudName", e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 3 }}><label style={lab}>Number & street name</label><input style={inp} value={f.atFraudAddr1} onChange={e => set("atFraudAddr1", e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={lab}>Apt / suite</label><input style={inp} value={f.atFraudApt} onChange={e => set("atFraudApt", e.target.value)} /></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 2 }}><label style={lab}>City</label><input style={inp} value={f.atFraudCity} onChange={e => set("atFraudCity", e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={lab}>State</label><input style={inp} value={f.atFraudState} onChange={e => set("atFraudState", e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={lab}>ZIP</label><input style={inp} value={f.atFraudZip} onChange={e => set("atFraudZip", e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={lab}>Country</label><input style={inp} value={f.atFraudCountry} onChange={e => set("atFraudCountry", e.target.value)} /></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><label style={lab}>Area code</label><input style={inp} value={f.atFraudDayArea} onChange={e => set("atFraudDayArea", e.target.value)} /></div>
              <div style={{ flex: 2 }}><label style={lab}>Daytime phone</label><input style={inp} value={f.atFraudDayPhone} onChange={e => set("atFraudDayPhone", e.target.value)} /></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><label style={lab}>Area code</label><input style={inp} value={f.atFraudEveArea} onChange={e => set("atFraudEveArea", e.target.value)} /></div>
              <div style={{ flex: 2 }}><label style={lab}>Evening phone</label><input style={inp} value={f.atFraudEvePhone} onChange={e => set("atFraudEvePhone", e.target.value)} /></div>
            </div>
            <label style={lab}>Email at the time</label><input style={inp} value={f.atFraudEmail} onChange={e => set("atFraudEmail", e.target.value)} />
          </div>
        )}

        <div style={{ height: 1, background: "#f1f5f9", margin: "8px 0 12px" }} />
        <label style={lab}>(11) Did you authorize anyone to use your information?</label>
        {seg({ get: f.d11, set: v => set("d11", v) }, [["did", "I did"], ["didnot", "I did not"]])}
        <label style={lab}>(12) Did you receive money/goods/services from it?</label>
        {seg({ get: f.d12, set: v => set("d12", v) }, [["did", "I did"], ["didnot", "I did not"]])}
        <label style={lab}>(13) Willing to work with law enforcement?</label>
        {seg({ get: f.d13, set: v => set("d13", v) }, [["am", "I am"], ["amnot", "I am not"]])}

        <div style={{ height: 1, background: "#f1f5f9", margin: "8px 0 12px" }} />
        <label style={lab}>(14) Do you know, or believe you know, who used your information?</label>
        {seg({ get: f.knowsPerson, set: v => set("knowsPerson", v) }, [["yes", "Yes"], ["no", "No / I don't know"]])}
        {f.knowsPerson === "yes" && (
          <div style={{ border: "1px solid #f1f5f9", borderRadius: 10, padding: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.5, marginBottom: 8 }}>Enter only what you actually know. Incomplete is fine — leave the rest blank.</div>
            <label style={lab}>Their name</label><input style={inp} value={f.person} onChange={e => set("person", e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 3 }}><label style={lab}>Number & street name</label><input style={inp} value={f.personAddr1} onChange={e => set("personAddr1", e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={lab}>Apt / suite</label><input style={inp} value={f.personApt} onChange={e => set("personApt", e.target.value)} /></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 2 }}><label style={lab}>City</label><input style={inp} value={f.personCity} onChange={e => set("personCity", e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={lab}>State</label><input style={inp} value={f.personState} onChange={e => set("personState", e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={lab}>ZIP</label><input style={inp} value={f.personZip} onChange={e => set("personZip", e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={lab}>Country</label><input style={inp} value={f.personCountry} onChange={e => set("personCountry", e.target.value)} /></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><label style={lab}>Area code</label><input style={inp} value={f.personArea1} onChange={e => set("personArea1", e.target.value)} /></div>
              <div style={{ flex: 2 }}><label style={lab}>Phone number</label><input style={inp} value={f.personPhone1} onChange={e => set("personPhone1", e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={lab}>Area code</label><input style={inp} value={f.personArea2} onChange={e => set("personArea2", e.target.value)} /></div>
              <div style={{ flex: 2 }}><label style={lab}>Other phone</label><input style={inp} value={f.personPhone2} onChange={e => set("personPhone2", e.target.value)} /></div>
            </div>
            <label style={lab}>Anything else you know about this person</label>
            <textarea value={f.personInfo} onChange={e => set("personInfo", e.target.value)} style={{ ...inp, minHeight: 56, resize: "vertical" }} />
          </div>
        )}

        <div style={{ height: 1, background: "#f1f5f9", margin: "8px 0 12px" }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>(19) The accounts/inquiries you say are fraud</div>
        {accts.map((a, i) => (
          <div key={i} style={{ border: "1px solid #f1f5f9", borderRadius: 10, padding: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED" }}>Item {i + 1}</span>
              {accts.length > 1 && <button type="button" onClick={() => removeAcct(i)} style={{ background: "none", border: "none", color: "#cbd5e1", fontSize: 14, cursor: "pointer" }}>✕</button>}
            </div>
            <input style={inp} placeholder="Name of institution" value={a.institution} onChange={e => setAcct(i, "institution", e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inp, flex: 2 }} placeholder="Contact person (if known)" value={a.contact} onChange={e => setAcct(i, "contact", e.target.value)} />
              <input style={{ ...inp, flex: 2 }} placeholder="Phone" value={a.phone} onChange={e => setAcct(i, "phone", e.target.value)} />
              <input style={{ ...inp, flex: 1 }} placeholder="Ext." value={a.extension} onChange={e => setAcct(i, "extension", e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inp, flex: 2 }} placeholder="Account number (if known)" value={a.accountNumber} onChange={e => setAcct(i, "accountNumber", e.target.value)} />
              <input style={{ ...inp, flex: 2 }} placeholder="Routing number (if any)" value={a.routing} onChange={e => setAcct(i, "routing", e.target.value)} />
              <input style={{ ...inp, flex: 2 }} placeholder="Affected check no(s)." value={a.checkNumbers} onChange={e => setAcct(i, "checkNumbers", e.target.value)} />
            </div>
            {seg({ get: a.type, set: v => setAcct(i, "type", v) }, [["credit", "Credit"], ["bank", "Bank"], ["phoneutil", "Phone/Util"], ["loan", "Loan"], ["govbenefits", "Gov't benefits"], ["internetemail", "Internet/Email"], ["other", "Other"]])}
            {seg({ get: a.status, set: v => setAcct(i, "status", v) }, [["opened", "Opened fraudulently"], ["tampered", "Existing acct tampered"]])}
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inp, flex: 1 }} placeholder="Date opened mm/yyyy" value={a.dateOpened} onChange={e => setAcct(i, "dateOpened", e.target.value)} />
              <input style={{ ...inp, flex: 1 }} placeholder="Date discovered mm/yyyy" value={a.dateDiscovered} onChange={e => setAcct(i, "dateDiscovered", e.target.value)} />
            </div>
            <input style={inp} placeholder="Total amount obtained ($)" value={a.amount} onChange={e => setAcct(i, "amount", e.target.value)} />
          </div>
        ))}
        {accts.length < 3 && <button type="button" onClick={addAcct} style={{ background: "none", border: "1.5px dashed #c4b5fd", color: "#7C3AED", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>+ Add another item</button>}

        <div style={{ height: 1, background: "#f1f5f9", margin: "8px 0 12px" }} />
        <label style={lab}>(15) How the identity theft happened</label>
        <div style={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.5, marginBottom: 6 }}>Keep this consistent with the personal statement you wrote in your own FTC report — the two are read side by side.</div>
        <textarea value={f.crimeInfo} onChange={e => set("crimeInfo", e.target.value)} placeholder="In your own words, how the thief got your information." style={{ ...inp, minHeight: 68, resize: "vertical" }} />

        <div style={{ ...lab, marginTop: 6, marginBottom: 6 }}>(16) Documents you're attaching to prove your identity</div>
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", cursor: "pointer" }}>
          <input type="checkbox" checked={f.doc16ID} onChange={e => set("doc16ID", e.target.checked)} style={{ marginTop: 3, width: 16, height: 16 }} />
          <span style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.5 }}>Government photo ID (driver's license, state ID, or passport)</span>
        </label>
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0 10px", cursor: "pointer" }}>
          <input type="checkbox" checked={f.doc16Proof} onChange={e => set("doc16Proof", e.target.checked)} style={{ marginTop: 3, width: 16, height: 16 }} />
          <span style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.5 }}>Proof of residency (lease, utility bill, or insurance bill)</span>
        </label>

        <label style={lab}>(17) Personal info on your report that's wrong because of the theft</label>
        <input style={inp} placeholder="e.g. My report shows the wrong name — my correct name is..." value={f.info17A} onChange={e => set("info17A", e.target.value)} />
        <input style={inp} placeholder="(optional second line)" value={f.info17B} onChange={e => set("info17B", e.target.value)} />
        <input style={inp} placeholder="(optional third line)" value={f.info17C} onChange={e => set("info17C", e.target.value)} />

        <label style={lab}>(18) Companies whose inquiries you say are from the theft</label>
        <input style={inp} placeholder="Company name(s)" value={f.company18A} onChange={e => set("company18A", e.target.value)} />
        <input style={inp} placeholder="(optional)" value={f.company18B} onChange={e => set("company18B", e.target.value)} />
        <input style={inp} placeholder="(optional)" value={f.company18C} onChange={e => set("company18C", e.target.value)} />

        <div style={{ ...lab, marginTop: 6, marginBottom: 6 }}>(20) Law enforcement report</div>
        {seg({ get: f.law20, set: v => set("law20", v) }, [["notfiled", "Haven't filed"], ["unable", "Was unable to file"], ["automated", "Filed automated"], ["inperson", "Filed in person"]])}
        <label style={lab}>Your FTC complaint number (if you filed at IdentityTheft.gov)</label>
        <input style={inp} placeholder="FTC report number" value={f.ftcNumber} onChange={e => set("ftcNumber", e.target.value)} />

        <button type="button" onClick={() => {
          // If the client turned a section off, nothing from it goes onto the form.
          const out = { ...f, accounts: accts };
          if (out.changed !== "yes") Object.keys(out).forEach(k => { if (k.startsWith("atFraud")) out[k] = ""; });
          if (out.knowsPerson !== "yes") ["person", "personAddr1", "personApt", "personCity", "personState", "personZip", "personCountry", "personArea1", "personPhone1", "personArea2", "personPhone2", "personInfo"].forEach(k => { out[k] = ""; });
          setSaved(true);
          onDone(out);
        }} style={{ width: "100%", height: 44, borderRadius: 12, background: saved ? "#0f766e" : "linear-gradient(135deg,#7C3AED,#a855f7)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>{saved ? "✓ Saved — save again to update" : "Save my affidavit answers"}</button>
        <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>Your answers are kept as you type, so you can correct anything without starting over. You will print, sign, and notarize the form yourself — signature and notary are left blank.</div>
      </div>
    );
  }

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
  // Live, unsaved affidavit answers. Held in a ref on purpose: the form reports every
  // keystroke, and putting that in state would re-render the entire chat per character.
  const affidavitDraftRef = useRef(null);
  const affidavitDraftTimer = useRef(null);
  const [showAffidavit, setShowAffidavit] = useState(false);
  // Track whether the client entered the identity-theft flow (so we don't claim the
  // packet is "done" while the FTC report / affidavit steps are still open), and make
  // sure the "ready" message is announced only once.
  const [idTheftStarted, setIdTheftStarted] = useState(false);
  const [announcedReady, setAnnouncedReady] = useState(false);

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
          if (s.affidavitData) setAffidavitData(s.affidavitData);          if (s.idTheftStarted) setIdTheftStarted(true);
          if (s.announcedReady) setAnnouncedReady(true);
          didRestore = true;
        }
      }
    } catch (e) { console.error("restore error:", e.message); }
    // A draft is answers the client typed but never pressed Save on. Recover it so a
    // refresh, a crashed tab, or a phone killing the page costs them nothing.
    try {
      const d = localStorage.getItem(AFFIDAVIT_DRAFT_KEY);
      if (d) { const parsed = JSON.parse(d); if (parsed && typeof parsed === "object") affidavitDraftRef.current = parsed; }
    } catch (e) { console.error("draft restore error:", e.message); }
    setRestored(true);
    if (!didRestore) initAgent();
  }, []);

  // Debounced writer for the live draft, plus a flush on unload so the last few
  // keystrokes before someone closes the tab still land.
  function saveAffidavitDraft(next) {
    affidavitDraftRef.current = next;
    if (affidavitDraftTimer.current) clearTimeout(affidavitDraftTimer.current);
    affidavitDraftTimer.current = setTimeout(() => {
      try { localStorage.setItem(AFFIDAVIT_DRAFT_KEY, JSON.stringify(affidavitDraftRef.current)); }
      catch (e) { console.error("draft save failed:", e.message); }
    }, 400);
  }

  function clearAffidavitDraft() {
    if (affidavitDraftTimer.current) clearTimeout(affidavitDraftTimer.current);
    affidavitDraftRef.current = null;
    try { localStorage.removeItem(AFFIDAVIT_DRAFT_KEY); } catch {}
  }

  useEffect(() => {
    const flush = () => {
      if (!affidavitDraftRef.current) return;
      try { localStorage.setItem(AFFIDAVIT_DRAFT_KEY, JSON.stringify(affidavitDraftRef.current)); } catch {}
    };
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      if (affidavitDraftTimer.current) clearTimeout(affidavitDraftTimer.current);
      flush();
    };
  }, []);

  // Autosave progress so a client can close the tab and resume where they left off.
  useEffect(() => {
    if (!restored) return;
    const snap = { v: 2, ts: Date.now(), messages, history, profile: profileRef.current, pkg, slots, docFiles, uploads, progress, statusTxt, approved, clientId, affidavitData, idTheftStarted, announcedReady };
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
    clearAffidavitDraft();
    setIdTheftStarted(false); setAnnouncedReady(false);
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
        setHistory(prev => [...prev, directive, { role: "assistant", content: clean }]);
        await announcePackage(json, { review: false });
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
          await announcePackage(json, { review: true });
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
          await announcePackage(json, { review: true });
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

  // Central place to record a generated package and announce it — once, and honestly:
  // if the client is mid identity-theft flow (FTC report / affidavit not finished), we
  // say the letters are drafted but NOT "ready to mail".
  async function announcePackage(json, { review = false } = {}) {
    setPkg(json); setProgress(100); setStatusTxt("Package complete");
    const cid = clientId || await saveClient(json);
    if (cid) await savePackage(cid, json);
    setTab(1);
    if (review) setTimeout(() => setShowReview(true), 1400);
    if (announcedReady) return;
    setAnnouncedReady(true);
    const first = json.clientName ? json.clientName.split(" ")[0] : "";
    const pending = idTheftStarted && !(affidavitData?.completed && slots.ftcReport);
    const msg = pending
      ? `Your dispute letters are drafted and in the Package tab${first ? ", " + first : ""}. This isn't ready to mail yet — please finish the identity-theft steps above: upload your FTC report and complete the affidavit. Once both are in, your packets are complete.`
      : `Your three packages are ready${first ? ", " + first : ""}. Open the Package tab to review and download each bureau's PDF. Brandon will review before you print and mail.`;
    setMessages(prev => [...prev, { from: "agent", text: msg }]);
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
    if (wantsFtc || wantsAff) setIdTheftStarted(true);
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
        if (json) await announcePackage(json, { review: true });
        else pushAgentReply(clean);
      } else pushAgentReply(clean);
    } catch (e) {
      setMessages(prev => [...prev, { from: "agent", text: "Error: " + e.message }]);
    }
    setBusy(false);
  }

  // Drop the affidavit fill-in form into the chat on demand (always reachable). If a form
  // is already open we scroll to it instead of pushing a second one — two live copies
  // would fight over the same draft and one of them would lose.
  function openAffidavitInChat() {
    setTab(0);
    setMessages(prev => {
      if (prev.some(m => m.from === "affidavit_form")) return prev;
      const editing = !!(affidavitData && affidavitData.completed);
      return [
        ...prev,
        { from: "agent", text: editing
          ? "Here are the answers you already gave. Change anything you need to and save again — your earlier answers are loaded in for you, so nothing has to be retyped."
          : "If any items on your report were opened or used by an identity thief, fill out the official FTC affidavit below in your own words. Only complete it if you are genuinely a victim — otherwise you can skip it and we'll dispute on accuracy grounds. You'll sign and notarize it yourself." },
        { from: "affidavit_form" },
      ];
    });
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

  // Client finished the in-chat affidavit form: save their answers and continue. The form
  // itself stays on screen so they can immediately correct a typo they just spotted —
  // replacing it with a text bubble is what made the last round of edits feel destructive.
  function completeAffidavit(ans) {
    setAffidavitData({ ...ans, completed: true });
    clearAffidavitDraft();
    setMessages(prev => {
      if (prev.some(m => m.savedNote)) return prev;
      const idx = prev.map(m => m.from).lastIndexOf("affidavit_form");
      if (idx === -1) return prev;
      const copy = [...prev];
      copy.splice(idx + 1, 0, { from: "agent", savedNote: true, text: "Saved. Your answers will be printed onto the official FTC affidavit in your packet, ready for you to sign and notarize. The form above stays open — change anything and press save again. You can also reopen it any time from Package → Affidavit." });
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
  // The Section 611 cover letter, built deterministically in code so the bureau's
  // name/address is always correct and distinct, and the client's confirmed legal name
  // is always used. Only the disputed-item list varies per bureau (from the client's
  // selection). The model no longer controls the address or name.
  function buildCoverLetterText(bureauKey) {
    const today = new Date().toLocaleDateString("en-US");
    const ssn = pkg && pkg.ssn4 ? pkg.ssn4 : "";
    const addr = (BUREAU_ADDR[bureauKey] || "").replace(/,\s*(P\.?\s*O\.?\s*Box)/i, ",\n$1");
    const items = (pkg && pkg.disputeItems && pkg.disputeItems[bureauKey]) || [];
    const lines = [
      `${(pkg && pkg.clientName) || ""}`,
      `${(pkg && pkg.clientAddress) || ""}`,
      ``,
      addr,
      ``,
      `Date: ${today}`,
      ``,
      `RE: Request for Reinvestigation of Inaccurate Information; SSN ending ${ssn}`,
      ``,
      `To Whom It May Concern,`,
      ``,
      `I have reviewed my credit report and am disputing the following items, which I have identified as inaccurate, incomplete, or not belonging to me. Under the Fair Credit Reporting Act Section 611 (15 U.S.C. 1681i), I request that you reinvestigate each item with the furnisher and correct or delete any that cannot be verified as accurate.`,
      ``,
      `Items disputed:`,
    ];
    if (items.length) items.forEach((it, i) => lines.push(`${i + 1}. ${it}`));
    else lines.push(`(see the enclosed credit report)`);
    lines.push(``);
    lines.push(`For each item above, please confirm its accuracy directly with the furnisher. If an item cannot be verified, please delete it and provide me with an updated copy of my credit report. Please complete this reinvestigation within 30 days as required by Section 611.`);
    lines.push(``);
    lines.push(`My contact information is as follows:`);
    lines.push(`${(pkg && pkg.clientName) || ""}`);
    lines.push(`${(pkg && pkg.clientAddress) || ""}`);
    return lines.join("\n");
  }

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
    para(buildCoverLetterText(bureauKey));
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

  // Download the client's IN-CHAT answers printed onto the official FTC affidavit,
  // so they can see and verify the filled version that goes into the packet.
  async function downloadFilledAffidavit() {
    if (!affidavitData || !affidavitData.completed) return;
    try {
      const PDFLib = await loadPdfLib();
      const bytes = await fillAffidavit(affidavitData, PDFLib);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "FTC_Identity_Theft_Affidavit_Filled.pdf"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error("downloadFilledAffidavit error:", e.message); }
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
    const wrap = (text, chars) => { const out = []; let cur = ""; String(text || "").split(/\s+/).filter(Boolean).forEach(w => { if ((cur + " " + w).trim().length > chars) { if (cur) out.push(cur); cur = w; } else cur = cur ? cur + " " + w : w; }); if (cur) out.push(cur); return out; };
    // Recurring "Victim's Name / Phone number" header on pages 2-6 (indices 1-5). Pages 3
    // and 5 are the rebuilt sheets and their header blanks sit a few points to the left.
    const hdrName = ans.fullName || "";
    [1, 2, 3, 4, 5].forEach(pi => {
      const rebuilt = pi === 2 || pi === 4;
      put(pi, 126, 42, hdrName, 9);
      put(pi, rebuilt ? 383 : 393, 42, ans.dayArea, 9);
      put(pi, rebuilt ? 400 : 417, 42, ans.dayPhone, 9);
    });

    // Page 1 (H-1) — About You: Now
    put(0, 190, 245, ans.fullName);
    put(0, 182, 271, ans.dob);
    put(0, 240, 305, ans.ssn);
    put(0, 192, 326, ans.dlState); put(0, 266, 326, ans.dlNumber);
    // (5) street on its own line; City / State / ZIP / Country on the line beneath it.
    put(0, 98, 381, ans.addr1); put(0, 365, 381, ans.apt);
    if (ans.city || ans.state || ans.zip || ans.country) {
      put(0, 100, 413, ans.city); put(0, 240, 413, ans.state); put(0, 312, 413, ans.zip); put(0, 422, 413, ans.country);
    } else { put(0, 100, 413, ans.addr2); } // sessions saved before the fields were split
    put(0, 254, 446, ans.since);
    put(0, 196, 473, ans.dayArea); put(0, 224, 473, ans.dayPhone);
    put(0, 194, 491, ans.eveArea); put(0, 222, 491, ans.evePhone);
    put(0, 147, 509, ans.email);
    // Page 1 — At the Time of the Fraud (8)-(10). Skipped unless the client says their
    // information has changed since the fraud.
    put(0, 212, 580, ans.atFraudName);
    put(0, 180, 613, ans.atFraudAddr1); put(0, 384, 613, ans.atFraudApt);
    if (ans.atFraudCity || ans.atFraudState || ans.atFraudZip || ans.atFraudCountry) {
      put(0, 100, 647, ans.atFraudCity); put(0, 240, 647, ans.atFraudState); put(0, 312, 647, ans.atFraudZip); put(0, 420, 647, ans.atFraudCountry);
    } else { put(0, 100, 647, ans.atFraudAddr2); }
    put(0, 196, 683, ans.atFraudDayArea); put(0, 224, 683, ans.atFraudDayPhone);
    put(0, 427, 683, ans.atFraudEveArea); put(0, 455, 683, ans.atFraudEvePhone);
    put(0, 147, 701, ans.atFraudEmail);

    // Page 2 (H-2) — Declarations (client's own choices) + (14) the person, which is only
    // printed when the client says they know who it was and names them.
    if (ans.d11) X(1, ans.d11 === "did" ? 117 : 187, 129);
    if (ans.d12) X(1, ans.d12 === "did" ? 117 : 187, 180);
    if (ans.d13) X(1, ans.d13 === "am" ? 117 : 187, 220);
    if (ans.knowsPerson !== "no") {
      put(1, 150, 360, ans.person);
      put(1, 158, 401, ans.personAddr1); put(1, 364, 401, ans.personApt);
      put(1, 115, 440, ans.personCity); put(1, 256, 440, ans.personState); put(1, 328, 440, ans.personZip); put(1, 400, 440, ans.personCountry);
      put(1, 202, 500, ans.personArea1); put(1, 230, 500, ans.personPhone1);
      put(1, 329, 500, ans.personArea2); put(1, 357, 500, ans.personPhone2);
      // First line is short (it shares the row with the printed label); the rest run full width.
      const words = String(ans.personInfo || "").split(/\s+/).filter(Boolean);
      if (words.length) {
        const lines = []; let cur = "", limit = 42;
        words.forEach(w => { if ((cur + " " + w).trim().length > limit) { if (cur) lines.push(cur); cur = w; limit = 85; } else cur = cur ? cur + " " + w : w; });
        if (cur) lines.push(cur);
        put(1, 313, 529, lines[0], 9);
        lines.slice(1, 6).forEach((ln, i) => put(1, 112, 546 + i * 17, ln, 9));
      }
    }

    // Page 3 (H-3, rebuilt) — (15) crime info, (16) docs, (17) inaccurate info, (18) inquiries
    wrap(ans.crimeInfo, 78).slice(0, 6).forEach((ln, i) => put(2, 58, 144 + i * 18, ln, 9));
    if (ans.doc16ID) X(2, 85, 305);
    if (ans.doc16Proof) X(2, 85, 378);
    put(2, 110, 492, ans.info17A, 9);
    put(2, 110, 512, ans.info17B, 9);
    put(2, 110, 532, ans.info17C, 9);
    put(2, 178, 592, ans.company18A, 9);
    put(2, 178, 612, ans.company18B, 9);
    put(2, 178, 632, ans.company18C, 9);

    // Page 4 (H-4) — fraud account blocks (up to 3), all client-entered
    const blocks = [
      { inst: 121, num: 150, t1: 174, t2: 189, so: 228, st: 242, d: 271 },
      { inst: 322, num: 352, t1: 376, t2: 390, so: 429, st: 443, d: 473 },
      { inst: 519, num: 549, t1: 573, t2: 588, so: 627, st: 641, d: 670 },
    ];
    const typeBox = (B, t) => ({ credit: [133, B.t1], bank: [189, B.t1], phoneutil: [237, B.t1], loan: [332, B.t1], govbenefits: [133, B.t2], internetemail: [261, B.t2], other: [366, B.t2] })[t];
    (ans.accounts || []).slice(0, 3).forEach((ac, i) => {
      const B = blocks[i];
      put(3, 60, B.inst - 12, ac.institution); put(3, 232, B.inst - 12, ac.contact); put(3, 345, B.inst - 12, ac.phone); put(3, 425, B.inst - 12, ac.extension);
      put(3, 60, B.num - 12, ac.accountNumber); put(3, 250, B.num - 12, ac.routing); put(3, 430, B.num - 12, ac.checkNumbers);
      const tb = typeBox(B, ac.type); if (tb) X(3, tb[0], tb[1]);
      if (ac.status === "opened") X(3, 84, B.so); else if (ac.status === "tampered") X(3, 84, B.st);
      put(3, 60, B.d - 12, ac.dateOpened); put(3, 225, B.d - 12, ac.dateDiscovered); put(3, 430, B.d - 12, ac.amount);
    });

    // Page 5 (H-5, rebuilt) — (20) law enforcement selection + FTC complaint number
    const law = { notfiled: 240, unable: 258, automated: 276, inperson: 306 }[ans.law20];
    if (law) X(4, 103, law);
    put(4, 305, 604, ans.ftcNumber);

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




  const personalInfoPreview = pkg && pkg.personalInfoNeeded ? buildPersonalInfoText("equifax") : "";
  const copyTextForTab = (key) => {
    if (key === "personalInfo") return personalInfoPreview;
    if (key === "handwrittenNote") return BUREAUS.map(b => `— ${b.label} —\n${buildCoverLetterText(b.key)}`).join("\n\n\n");
    if (BUREAUS.some(b => b.key === key)) return buildCoverLetterText(key);
    return pkg?.[key] || "";
  };

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
                  <div key="ftc_upload" className="msg" style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>⚖️</div>
                    <FtcUploadCard onUpload={completeFtcUpload} />
                  </div>
                ) : m.from === "affidavit_form" ? (
                  <div key="affidavit_form" className="msg" style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>⚖️</div>
                    <AffidavitChatForm
                      initial={affidavitDraftRef.current || affidavitData}
                      seedName={pkg?.clientName || ""}
                      seedAddress={pkg?.clientAddress || ""}
                      seedDob={pkg?.dob || ""}
                      onDraft={saveAffidavitDraft}
                      onDone={completeAffidavit}
                    />
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
                <div style={{ background: "linear-gradient(135deg,#0f766e,#0d9488)", color: "#fff", padding: "12px 16px", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Your dispute packages are here</div>
                  <div style={{ fontSize: 11.5, color: "#d1fae5", lineHeight: 1.5, marginTop: 2 }}>Tap "Download all 3 bureau packets" below to save the PDFs, then print and mail one to each bureau. The tabs let you preview each bureau's letter, the personal-info letter, and your documents.</div>
                </div>
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
                    (() => {
                      const filled = affidavitData?.completed;
                      const uploaded = !!slots.affidavit;
                      const included = filled || uploaded;
                      return (
                    <div style={{ padding: "20px 18px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Identity Theft Affidavit (official FTC form)</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, lineHeight: 1.6 }}>This is the official FTC Identity Theft Victim's Complaint and Affidavit. It is optional and only for genuine identity theft victims. You fill it out yourself in the chat, then print and notarize it. If you upload a completed copy, that is used instead.</div>
                      <div style={{ background: included ? "#f0fdf4" : "#f8faff", border: `1px solid ${included ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: included ? "#16a34a" : "#64748b", marginBottom: 8 }}>
                          {uploaded ? `Your uploaded copy is attached: ${slots.affidavit.name}` : filled ? "✓ Your filled affidavit is completed and included in your packets" : "Blank official form will be included until you fill it out"}
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {filled && !uploaded && (
                            <button onClick={downloadFilledAffidavit} style={{ padding: "10px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                              ⬇ Download my filled affidavit
                            </button>
                          )}
                          <button onClick={openAffidavitInChat} style={{ padding: "10px 16px", background: "#7C3AED", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            {filled ? "Edit my answers" : "Fill it out in chat"}
                          </button>
                          <button onClick={downloadBlankAffidavit} style={{ padding: "10px 16px", background: "#fff", color: "#7C3AED", border: "1.5px solid #e9d5ff", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            Download blank form
                          </button>
                          <label style={{ padding: "10px 16px", background: "#fff", color: "#7C3AED", border: "1.5px solid #e9d5ff", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            {uploaded ? "Replace completed copy" : "Upload completed copy"}
                            <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={e => { setSlotFile("affidavit", e.target.files[0]); e.target.value = ""; }} />
                          </label>
                        </div>
                      </div>
                    </div>
                      );
                    })()
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
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Your Handwritten Cover Letters</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, lineHeight: 1.6 }}>Write a separate letter by hand for each bureau, word for word, on plain white paper in blue or black pen. Each bureau's letter has its own address and items — they are not the same.</div>
                      <div style={{ background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>Important Instructions</div>
                        <div style={{ fontSize: 12, color: "#6b21a8", lineHeight: 1.65 }}>{pkg?.handwrittenNote || "Write these letters by hand. Do not type or print them. Use plain white paper and blue or black ink."}</div>
                      </div>
                      {BUREAUS.map(b => (
                        <div key={b.key} style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: b.color, marginBottom: 6 }}>{b.label}</div>
                          <pre style={{ fontSize: 12, lineHeight: 2, color: "#374151", whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", margin: 0, background: "#fffbeb", padding: 16, borderRadius: 10, border: "1px solid #fde68a" }}>{buildCoverLetterText(b.key)}</pre>
                        </div>
                      ))}
                    </div>
                  ) : docTab === "personalInfo" ? (
                    <div style={{ padding: "20px 18px" }}>
                      {pkg?.personalInfoNeeded ? (
                        <>
                          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, lineHeight: 1.6 }}>One per bureau — each uses that bureau's name and address. All three are in the downloaded packets.</div>
                          {BUREAUS.map(b => (
                            <div key={b.key} style={{ marginBottom: 16 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: b.color, marginBottom: 6 }}>{b.label}</div>
                              <pre style={{ fontSize: 12, lineHeight: 1.95, color: "#374151", whiteSpace: "pre-wrap", fontFamily: "Georgia,serif", margin: 0 }}>{buildPersonalInfoText(b.key)}</pre>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>No personal information correction letter is needed — your personal info on the report is already correct.</div>
                      )}
                    </div>
                  ) : (
                    <pre style={{ fontSize: 12, lineHeight: 1.95, color: "#374151", whiteSpace: "pre-wrap", fontFamily: "Georgia,serif", padding: "20px 18px", margin: 0 }}>{BUREAUS.some(b => b.key === docTab) ? buildCoverLetterText(docTab) : (pkg[docTab] || "")}</pre>
                  )}
                </div>

                <div style={{ padding: "12px 16px 16px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {TEXT_TABS.includes(docTab) && (
                      <button onClick={() => copyText(copyTextForTab(docTab), docTab)} className="action-btn" style={{ flex: 1, height: 42, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#fff", border: "1.5px solid #e2e8f0", color: "#374151" }}>
                        {copied === docTab ? "✓ Copied" : "Copy"}
                      </button>
                    )}
                    {BUREAUS.some(b => b.key === docTab) && (
                      <button onClick={() => downloadBureauPacket(docTab)} className="action-btn" style={{ flex: 1, height: 42, borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#fff", border: `1.5px solid ${BUREAUS.find(b => b.key === docTab)?.color}`, color: BUREAUS.find(b => b.key === docTab)?.color }}>
                        ⬇ {BUREAUS.find(b => b.key === docTab)?.label} only
                      </button>
                    )}
                    <button onClick={downloadAllPackets} className="action-btn" style={{ flex: 2, height: 42, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#0f766e", border: "none", color: "#fff" }}>
                      ⬇ Download all 3 bureau packets
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
                  { done: !!(slots.affidavit || affidavitData?.completed), icon: "📝", label: "Affidavit (only if a victim)", sub: "Official FTC form — fill it out yourself", action: () => { setTab(1); setDocTab("affidavit"); }, btn: ready ? "Open" : null },
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
