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
6. Identity Theft Affidavit — ONLY if the client completed it themselves in the app's affidavit step; otherwise a blank affidavit form is included for them to fill in and notarize
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
Do NOT fill out the Identity Theft Affidavit. If a client states they are a genuine identity theft victim and wants to include one, tell them: "There is an affidavit step in the app — open the Affidavit section, fill it in yourself in your own words, then it will be added to your packet for you to print and have notarized." You provide the blank form only. You never assert that any item was opened by a thief.

THE FTC REPORT:
The FTC Identity Theft Report is filed by the client themselves at IdentityTheft.gov, and only by clients who are genuinely identity theft victims. You may tell a client where to file it, but you do NOT script statements claiming specific accounts are fraud and you do NOT tell the client what to declare. That is the client's own statement to make.

═══════════════════════════════════════════
DOCUMENTS TO COLLECT (one at a time, in order)
═══════════════════════════════════════════
1. Credit report (MyFreeScoreNow) — to identify items.
2. Government photo ID — all four corners, no glare.
3. Social Security card — all four corners.
4. Proof of current address — utility bill or bank statement within 30 days, date cropped.
5. (Optional) Identity Theft Affidavit — only if the client is a genuine victim and completes the app's affidavit step; never required, never blocked on.
Record each in "documentsReceived" and never ask twice. Ask for the next only after the previous arrives. The FCRA 605B page is added automatically — do not ask for it.

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
        setMessages(prev => [...prev, { from: "agent", text: clean }]);
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

    const blocks = [];
    for (const fd of fileData) {
      if (fd.size > 3 * 1024 * 1024) {
        blocks.push({ type: "text", text: `File "${fd.name}" (${Math.round(fd.size/1024/1024)}MB) has been saved to secure storage. It is too large to read automatically — please tell me the key information from this document.` });
      } else if (fd.type === "application/pdf") {
        blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: fd.data.split(",")[1] } });
      } else if (fd.type.startsWith("image/")) {
        blocks.push({ type: "image", source: { type: "base64", media_type: fd.type, data: fd.data.split(",")[1] } });
      }
    }
    blocks.push({ type: "text", text: `I uploaded: ${files.map(f => f.name).join(", ")}. Please read carefully, extract all info, tell me what you found, and ask which items I want to dispute or for anything still needed.` });

    let userBlocks = blocks;
    let newHist = [...history, { role: "user", content: userBlocks }];
    if (bodySize(newHist) > SAFE_BODY_LIMIT) {
      newHist = [...lightenAll(history), { role: "user", content: userBlocks }];
    }
    if (bodySize(newHist) > SAFE_BODY_LIMIT) {
      userBlocks = [{ type: "text", text: `I uploaded ${files.map(f => f.name).join(", ")}, but it is too large for me to read automatically. It is saved securely in storage — I will provide the key details by typing them.` }];
      newHist = [...lightenAll(history), { role: "user", content: userBlocks }];
      setMessages(prev => [...prev, { from: "agent", text: "That file is a bit large for automatic reading, but it's saved securely. Upload a smaller PDF or a JPG screenshot of the report, or just type the key details — and we'll keep moving." }]);
    }
    setHistory(newHist);
    try {
      const txt = await callAPI(newHist, 8000);
      const { clean, state } = extractState(txt);
      applyState(state);
      const lightHist = [...lightenAll(history), { role: "user", content: lighten(userBlocks) }];
      const updHist = [...lightHist, { role: "assistant", content: clean }];
      setHistory(updHist);
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
        setMessages(prev => [...prev, { from: "agent", text: clean }]);
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

  // Infer which packet slot an uploaded file belongs to, from its filename.
  function inferSlot(name) {
    const n = (name || "").toLowerCase();
    if (/passport/.test(n)) return "passport";
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
    const M = 56, W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), maxW = W - M * 2;
    let y = M;
    const room = (lh) => { if (y + lh > H - M) { doc.addPage(); y = M; } };
    const heading = (txt, color) => { room(30); doc.setFont("times", "bold"); doc.setFontSize(15); doc.setTextColor(color || "#0f172a"); doc.text(txt, M, y); y += 10; doc.setDrawColor(210); doc.line(M, y, W - M, y); y += 18; doc.setTextColor("#111111"); };
    const para = (txt, size = 11, lh = 16) => { doc.setFont("times", "normal"); doc.setFontSize(size); doc.setTextColor("#111111"); doc.splitTextToSize(String(txt || ""), maxW).forEach(line => { room(lh); doc.text(line, M, y); y += lh; }); };

    // Page 1 — intentionally blank for the client's handwritten cover letter.
    doc.setFont("times", "italic"); doc.setFontSize(9); doc.setTextColor("#cbd5e1");
    doc.text("Handwrite your cover letter on this page.", M, M);
    doc.setTextColor("#111111");

    // Page 2 — typed cover letter.
    doc.addPage(); y = M;
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(b.color); doc.text("Credit Counsel Elite", M, y); y += 22;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor("#64748b"); doc.text(`${b.label} Dispute Package — ${pkg.clientName || ""}`, M, y); y += 14;
    doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), M, y); y += 26;
    heading(`Cover Letter — ${b.label}`, b.color);
    para(pkg[bureauKey], 11, 16);
    if (pkg.personalInfoNeeded) { doc.addPage(); y = M; heading("Personal Information Correction Letter", "#374151"); para(buildPersonalInfoText(bureauKey), 11, 16); }
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

  // Identity Theft Affidavit page. The app NEVER asserts fraud on the client's behalf.
  // If the client completed the affidavit step themselves, render their own statements.
  // Otherwise render a BLANK affidavit form with ruled lines for them to fill by hand.
  function buildAffidavitDoc(bureauKey, JsPDF) {
    const b = BUREAUS.find(x => x.key === bureauKey);
    const a = affidavitData && affidavitData.completed ? affidavitData : null;
    const doc = new JsPDF({ unit: "pt", format: "letter" });
    const M = 56, W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), maxW = W - M * 2;
    let y = M;
    const room = (lh) => { if (y + lh > H - M) { doc.addPage(); y = M; } };
    const line = (txt, opt = {}) => {
      const { size = 11, bold = false, gap = 16, color = "#111111" } = opt;
      doc.setFont("times", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(color);
      doc.splitTextToSize(String(txt || ""), maxW).forEach(s => { room(gap); doc.text(s, M, y); y += gap; });
    };
    const rule = (label) => { room(26); doc.setDrawColor(150); doc.line(M, y + 6, W - M, y + 6); if (label) { doc.setFont("times", "italic"); doc.setFontSize(8); doc.setTextColor("#94a3b8"); doc.text(label, M, y + 17); } y += 30; doc.setTextColor("#111111"); };

    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor("#0f172a");
    room(26); doc.text("Identity Theft Victim's Affidavit", M, y); y += 24;
    line(`Submitted to ${b.label}`, { color: "#64748b", gap: 18 });
    y += 4;

    if (a) {
      // Client-completed: render the client's own entries.
      line(`Affiant: ${a.fullName || pkg.clientName || ""}`);
      line(`Date of Birth: ${a.dob || pkg.dob || ""}`);
      line(`Social Security Number: ${(a.ssn4 || pkg.ssn4) ? "XXX-XX-" + (a.ssn4 || pkg.ssn4) : ""}`);
      line(`Driver's License: ${a.driverLicense || ""}`);
      line(`Address: ${a.address || pkg.clientAddress || ""}`);
      line(`Daytime phone: ${a.phone || ""}`);
      line(`Email: ${a.email || ""}`);
      y += 8;
      line("Declarations:", { bold: true, gap: 18 });
      AFFIDAVIT_DECLARATIONS.forEach((d, i) => {
        const checked = a.declarations && a.declarations[i];
        line(`[${checked ? "X" : " "}] ${d}`, { gap: 16 });
      });
      y += 6;
      const accts = (a.items || []);
      if (accts.length) {
        line("The following items, which I personally identify, were not authorized by me:", { gap: 18 });
        accts.forEach((it, i) => line(`${i + 1}. ${it}`, { gap: 15 }));
      } else {
        line("Items identified by the affiant: (none entered)", { gap: 16 });
      }
      y += 8;
      if (a.statement) { line("Statement:", { bold: true, gap: 18 }); line(a.statement, { gap: 15 }); y += 6; }
      line("I certify that, to the best of my knowledge and belief, the information in this affidavit is true, correct, and complete and made in good faith.");
      y += 24;
      line("Signature: ______________________________     Date: ______________", { gap: 26 });
    } else {
      // Blank fillable form — the client completes it by hand.
      line("Complete this form yourself. Enter only what you personally know to be true.", { color: "#64748b", gap: 18 });
      y += 4;
      line("Full legal name:"); rule();
      line("Date of birth:"); rule();
      line("Social Security number:"); rule();
      line("Driver's license (state and number):"); rule();
      line("Current address:"); rule(); rule();
      line("Daytime phone:"); rule();
      line("Email:"); rule();
      y += 6;
      line("Declarations (check each that applies):", { bold: true, gap: 18 });
      AFFIDAVIT_DECLARATIONS.forEach(d => line(`[   ] ${d}`, { gap: 18 }));
      y += 6;
      line("Items you personally identify as not authorized by you (list each):", { bold: true, gap: 18 });
      rule(); rule(); rule();
      y += 8;
      line("I certify that, to the best of my knowledge and belief, the information in this affidavit is true, correct, and complete and made in good faith.");
      y += 24;
      line("Signature: ______________________________     Date: ______________", { gap: 26 });
    }

    y += 16;
    line("Notary Acknowledgment", { bold: true, gap: 20 });
    line("State of ____________________   County of ____________________", { gap: 24 });
    line("Subscribed and sworn to before me this ______ day of ______________, 20____.", { gap: 24 });
    line("Notary Public: ______________________________", { gap: 24 });
    line("My commission expires: __________________", { gap: 18 });
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

  // ── Affidavit fill-in form (client completes it themselves) ──
  function AffidavitForm() {
    const init = affidavitData || {};
    const [fullName, setFullName] = useState(init.fullName ?? (pkg?.clientName || ""));
    const [dob, setDob] = useState(init.dob ?? (pkg?.dob || ""));
    const [address, setAddress] = useState(init.address ?? (pkg?.clientAddress || ""));
    const [driverLicense, setDriverLicense] = useState(init.driverLicense ?? "");
    const [phone, setPhone] = useState(init.phone ?? "");
    const [email, setEmail] = useState(init.email ?? "");
    const [declarations, setDeclarations] = useState(init.declarations ?? [false, false, false]);
    const [statement, setStatement] = useState(init.statement ?? "");
    const allItems = pkg?.disputeItems
      ? Array.from(new Set([].concat(pkg.disputeItems.equifax || [], pkg.disputeItems.experian || [], pkg.disputeItems.transunion || [])))
      : [];
    const [selected, setSelected] = useState(init.items ?? []);

    const toggleItem = (it) => setSelected(prev => prev.includes(it) ? prev.filter(x => x !== it) : [...prev, it]);
    const toggleDecl = (i) => setDeclarations(prev => prev.map((v, idx) => idx === i ? !v : v));

    const inputStyle = { width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", marginBottom: 10 };
    const labelStyle = { fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 4, display: "block" };

    function save() {
      setAffidavitData({ completed: true, fullName, dob, address, driverLicense, phone, email, declarations, statement, items: selected, ssn4: pkg?.ssn4 || null });
      setShowAffidavit(false);
    }

    return (
      <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowAffidavit(false); }}>
        <div className="sheet">
          <div className="sheet-handle" />
          <div style={{ padding: "0 20px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>Identity Theft Affidavit</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, lineHeight: 1.5 }}>Only complete this if you are genuinely a victim of identity theft. Fill it in yourself, in your own words. You will print it and have it notarized. Nothing here is pre-checked — you choose what is true.</div>
            <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: "#854d0e", lineHeight: 1.55 }}>
              By submitting, you are signing a statement under penalty of perjury. Only include items you personally know were not authorized by you. If you are not sure an item is identity theft, leave it out and dispute it on accuracy grounds instead.
            </div>

            <label style={labelStyle}>Full legal name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
            <label style={labelStyle}>Date of birth</label>
            <input value={dob} onChange={e => setDob(e.target.value)} style={inputStyle} />
            <label style={labelStyle}>Current address</label>
            <input value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
            <label style={labelStyle}>Driver's license (state and number)</label>
            <input value={driverLicense} onChange={e => setDriverLicense(e.target.value)} style={inputStyle} />
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><label style={labelStyle}>Daytime phone</label><input value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>Email</label><input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} /></div>
            </div>

            <div style={{ ...labelStyle, marginTop: 6, marginBottom: 8 }}>Declarations — check only what is true</div>
            {AFFIDAVIT_DECLARATIONS.map((d, i) => (
              <label key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", cursor: "pointer" }}>
                <input type="checkbox" checked={declarations[i]} onChange={() => toggleDecl(i)} style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.5 }}>{d}</span>
              </label>
            ))}

            <div style={{ ...labelStyle, marginTop: 12, marginBottom: 8 }}>Items you affirm were NOT authorized by you</div>
            {allItems.length === 0 ? (
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>No parsed items yet. You can add them in the statement box below.</div>
            ) : allItems.map((it, i) => (
              <label key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0", cursor: "pointer" }}>
                <input type="checkbox" checked={selected.includes(it)} onChange={() => toggleItem(it)} style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.5 }}>{it}</span>
              </label>
            ))}

            <label style={{ ...labelStyle, marginTop: 12 }}>Your statement (optional — in your own words)</label>
            <textarea value={statement} onChange={e => setStatement(e.target.value)} placeholder="Describe what happened, in your own words." style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />

            <div style={{ display: "flex", gap: 8, margin: "8px 0 24px" }}>
              <button onClick={() => setShowAffidavit(false)} className="pill-btn" style={{ flex: 1, height: 44, borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#f8faff", border: "1.5px solid #e2e8f0", color: "#64748b" }}>Cancel</button>
              <button onClick={save} style={{ flex: 2, height: 44, borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "linear-gradient(135deg,#7C3AED,#a855f7)", border: "none", color: "#fff" }}>Save my affidavit</button>
            </div>
          </div>
        </div>
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
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>Credit report, ID, SSN card, proof of address — the agent reads them automatically</div>
                </div>
                {uploads.length > 0 && <div style={{ background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>{uploads.length} uploaded</div>}
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
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Identity Theft Affidavit</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, lineHeight: 1.6 }}>This affidavit is optional. Complete it only if you are genuinely a victim of identity theft. You fill it in yourself — the app does not pre-fill any fraud claims for you. If you complete it, it is added to your packet for you to print and have notarized. If you don't, a blank affidavit form is included so you can fill it out by hand.</div>
                      <div style={{ background: affidavitData?.completed ? "#f0fdf4" : "#f8faff", border: `1px solid ${affidavitData?.completed ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: affidavitData?.completed ? "#16a34a" : "#64748b", marginBottom: 6 }}>
                          {affidavitData?.completed ? "Completed by you" : "Not completed"}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 12 }}>
                          {affidavitData?.completed
                            ? `${(affidavitData.items || []).length} item(s) listed. You can edit it any time before printing.`
                            : "If you are a victim, fill in the affidavit in your own words. Otherwise leave it and a blank form will be included."}
                        </div>
                        <button onClick={() => setShowAffidavit(true)} style={{ padding: "10px 18px", background: "#7C3AED", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                          {affidavitData?.completed ? "Edit my affidavit" : "Fill in the affidavit"}
                        </button>
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
            {showAffidavit && pkg && <AffidavitForm />}

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
                  { done: !!affidavitData?.completed, icon: "📝", label: "Affidavit (only if a victim)", sub: "Fill it in yourself if it applies to you", action: () => { setTab(1); setDocTab("affidavit"); }, btn: ready ? "Open" : null },
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
