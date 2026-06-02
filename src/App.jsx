import { useState, useRef, useEffect, useCallback } from "react";

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM = `You are the official AI intake agent for Credit Counsel Elite, a premium credit repair service operated by Brandon. You are highly intelligent, warm, and authoritative — like a knowledgeable advisor who genuinely wants clients to win.

YOUR MISSION: Extract ALL information needed to generate complete, ready-to-mail 3-bureau dispute packages. You read uploaded documents automatically and fill in everything. The client should barely have to type.

═══════════════════════════════════════════════
BRANDON'S METHODOLOGY (FOLLOW EXACTLY)
═══════════════════════════════════════════════

PHASE 1 — SETUP:
• Client must obtain MyScoreIQ report (NOT Credit Karma, NOT Experian app)
• Open a bank account if they don't have one

PHASE 2 — FIX (The Credit Sweep):
Step 1 — Freeze third-party data brokers:
  Innovis: 1-800-540-2505
  LexisNexis: 1-800-456-6004
  SageStream: 1-888-395-0277
  ARS: 1-888-456-6004

Step 2 — Backdoor bureau dispute numbers:
  Equifax (landline): 404-885-8000 | Equifax (cell): 888-548-7811
  Experian (landline): 714-830-7000 | Experian (cell): 888-397-3742
  TransUnion (landline): 610-690-4909 | TransUnion (cell): 800-916-8800

Step 3 — 10-Day Credit Sweep:
  • File FTC Identity Theft Report at IdentityTheft.gov
  • Invoke FCRA Section 605b — bureaus must block within 4 business days
  • Send certified mail dispute letters to all 3 bureaus simultaneously

PHASE 3 — BUILD:
  • Add authorized user tradelines
  • Mass apply strategy
  • Target: 800+ credit score

═══════════════════════════════════════════════
INFORMATION TO COLLECT
═══════════════════════════════════════════════

Extract from documents when uploaded, ask conversationally for anything missing:
1. Full legal name (exactly as on government ID)
2. Current mailing address (street, apt, city, state, ZIP)
3. Date of birth
4. Last 4 digits of SSN only
5. Previous addresses in last 2 years (if any)
6. All disputed items per bureau — extract from credit report:
   - Company/creditor name
   - Type of inquiry or account
   - Date of inquiry
   - Which bureau it appears on
7. Confirm documents they have ready

DOCUMENT READING RULES:
- When client mentions uploading a credit report, extract ALL inquiries and negative accounts automatically
- When client uploads ID/passport, note it as confirmed
- When client uploads FTC report, extract the report number and listed companies
- Tell the client what you found: "I can see from your credit report that you have X items to dispute..."

═══════════════════════════════════════════════
LETTER TEMPLATE (USE EXACTLY — FILL ALL FIELDS)
═══════════════════════════════════════════════

[Today's Full Date]

[Client Full Name]
[Client Full Address]
[City, State ZIP]

[Bureau Name]
[Bureau Address]

RE: Formal Dispute Request — FCRA Sections 611, 623 & 605b

To Whom It May Concern:

My name is [Client Full Name] and I am writing to formally dispute inaccurate, incomplete, and/or fraudulent information appearing on my consumer credit report. Pursuant to my rights under the Fair Credit Reporting Act (FCRA), specifically Sections 611 and 623, I request a thorough investigation into each item listed below.

DISPUTED ITEMS:
[List each disputed item for THIS bureau specifically, formatted as:
- [Company Name] | [Type] | [Date] — This inquiry was not authorized by me and is believed to be fraudulent.]

Additionally, pursuant to FCRA Section 605b, I am enclosing a copy of my FTC Identity Theft Report #[FTC Report Number if known, otherwise: "see enclosed"]. I hereby demand the immediate blocking and removal of all accounts, inquiries, and information resulting from identity theft, fraud, or inaccurate reporting. These items must be blocked within 4 business days of receipt of this letter.

I request that you:
1. Conduct a thorough investigation of each disputed item
2. Remove or correct all inaccurate, unverifiable, or fraudulently opened accounts
3. Provide written notice of your investigation results within 30 days
4. Send me an updated copy of my credit report reflecting all corrections

Failure to comply within the statutory timeframe is a violation of the FCRA and may result in legal action.

Respectfully,

[Client Full Name]
[Client Full Address]
Date of Birth: [DOB]
SSN: XXX-XX-[Last 4 only]

ENCLOSURES:
[ ] Government-issued photo ID (front and back)
[ ] Passport (if available)
[ ] FTC Identity Theft Report
[ ] Proof of current address (utility bill or bank statement)
[ ] Social Security card
[ ] Copy of MyScoreIQ credit report (disputed items highlighted)

Bureau mailing addresses:
Equifax: P.O. Box 740256, Atlanta, GA 30374-0256
Experian: P.O. Box 4500, Allen, TX 75013
TransUnion: P.O. Box 2000, Chester, PA 19016

PERSONAL INFORMATION CORRECTION LETTER (include with each bureau package):

[Today's Full Date]
[Client Full Name]
[Client Full Address]

[Bureau Name]
[Bureau Address]

RE: Personal Information Correction Request

To Whom It May Concern:

I am writing to update and correct my personal information on file with your organization.

Please update my records as follows:
• Full Legal Name: [Client Full Name]
• Current Address: [Client Full Address]
• Date of Birth: [DOB]
• Social Security Number: [SSN — last 4 only for this letter]

I do not wish to have any telephone numbers on my report. Please remove all addresses that are not my current address, as they are not deliverable by the U.S. Post Office and are not reportable under the FCRA since they are inaccurate.

Sincerely,
[Client Full Name]

Enclosures: Government-issued ID, Passport, SSN Card, Proof of Residence

═══════════════════════════════════════════════
FTC REPORT GUIDANCE (GENERATE FOR EACH CLIENT)
═══════════════════════════════════════════════

When generating the package, also generate a personalized FTC filing guide with:
1. Direct link: https://www.identitytheft.gov/
2. Step-by-step instructions customized to THEIR specific disputed items
3. What to write in the "Personal Statement" field based on their items
4. Which companies to list under "Accounts Affected by the Crime"
5. What to check/select for each section

═══════════════════════════════════════════════
OUTPUT FORMAT — GENERATE WHEN YOU HAVE ENOUGH INFO
═══════════════════════════════════════════════

When you have collected sufficient information (name, address, DOB, last 4 SSN, and at least some disputed items), output EXACTLY this — nothing before or after the JSON:

PACKAGE_READY:
{"clientName":"[full name]","clientAddress":"[full address]","dob":"[dob]","ssn4":"[last 4]","equifax":"[complete fully-filled Equifax letter]","experian":"[complete fully-filled Experian letter]","transunion":"[complete fully-filled TransUnion letter]","personalInfo":"[complete personal info correction letter — same for all 3 bureaus]","ftcGuide":"[personalized step-by-step FTC filing guide with link and their specific items listed]","disputeItems":{"experian":["item1","item2"],"transunion":["item1","item2"],"equifax":["item1"]},"checklist":["Government-issued photo ID (front and back)","Passport copy (front page)","FTC Identity Theft Report (print from IdentityTheft.gov after filing)","Proof of current address — utility bill or bank statement (within 60 days)","Social Security card","Copy of MyScoreIQ credit report with disputed items highlighted","USPS Certified Mail receipts (keep all copies)"],"brandonsNotes":"[2-3 sentence quick review note for Brandon flagging anything unusual or worth double-checking]"}

CONVERSATION RULES:
- Be warm, encouraging, professional — high-ticket service
- Use client's first name once you have it  
- Keep responses SHORT and focused — max 3 short paragraphs
- After reading documents, immediately summarize what you found
- Never ask for info you already extracted from uploaded documents
- When ready, tell them: "I have everything I need — generating your package now..."`;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const BUREAUS = [
  { key: "equifax",    label: "Equifax",     accent: "#C41E3A", bg: "#fff5f5" },
  { key: "experian",   label: "Experian",    accent: "#00478C", bg: "#f0f5ff" },
  { key: "transunion", label: "TransUnion",  accent: "#1D5BA6", bg: "#f0f5ff" },
];

const GUIDE_PHASES = [
  { phase: "PHASE 1", color: "#1D5BA6", title: "Get Your MyScoreIQ Report", body: "Pull your credit report from MyScoreIQ.com — not Credit Karma or the Experian app. MyScoreIQ shows all 3 bureaus with real FICO scores. Screenshot or print every negative item. This is your source of truth." },
  { phase: "PHASE 2 · Step 1", color: "#7C3AED", title: "Freeze the Data Brokers", body: "Call all four and place a security freeze before sending letters:\n• Innovis: 1-800-540-2505\n• LexisNexis: 1-800-456-6004\n• SageStream: 1-888-395-0277\n• ARS: 1-888-456-6004\n\nThis stops new negative data from being fed to bureaus during your dispute window." },
  { phase: "PHASE 2 · Step 2", color: "#D97706", title: "File Your FTC Identity Theft Report", body: "Go to IdentityTheft.gov and file your report. The app will generate your personalized step-by-step guide based on your specific disputed items. Download the official PDF — this is the legal document that triggers FCRA 605b." },
  { phase: "PHASE 2 · Step 3", color: "#059669", title: "Mail Your Dispute Letters", body: "Send all 3 bureau letters via USPS Certified Mail with Return Receipt on the same day. Keep every receipt and tracking number. Bureaus have 30 days to respond — 45 days if you submit additional evidence." },
  { phase: "PHASE 2 · Step 4", color: "#C41E3A", title: "Call the Backdoor Numbers", body: "Equifax: 404-885-8000 (landline) / 888-548-7811 (cell)\nExperian: 714-830-7000 (landline) / 888-397-3742 (cell)\nTransUnion: 610-690-4909 (landline) / 800-916-8800 (cell)\n\nCall each bureau's internal dispute line, reference your certified mail tracking number to reinforce your written dispute." },
  { phase: "PHASE 3", color: "#0B2060", title: "Build to 800+", body: "After disputes clear (60–90 days):\n• Brandon adds authorized user tradelines with aged, perfect-history accounts\n• Mass apply strategy for new revolving credit\n• Systematic score optimization toward 800+\n\nConsistency and patience are your biggest tools from here." },
];

export default function App() {
  const [tab,       setTab]       = useState(0);
  const [messages,  setMessages]  = useState([]);
  const [history,   setHistory]   = useState([]);
  const [input,     setInput]     = useState("");
  const [busy,      setBusy]      = useState(false);
  const [pkg,       setPkg]       = useState(null);   // full package object
  const [docTab,    setDocTab]    = useState("equifax");
  const [copied,    setCopied]    = useState("");
  const [progress,  setProgress]  = useState(0);
  const [statusTxt, setStatusTxt] = useState("Waiting to begin");
  const [uploads,   setUploads]   = useState([]);
  const [approved,  setApproved]  = useState(false);
  const [brandonOpen, setBrandonOpen] = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const fileRef   = useRef(null);
  const ready     = !!pkg;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => { initAgent(); }, []);

  async function callAPI(msgs, maxTok = 900) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTok,
        system: SYSTEM,
        messages: msgs,
      }),
    });
    if (!res.ok) throw new Error(res.status);
    const d = await res.json();
    return d.content?.[0]?.text || "";
  }

  async function initAgent() {
    setBusy(true);
    setStatusTxt("Starting intake...");
    const init = [{ role: "user", content: "START_INTAKE" }];
    try {
      const txt = await callAPI(init, 500);
      setHistory([...init, { role: "assistant", content: txt }]);
      setMessages([{ from: "agent", text: txt }]);
      setProgress(5);
      setStatusTxt("Collecting client information");
    } catch {
      const fallback = "Hey! Welcome to Credit Counsel Elite.\n\nI'm your AI intake agent — I'll handle all the heavy lifting so your dispute package is ready to mail with zero stress.\n\nYou can start by uploading your credit report, or just tell me your full legal name and we'll go from there. What works best for you?";
      setHistory([{ role: "user", content: "START_INTAKE" }, { role: "assistant", content: fallback }]);
      setMessages([{ from: "agent", text: fallback }]);
      setProgress(5);
      setStatusTxt("Collecting client information");
    }
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 200);
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
    setProgress(Math.min(85, 5 + turns * 10));
    if (turns === 1) setStatusTxt("Collecting personal info");
    else if (turns === 3) setStatusTxt("Gathering dispute details");
    else if (turns === 5) setStatusTxt("Confirming documents");
    else if (turns >= 6) setStatusTxt("Finalizing package...");

    try {
      const txt = await callAPI(newHist, 4000);
      const updHist = [...newHist, { role: "assistant", content: txt }];
      setHistory(updHist);

      if (txt.includes("PACKAGE_READY:")) {
        setProgress(95); setStatusTxt("Generating package…");
        try {
          const jsonStr = txt.split("PACKAGE_READY:")[1].trim();
          const parsed = JSON.parse(jsonStr);
          setPkg(parsed);
          setProgress(100);
          setStatusTxt("Package complete — pending Brandon's review");
          setMessages(prev => [...prev, {
            from: "agent",
            text: `✅ Package generated for ${parsed.clientName}!\n\nAll 3 bureau letters, a personal info correction letter, your personalized FTC filing guide, and a document checklist are ready.\n\nTap "Dispute Package" to review everything. Brandon will do a quick review before you print and mail. You're almost there! 💪`,
          }]);
          setTimeout(() => { setTab(1); setBrandonOpen(true); }, 1600);
        } catch {
          setMessages(prev => [...prev, { from: "agent", text: txt.replace("PACKAGE_READY:", "").trim() }]);
        }
      } else {
        setMessages(prev => [...prev, { from: "agent", text: txt }]);
      }
    } catch {
      setMessages(prev => [...prev, { from: "agent", text: "Connection issue — please try again." }]);
    }
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Read file contents
    const fileData = await Promise.all(files.map(f => new Promise(res => {
      const reader = new FileReader();
      reader.onload = ev => res({ name: f.name, type: f.type, size: f.size, data: ev.target.result });
      reader.readAsDataURL(f);
    })));

    setUploads(prev => [...prev, ...files.map(f => ({ name: f.name, size: f.size }))]);

    const names = files.map(f => f.name).join(", ");
    setMessages(prev => [...prev, { from: "user", text: `📎 Uploaded: ${names}` }]);
    setBusy(true);
    setStatusTxt("Reading documents...");

    // Build content blocks for API
    const contentBlocks = [];
    for (const fd of fileData) {
      if (fd.type === "application/pdf") {
        contentBlocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: fd.data.split(",")[1] } });
      } else if (fd.type.startsWith("image/")) {
        contentBlocks.push({ type: "image", source: { type: "base64", media_type: fd.type, data: fd.data.split(",")[1] } });
      }
    }
    contentBlocks.push({ type: "text", text: `I have uploaded the following files: ${names}. Please read them carefully, extract all relevant information (personal details, disputed inquiries, account info, FTC report number if present), tell me what you found, and ask for anything still needed to complete the package.` });

    const newHist = [...history, { role: "user", content: contentBlocks }];
    setHistory(newHist);

    try {
      const txt = await callAPI(newHist, 4000);
      const updHist = [...newHist, { role: "assistant", content: txt }];
      setHistory(updHist);

      if (txt.includes("PACKAGE_READY:")) {
        setProgress(95);
        try {
          const jsonStr = txt.split("PACKAGE_READY:")[1].trim();
          const parsed = JSON.parse(jsonStr);
          setPkg(parsed);
          setProgress(100);
          setStatusTxt("Package complete — pending Brandon's review");
          setMessages(prev => [...prev, { from: "agent", text: `✅ Package auto-generated from your documents! All 3 bureau letters are ready. Tap "Dispute Package" above to review. Brandon will do a quick review before you print and mail.` }]);
          setTimeout(() => { setTab(1); setBrandonOpen(true); }, 1400);
        } catch {
          setMessages(prev => [...prev, { from: "agent", text: txt.replace("PACKAGE_READY:", "").trim() }]);
        }
      } else {
        setMessages(prev => [...prev, { from: "agent", text: txt }]);
        setProgress(prev => Math.min(80, prev + 15));
        setStatusTxt("Documents read — gathering remaining info");
      }
    } catch {
      setMessages(prev => [...prev, { from: "agent", text: "I had trouble reading those files. Please try again or type the information manually." }]);
    }
    setBusy(false);
    inputRef.current?.focus();
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(""), 2200); });
  }

  function printAll() {
    if (!pkg) return;
    const w = window.open("", "_blank");
    let body = "";

    // Dispute letters
    BUREAUS.forEach((b, i) => {
      if (pkg[b.key]) body += `<div class="sec"><h2 style="color:${b.accent}">${b.label} — Dispute Letter</h2><pre>${pkg[b.key]}</pre></div>${i < 2 ? '<div class="pb"></div>' : ""}`;
    });

    // Personal info correction
    if (pkg.personalInfo) body += `<div class="pb"></div><div class="sec"><h2>Personal Information Correction Letter</h2><p style="font-size:12px;color:#888">Include one copy in EACH bureau envelope</p><pre>${pkg.personalInfo}</pre></div>`;

    // FTC Guide
    if (pkg.ftcGuide) body += `<div class="pb"></div><div class="sec"><h2 style="color:#D97706">FTC Identity Theft Report — Filing Guide</h2><pre>${pkg.ftcGuide}</pre></div>`;

    // Checklist
    if (pkg.checklist?.length) body += `<div class="pb"></div><div class="sec"><h2>Document Checklist</h2><ul>${pkg.checklist.map(c => `<li>${c}</li>`).join("")}</ul></div>`;

    w.document.write(`<!DOCTYPE html><html><head><title>Credit Counsel Elite — ${pkg.clientName || "Dispute Package"}</title>
      <style>body{font-family:Georgia,serif;max-width:740px;margin:40px auto;padding:0 24px;color:#111;line-height:1.85}h1{color:#0B2060}.sub{color:#888;font-size:12px;margin-bottom:32px}h2{border-bottom:2px solid;padding-bottom:8px;margin-bottom:16px}.sec{margin-bottom:48px}.pb{page-break-after:always;margin:48px 0;border-top:2px dashed #ddd}pre{white-space:pre-wrap;font-size:12px;line-height:1.9;font-family:Georgia,serif}ul{line-height:2.2;font-size:13px}@media print{.pb{page-break-after:always}}</style>
    </head><body>
      <h1>Credit Counsel Elite</h1>
      <div class="sub">3-Bureau Dispute Package — Generated ${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
      ${body}
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  }

  const pct = progress;

  // Doc subtab options
  const docTabs = [
    ...BUREAUS.map(b => ({ key: b.key, label: b.label, color: b.accent })),
    { key: "personalInfo", label: "Personal Info", color: "#444" },
    { key: "ftcGuide", label: "FTC Guide", color: "#D97706" },
    { key: "checklist", label: "✓ Checklist", color: "#059669" },
  ];

  return (
    <div style={{fontFamily:"'DM Sans','Helvetica Neue',Arial,sans-serif",height:"100vh",display:"flex",flexDirection:"column",background:"#F4F2EC",color:"#111",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#ccc;border-radius:2px}
        .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#bbb;animation:bounce 1.1s ease infinite;margin:0 2px}
        @keyframes bounce{0%,100%{transform:translateY(0);opacity:.3}45%{transform:translateY(-6px);opacity:1}}
        @keyframes pulse{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .navBtn:hover{color:rgba(255,255,255,.95)!important}
        .chatInput:focus{border-color:#0B2060!important;box-shadow:0 0 0 3px rgba(11,32,96,.1)}
        .sendBtn:hover:not(:disabled){transform:scale(1.06)}
        .sendBtn:active:not(:disabled){transform:scale(.94)}
        .uploadZone:hover{border-color:#0B2060;background:#faf9ff}
        .tabBtn:hover{opacity:.85}
        .actionBtn:hover{opacity:.82}
        .emptyBtn:hover{background:#1a3fa0}
        .msgIn{animation:fadeIn .25s ease}
        .brandonModal{position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;z-index:100}
        .brandonSheet{background:#fff;border-radius:16px 16px 0 0;padding:24px;width:100%;max-height:72vh;overflow-y:auto}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{background:"#0E2A6E",display:"flex",alignItems:"stretch",flexShrink:0,minHeight:90,position:"relative"}}>
        <div style={{background:"#0B2060",padding:"14px 18px",display:"flex",flexDirection:"column",justifyContent:"flex-end",minWidth:150,flexShrink:0,borderRight:"1px solid rgba(255,255,255,.08)"}}>
          <div style={{color:"#fff",fontWeight:900,fontSize:18,lineHeight:1.1,letterSpacing:"-.6px"}}>Credit<br/>Counsel<br/>Elite</div>
          <div style={{color:"rgba(255,255,255,.4)",fontSize:8,letterSpacing:"1.8px",marginTop:5,textTransform:"uppercase",fontWeight:600}}>AI Dispute Agent</div>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",flex:1,padding:"0 6px",overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
          {["Client Intake","Dispute Package","Step-by-Step Guide","My Case"].map((label,i) => (
            <button key={i} onClick={() => setTab(i)} className="navBtn" style={{background:"none",border:"none",borderBottom:tab===i?"3px solid #E8B84B":"3px solid transparent",padding:"10px 11px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:tab===i?700:400,color:tab===i?"#fff":"rgba(255,255,255,.5)",transition:"color .15s",position:"relative",whiteSpace:"nowrap"}}>
              {i===1 && ready && <span style={{position:"absolute",top:9,right:7,width:7,height:7,borderRadius:"50%",background:"#E8B84B"}}/>}
              {i===3 && ready && <span style={{position:"absolute",top:9,right:7,width:7,height:7,borderRadius:"50%",background:"#34d399"}}/>}
              {label}
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",paddingRight:14}}>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,background:ready?(approved?"rgba(16,185,129,.18)":"rgba(232,184,75,.15)"):"rgba(255,255,255,.1)",border:ready?(approved?"1px solid rgba(52,211,153,.3)":"1px solid rgba(232,184,75,.35)"):"1px solid rgba(255,255,255,.14)",color:ready?(approved?"#34d399":"#E8B84B"):"rgba(255,255,255,.75)",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:ready?(approved?"#34d399":"#E8B84B"):"#E8B84B",flexShrink:0,...(busy?{animation:"pulse 1.2s ease infinite"}:{})}}/>
            {ready ? (approved ? "Approved ✓" : "Pending review") : busy ? "Processing…" : "Intake in progress"}
          </div>
        </div>
      </div>

      {/* ── PROGRESS ── */}
      <div style={{background:"#fff",padding:"7px 20px 9px",borderBottom:"1px solid #e8e4db",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:11,color:"#888",fontWeight:500,textTransform:"uppercase",letterSpacing:".4px"}}>{statusTxt}</span>
          <span style={{fontSize:11,color:"#0B2060",fontWeight:700}}>{pct}%</span>
        </div>
        <div style={{height:4,background:"#ede9e0",borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:pct===100?"linear-gradient(90deg,#059669,#34d399)":"linear-gradient(90deg,#0B2060,#1D5BA6)",borderRadius:2,transition:"width .6s ease"}}/>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative"}}>

        {/* ══ TAB 0: CLIENT INTAKE ══ */}
        {tab === 0 && (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"11px 18px 9px",borderBottom:"1px solid #e8e4db",background:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:11,fontWeight:800,letterSpacing:"1.2px",color:"#222"}}>CLIENT INTAKE &amp; ANALYSIS</span>
              {uploads.length > 0 && <span style={{fontSize:11,color:"#059669",fontWeight:700}}>📎 {uploads.length} doc{uploads.length>1?"s":""} uploaded</span>}
            </div>

            <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
              {messages.map((m,i) => (
                <div key={i} className="msgIn" style={m.from==="user"?{display:"flex",justifyContent:"flex-end"}:{display:"flex",alignItems:"flex-start",gap:9}}>
                  {m.from==="agent" && <div style={{width:32,height:32,borderRadius:"50%",background:"#0B2060",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,letterSpacing:".5px"}}>CE</div>}
                  <div style={m.from==="agent"
                    ? {maxWidth:"83%",background:"#fff",border:"1px solid #e8e4db",borderRadius:"4px 16px 16px 16px",padding:"12px 15px",fontSize:13.5,lineHeight:1.7,color:"#1a1a1a",whiteSpace:"pre-wrap",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}
                    : {maxWidth:"75%",background:"#0B2060",borderRadius:"16px 16px 4px 16px",padding:"11px 15px",fontSize:13.5,lineHeight:1.65,color:"#fff",whiteSpace:"pre-wrap"}
                  }>{m.text}</div>
                </div>
              ))}
              {busy && (
                <div style={{display:"flex",alignItems:"flex-start",gap:9}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"#0B2060",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>CE</div>
                  <div style={{background:"#fff",border:"1px solid #e8e4db",borderRadius:"4px 16px 16px 16px",padding:"14px 16px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                    <span className="dot"/><span className="dot" style={{animationDelay:".18s"}}/><span className="dot" style={{animationDelay:".36s"}}/>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Upload zone */}
            <div className="uploadZone" onClick={() => fileRef.current?.click()} style={{margin:"0 14px 8px",border:"1.5px dashed #ccc",borderRadius:10,padding:"10px 13px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:"#fff",flexShrink:0,transition:"border-color .15s,background .15s"}}>
              <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFiles} style={{display:"none"}}/>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#222"}}>Upload Documents</div>
                <div style={{fontSize:11,color:"#999",marginTop:1}}>Credit report PDF, ID, SSN card, FTC report — AI reads & extracts automatically</div>
              </div>
              {uploads.length > 0 && <div style={{marginLeft:"auto",background:"#059669",color:"#fff",fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,flexShrink:0}}>{uploads.length} uploaded</div>}
            </div>

            {/* Input */}
            <div style={{display:"flex",gap:7,padding:"5px 14px 12px",background:"#F4F2EC",flexShrink:0,alignItems:"center"}}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key==="Enter") send(); }}
                placeholder="Type your response..."
                className="chatInput"
                disabled={busy}
                style={{flex:1,height:44,border:"1.5px solid #ddd",borderRadius:22,padding:"0 17px",fontSize:14,background:"#fff",fontFamily:"inherit",color:"#111",outline:"none",transition:"border-color .15s"}}
              />
              <button onClick={send} disabled={busy||!input.trim()} className="sendBtn" style={{width:44,height:44,borderRadius:"50%",background:"#0B2060",border:"none",cursor:busy||!input.trim()?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:busy||!input.trim()?.45:1,transition:"opacity .2s,transform .1s"}}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* ══ TAB 1: DISPUTE PACKAGE ══ */}
        {tab === 1 && (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"#fff",position:"relative"}}>
            {!ready ? (
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:40,textAlign:"center"}}>
                <div style={{fontSize:48,opacity:.22}}>📬</div>
                <div style={{fontSize:18,fontWeight:800,color:"#222"}}>No Package Yet</div>
                <div style={{fontSize:14,color:"#888",lineHeight:1.65,maxWidth:290}}>Complete the intake and upload your documents. The AI will auto-generate your full 3-bureau package.</div>
                <button onClick={() => setTab(0)} className="emptyBtn" style={{padding:"11px 28px",background:"#0B2060",color:"#fff",border:"none",borderRadius:24,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>Start Intake →</button>
              </div>
            ) : (
              <>
                {/* Sub tabs */}
                <div style={{display:"flex",borderBottom:"1px solid #eee",padding:"0 14px",flexShrink:0,overflowX:"auto"}}>
                  {docTabs.map(t => (
                    <button key={t.key} onClick={() => setDocTab(t.key)} className="tabBtn" style={{background:"none",border:"none",borderBottom:docTab===t.key?`3px solid ${t.color}`:"3px solid transparent",padding:"12px 11px 9px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:docTab===t.key?700:500,color:docTab===t.key?t.color:"#888",whiteSpace:"nowrap",transition:"color .15s"}}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div style={{flex:1,overflowY:"auto"}}>
                  {docTab === "checklist" ? (
                    <div style={{padding:"18px 20px"}}>
                      <div style={{fontSize:14,fontWeight:800,color:"#111",marginBottom:4}}>📋 Document Checklist</div>
                      <div style={{fontSize:12,color:"#888",marginBottom:16}}>Include ALL of these in each bureau envelope</div>
                      {(pkg.checklist||[]).map((item,i) => (
                        <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderBottom:"1px solid #f2f2f2"}}>
                          <div style={{width:18,height:18,borderRadius:4,border:"2px solid #0B2060",flexShrink:0,marginTop:1}}/>
                          <span style={{fontSize:13,color:"#333",lineHeight:1.5}}>{item}</span>
                        </div>
                      ))}
                      {/* Phone refs */}
                      <div style={{marginTop:18,background:"#f7f7f7",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#333",marginBottom:8}}>📞 Freeze These Data Brokers First</div>
                        {[["Innovis","1-800-540-2505"],["LexisNexis","1-800-456-6004"],["SageStream","1-888-395-0277"],["ARS","1-888-456-6004"]].map(([n,p]) => (
                          <div key={n} style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
                            <span style={{fontSize:12,color:"#666"}}>{n}</span><span style={{fontSize:12,color:"#0B2060",fontWeight:700}}>{p}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{background:"#f7f7f7",borderRadius:10,padding:"12px 14px"}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#333",marginBottom:8}}>📞 Backdoor Bureau Numbers</div>
                        {[["Equifax (landline)","404-885-8000"],["Equifax (cell)","888-548-7811"],["Experian (landline)","714-830-7000"],["Experian (cell)","888-397-3742"],["TransUnion (landline)","610-690-4909"],["TransUnion (cell)","800-916-8800"]].map(([n,p]) => (
                          <div key={n} style={{display:"flex",justifyContent:"space-between",padding:"2px 0"}}>
                            <span style={{fontSize:12,color:"#666"}}>{n}</span><span style={{fontSize:12,color:"#0B2060",fontWeight:700}}>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : docTab === "ftcGuide" ? (
                    <div style={{padding:"18px 20px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                        <div style={{fontSize:14,fontWeight:800,color:"#111"}}>FTC Identity Theft Report Guide</div>
                      </div>
                      <div style={{fontSize:12,color:"#888",marginBottom:14}}>File this at IdentityTheft.gov — personalized for your case</div>
                      <a href="https://www.identitytheft.gov" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:8,padding:"11px 14px",background:"#0B2060",borderRadius:10,color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none",marginBottom:16}}>
                        🔗 Open IdentityTheft.gov →
                      </a>
                      <pre style={{fontSize:12,lineHeight:1.9,color:"#2a2a2a",whiteSpace:"pre-wrap",fontFamily:"Georgia,serif",margin:0}}>{pkg.ftcGuide || "FTC guide will appear here after package generation."}</pre>
                    </div>
                  ) : docTab === "personalInfo" ? (
                    <div>
                      <div style={{padding:"12px 18px 8px",borderBottom:"1px solid #f2f2f2",background:"#fafafa"}}>
                        <div style={{fontSize:12,color:"#888"}}>Include one copy of this letter in <strong>each</strong> bureau envelope.</div>
                      </div>
                      <pre style={{fontSize:12,lineHeight:1.9,color:"#2a2a2a",whiteSpace:"pre-wrap",fontFamily:"Georgia,serif",padding:"16px 20px",margin:0}}>{pkg.personalInfo || ""}</pre>
                    </div>
                  ) : (
                    <pre style={{fontSize:12,lineHeight:1.9,color:"#2a2a2a",whiteSpace:"pre-wrap",fontFamily:"Georgia,serif",padding:"16px 20px",margin:0}}>{pkg[docTab] || ""}</pre>
                  )}
                </div>

                {/* Footer actions */}
                <div style={{padding:"9px 14px 13px",borderTop:"1px solid #eee",display:"flex",gap:7,flexShrink:0}}>
                  {docTab !== "checklist" && (
                    <button onClick={() => copyText(pkg[docTab]||"", docTab)} className="actionBtn" style={{flex:1,height:40,borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:"#fff",border:"1.5px solid #0B2060",color:"#0B2060",transition:"opacity .15s"}}>
                      {copied===docTab?"✓ Copied!":"Copy"}
                    </button>
                  )}
                  {!approved ? (
                    <button onClick={() => setBrandonOpen(true)} style={{flex:2,height:40,borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:"#E8B84B",border:"none",color:"#111",transition:"opacity .15s"}}>
                      ⚡ Brandon — Quick Review
                    </button>
                  ) : (
                    <button onClick={printAll} className="actionBtn" style={{flex:2,height:40,borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:"#0B2060",border:"none",color:"#fff",transition:"opacity .15s"}}>
                      Print All / Save PDF ✓
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Brandon review modal */}
            {brandonOpen && pkg && (
              <div className="brandonModal" onClick={e => { if (e.target === e.currentTarget) setBrandonOpen(false); }}>
                <div className="brandonSheet">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:800,color:"#111"}}>⚡ Brandon's Review</div>
                      <div style={{fontSize:12,color:"#888",marginTop:2}}>Quick check before client prints and mails</div>
                    </div>
                    <button onClick={() => setBrandonOpen(false)} style={{background:"#f2f2f2",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:13,color:"#555"}}>✕</button>
                  </div>

                  {/* Client summary */}
                  <div style={{background:"#f7f8ff",borderRadius:10,padding:"12px 14px",marginBottom:14,border:"1px solid #e8eaff"}}>
                    <div style={{fontSize:11,fontWeight:800,letterSpacing:".5px",color:"#0B2060",marginBottom:8,textTransform:"uppercase"}}>Client Summary</div>
                    {[["Name",pkg.clientName||"—"],["Address",pkg.clientAddress||"—"],["DOB",pkg.dob||"—"],["SSN Last 4",pkg.ssn4?"XXXX-XX-"+pkg.ssn4:"—"]].map(([k,v]) => (
                      <div key={k} style={{display:"flex",gap:8,padding:"3px 0"}}>
                        <span style={{fontSize:12,color:"#888",minWidth:80}}>{k}</span>
                        <span style={{fontSize:12,color:"#111",fontWeight:600}}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Disputed items per bureau */}
                  {pkg.disputeItems && (
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:800,letterSpacing:".5px",color:"#333",marginBottom:8,textTransform:"uppercase"}}>Disputed Items Extracted</div>
                      {BUREAUS.map(b => pkg.disputeItems[b.key]?.length > 0 && (
                        <div key={b.key} style={{marginBottom:8}}>
                          <div style={{fontSize:12,fontWeight:700,color:b.accent,marginBottom:4}}>{b.label}</div>
                          {pkg.disputeItems[b.key].map((item,i) => (
                            <div key={i} style={{fontSize:12,color:"#555",padding:"2px 0 2px 10px",borderLeft:`2px solid ${b.accent}`}}>{item}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Brandon's AI note */}
                  {pkg.brandonsNotes && (
                    <div style={{background:"#fffbea",border:"1px solid #f0d88a",borderRadius:10,padding:"11px 13px",marginBottom:16}}>
                      <div style={{fontSize:11,fontWeight:800,color:"#B45309",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"}}>⚠ AI Notes for Brandon</div>
                      <div style={{fontSize:12,color:"#78350F",lineHeight:1.65}}>{pkg.brandonsNotes}</div>
                    </div>
                  )}

                  <div style={{display:"flex",gap:8}}>
                    <button onClick={() => { setBrandonOpen(false); setTab(0); }} style={{flex:1,height:42,borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:"#fff",border:"1.5px solid #ddd",color:"#555"}}>
                      Request Edit
                    </button>
                    <button onClick={() => { setApproved(true); setBrandonOpen(false); }} style={{flex:2,height:42,borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:"#059669",border:"none",color:"#fff"}}>
                      ✓ Approve &amp; Send to Client
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB 2: GUIDE ══ */}
        {tab === 2 && (
          <div style={{flex:1,overflowY:"auto",background:"#F4F2EC",paddingBottom:28}}>
            <div style={{padding:"18px 18px 13px",background:"#fff",borderBottom:"1px solid #e8e4db"}}>
              <div style={{fontSize:15,fontWeight:800,color:"#111",letterSpacing:"-.3px"}}>Brandon's Credit Sweep System</div>
              <div style={{fontSize:12,color:"#888",marginTop:3}}>Follow these steps in order — sequence matters.</div>
            </div>
            {GUIDE_PHASES.map((g,i) => (
              <div key={i} style={{background:"#fff",margin:"11px 14px 0",borderRadius:12,padding:"15px 17px 17px",border:"1px solid #e8e4db",position:"relative"}}>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:"1px",textTransform:"uppercase",color:g.color,marginBottom:4}}>{g.phase}</div>
                <div style={{fontSize:15,fontWeight:800,color:"#111",marginBottom:7,letterSpacing:"-.2px"}}>{g.title}</div>
                <div style={{fontSize:13,color:"#444",lineHeight:1.72,whiteSpace:"pre-line"}}>{g.body}</div>
                {i < GUIDE_PHASES.length-1 && <div style={{position:"absolute",left:"50%",bottom:-12,width:1,height:12,background:"#ddd"}}/>}
              </div>
            ))}
          </div>
        )}

        {/* ══ TAB 3: MY CASE ══ */}
        {tab === 3 && (
          <div style={{flex:1,overflowY:"auto",background:"#F4F2EC",paddingBottom:32}}>

            {/* Hero status card */}
            <div style={{background: approved ? "linear-gradient(135deg,#059669,#047857)" : ready ? "linear-gradient(135deg,#0B2060,#1D5BA6)" : "linear-gradient(135deg,#374151,#1f2937)", padding:"24px 18px 20px", marginBottom:0}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <div style={{width:48,height:48,borderRadius:"50%",background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                  {approved ? "✅" : ready ? "📋" : "⏳"}
                </div>
                <div>
                  <div style={{color:"rgba(255,255,255,.7)",fontSize:11,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",marginBottom:3}}>
                    {approved ? "Package Approved" : ready ? "Pending Brandon's Review" : "Intake In Progress"}
                  </div>
                  <div style={{color:"#fff",fontSize:18,fontWeight:800,letterSpacing:"-.4px"}}>
                    {pkg?.clientName || "Your Credit Case"}
                  </div>
                </div>
              </div>

              {/* Status timeline */}
              {[
                { label: "Intake Started",       done: progress > 5,   active: !ready },
                { label: "Documents Uploaded",   done: uploads.length > 0, active: progress > 5 && uploads.length === 0 },
                { label: "Package Generated",    done: ready,          active: progress > 60 && !ready },
                { label: "Brandon's Review",     done: approved,       active: ready && !approved },
                { label: "Ready to Mail",        done: approved,       active: false },
              ].map((s, i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom: i < 4 ? 8 : 0}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background: s.done ? "#34d399" : s.active ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,fontWeight:800,color: s.done ? "#fff" : "transparent",border: s.active ? "2px solid rgba(255,255,255,.6)" : "none"}}>
                    {s.done ? "✓" : ""}
                  </div>
                  {i < 4 && <div style={{position:"absolute",left:27,width:2,height:8,background:"rgba(255,255,255,.1)",marginTop:28}}/>}
                  <span style={{fontSize:12,color: s.done ? "rgba(255,255,255,.9)" : s.active ? "#fff" : "rgba(255,255,255,.45)",fontWeight: s.active ? 700 : 400}}>
                    {s.label}
                    {s.active && <span style={{marginLeft:6,fontSize:10,background:"rgba(255,255,255,.2)",padding:"1px 7px",borderRadius:10,letterSpacing:".3px"}}>NOW</span>}
                  </span>
                </div>
              ))}
            </div>

            {/* Profile card */}
            {pkg ? (
              <div style={{margin:"14px 14px 0",background:"#fff",borderRadius:12,border:"1px solid #e8e4db",overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,fontWeight:800,color:"#111",letterSpacing:".3px",textTransform:"uppercase"}}>Your Profile</span>
                  <span style={{fontSize:11,color:"#888"}}>Verified ✓</span>
                </div>
                {[
                  ["Full Name",    pkg.clientName   || "—"],
                  ["Address",      pkg.clientAddress|| "—"],
                  ["Date of Birth",pkg.dob          || "—"],
                  ["SSN on File",  pkg.ssn4 ? "XXX-XX-" + pkg.ssn4 : "—"],
                ].map(([k,v]) => (
                  <div key={k} style={{display:"flex",padding:"10px 16px",borderBottom:"1px solid #f7f7f7"}}>
                    <span style={{fontSize:12,color:"#888",minWidth:110,flexShrink:0}}>{k}</span>
                    <span style={{fontSize:13,color:"#111",fontWeight:600}}>{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{margin:"14px 14px 0",background:"#fff",borderRadius:12,border:"1px solid #e8e4db",padding:"20px 16px",textAlign:"center"}}>
                <div style={{fontSize:13,color:"#888",lineHeight:1.6}}>Complete your intake to see your profile here.</div>
                <button onClick={() => setTab(0)} style={{marginTop:12,padding:"9px 22px",background:"#0B2060",color:"#fff",border:"none",borderRadius:20,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Start Intake →</button>
              </div>
            )}

            {/* Documents uploaded */}
            <div style={{margin:"12px 14px 0",background:"#fff",borderRadius:12,border:"1px solid #e8e4db",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:12,fontWeight:800,color:"#111",letterSpacing:".3px",textTransform:"uppercase"}}>Documents</span>
                <button onClick={() => { setTab(0); setTimeout(() => fileRef.current?.click(), 300); }} style={{fontSize:11,color:"#0B2060",fontWeight:700,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>+ Add More</button>
              </div>
              {uploads.length === 0 ? (
                <div style={{padding:"16px",textAlign:"center"}}>
                  <div style={{fontSize:12,color:"#aaa",marginBottom:10}}>No documents uploaded yet</div>
                  <button onClick={() => { setTab(0); setTimeout(() => fileRef.current?.click(), 300); }} style={{padding:"8px 18px",background:"#f4f2ec",color:"#0B2060",border:"1.5px dashed #ccc",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Upload Documents</button>
                </div>
              ) : (
                uploads.map((f,i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom: i < uploads.length-1 ? "1px solid #f7f7f7" : "none"}}>
                    <div style={{width:34,height:34,borderRadius:8,background:"#f0f5ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                      {f.name.includes("pdf") || f.name.includes("PDF") ? "📄" : f.name.toLowerCase().includes("ftc") || f.name.toLowerCase().includes("identity") ? "🛡️" : f.name.toLowerCase().includes("credit") || f.name.toLowerCase().includes("report") ? "📊" : "🪪"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
                      <div style={{fontSize:11,color:"#aaa",marginTop:1}}>{f.size ? Math.round(f.size/1024) + " KB" : ""}</div>
                    </div>
                    <div style={{width:22,height:22,borderRadius:"50%",background:"#e8fff4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#059669",fontWeight:800,flexShrink:0}}>✓</div>
                  </div>
                ))
              )}
            </div>

            {/* Dispute summary */}
            {pkg?.disputeItems && (
              <div style={{margin:"12px 14px 0",background:"#fff",borderRadius:12,border:"1px solid #e8e4db",overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:"1px solid #f0f0f0"}}>
                  <span style={{fontSize:12,fontWeight:800,color:"#111",letterSpacing:".3px",textTransform:"uppercase"}}>Disputed Items</span>
                </div>
                {BUREAUS.map(b => {
                  const items = pkg.disputeItems[b.key] || [];
                  if (!items.length) return null;
                  return (
                    <div key={b.key} style={{padding:"10px 16px",borderBottom:"1px solid #f7f7f7"}}>
                      <div style={{fontSize:11,fontWeight:800,color:b.accent,marginBottom:7,textTransform:"uppercase",letterSpacing:".5px"}}>{b.label} — {items.length} item{items.length>1?"s":""}</div>
                      {items.map((item,j) => (
                        <div key={j} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom: j < items.length-1 ? 6 : 0}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:b.accent,flexShrink:0,marginTop:5}}/>
                          <span style={{fontSize:12,color:"#444",lineHeight:1.5}}>{item}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Next steps */}
            <div style={{margin:"12px 14px 0",background:"#fff",borderRadius:12,border:"1px solid #e8e4db",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid #f0f0f0"}}>
                <span style={{fontSize:12,fontWeight:800,color:"#111",letterSpacing:".3px",textTransform:"uppercase"}}>Your Next Steps</span>
              </div>
              {[
                { done: uploads.length > 0,  icon:"📎", label:"Upload your documents",       sub:"Credit report, ID, SSN card, utility bill",    action:() => { setTab(0); setTimeout(()=>fileRef.current?.click(),300); }, btnLabel:"Upload" },
                { done: ready,               icon:"📋", label:"Package generated",            sub:"AI has built your 3-bureau dispute letters",   action:() => setTab(1), btnLabel:"Review" },
                { done: approved,            icon:"⚡", label:"Brandon reviews your case",   sub:"Usually within 24 hours",                      action: null, btnLabel: null },
                { done: false,               icon:"📬", label:"Print & mail your letters",   sub:"Send via USPS Certified Mail to all 3 bureaus", action:() => setTab(1), btnLabel: approved ? "Print" : null },
                { done: false,               icon:"🛡️", label:"File your FTC report",        sub:"File at IdentityTheft.gov with your specific items", action:() => { setTab(1); setDocTab("ftcGuide"); }, btnLabel: ready ? "View Guide" : null },
              ].map((s,i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom: i < 4 ? "1px solid #f7f7f7" : "none",opacity: s.done ? 0.55 : 1}}>
                  <div style={{width:36,height:36,borderRadius:10,background: s.done ? "#e8fff4" : "#f4f2ec",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{s.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#111",display:"flex",alignItems:"center",gap:6}}>
                      {s.done && <span style={{color:"#059669",fontSize:12}}>✓</span>}
                      {s.label}
                    </div>
                    <div style={{fontSize:11,color:"#999",marginTop:1}}>{s.sub}</div>
                  </div>
                  {s.btnLabel && s.action && !s.done && (
                    <button onClick={s.action} style={{padding:"6px 13px",background:"#0B2060",color:"#fff",border:"none",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
                      {s.btnLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Message Brandon */}
            <div style={{margin:"12px 14px 0",background:"#fff",borderRadius:12,border:"1px solid #e8e4db",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid #f0f0f0"}}>
                <span style={{fontSize:12,fontWeight:800,color:"#111",letterSpacing:".3px",textTransform:"uppercase"}}>Message Brandon</span>
              </div>
              <div style={{padding:"14px 16px"}}>
                <textarea
                  placeholder="Have a question or update for Brandon? Type it here..."
                  style={{width:"100%",height:80,border:"1.5px solid #e0e0e0",borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"inherit",color:"#111",resize:"none",outline:"none",background:"#fafafa"}}
                />
                <button style={{marginTop:8,width:"100%",height:40,borderRadius:10,background:"#0B2060",color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  Send Message
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
