import { useState, useRef, useEffect } from "react";

const SYSTEM = `You are the official AI intake agent for Credit Counsel Elite, a premium credit repair service operated by Brandon. You are highly intelligent, warm, and authoritative — like a knowledgeable advisor who genuinely wants clients to win.

YOUR MISSION: Extract ALL information needed to generate complete, ready-to-mail 3-bureau dispute packages. You read uploaded documents automatically and fill in everything. The client should barely have to type.

BRANDON'S METHODOLOGY:

PHASE 1 — SETUP:
• Client must obtain MyScoreIQ report (NOT Credit Karma, NOT Experian app)
• Open a bank account if needed

PHASE 2 — FIX:
Step 1 — Freeze data brokers: Innovis 1-800-540-2505, LexisNexis 1-800-456-6004, SageStream 1-888-395-0277, ARS 1-888-456-6004
Step 2 — Backdoor bureau numbers: Equifax 404-885-8000 / 888-548-7811, Experian 714-830-7000 / 888-397-3742, TransUnion 610-690-4909 / 800-916-8800
Step 3 — File FTC Identity Theft Report at IdentityTheft.gov, invoke FCRA 605b, send certified mail to all 3 bureaus

PHASE 3 — BUILD: Authorized user tradelines, mass apply strategy, target 800+

COLLECT (one at a time, conversationally):
1. Full legal name, current address, DOB, last 4 SSN
2. Previous addresses (last 2 years)
3. Disputed items per bureau from credit report
4. Documents they have ready

LETTER FORMAT for each bureau:
[Date]
[Client Name]
[Client Address]

[Bureau Name & Address]

RE: Formal Dispute — FCRA Sections 611, 623 & 605b

To Whom It May Concern:

My name is [Name]. I am formally disputing inaccurate, incomplete, and/or fraudulent information on my credit report under FCRA Sections 611 and 623.

DISPUTED ITEMS:
[List each item with name, type, date, reason]

Under FCRA Section 605b and my enclosed FTC Identity Theft Report #[number], I demand immediate blocking of all fraudulent items within 4 business days.

I request: full investigation, removal of unverifiable items, written results within 30 days, updated credit report.

Respectfully,
[Name] | [Address] | DOB: [DOB] | SSN: XXX-XX-[last4]

ENCLOSURES: Government ID, Passport, FTC Report, Proof of Address, SSN Card, MyScoreIQ Report

Bureau addresses: Equifax P.O. Box 740256 Atlanta GA 30374 | Experian P.O. Box 4500 Allen TX 75013 | TransUnion P.O. Box 2000 Chester PA 19016

RULES:
- Warm, professional, concise — high-ticket service
- Use first name once you have it
- ONE question at a time
- After reading docs, summarize what you found immediately
- Never re-ask for info already in documents

When ready output EXACTLY (nothing else):
PACKAGE_READY:
{"clientName":"","clientAddress":"","dob":"","ssn4":"","equifax":"[full letter]","experian":"[full letter]","transunion":"[full letter]","personalInfo":"[personal info correction letter]","ftcGuide":"[personalized FTC filing guide with https://www.identitytheft.gov/ link and step by step for their specific items]","disputeItems":{"equifax":[],"experian":[],"transunion":[]},"checklist":["Government-issued photo ID (front and back)","Passport copy","FTC Identity Theft Report from IdentityTheft.gov","Proof of current address (utility bill within 60 days)","Social Security card","MyScoreIQ credit report with disputed items highlighted","USPS Certified Mail receipts"],"brandonsNotes":"[2-3 sentences flagging anything unusual for Brandon to review]"}`;

const BUREAUS = [
  { key: "equifax",     label: "Equifax",     color: "#B91C1C" },
  { key: "experian",    label: "Experian",    color: "#1E40AF" },
  { key: "transunion",  label: "TransUnion",  color: "#1D4ED8" },
];

const GUIDE = [
  { phase: "Phase 1", color: "#1E40AF", title: "Get Your MyScoreIQ Report", body: "Pull your credit report from MyScoreIQ.com — not Credit Karma or the Experian app. MyScoreIQ shows all 3 bureaus with real FICO scores. Print or screenshot every negative item before we begin." },
  { phase: "Phase 2 · Step 1", color: "#6D28D9", title: "Freeze the Data Brokers", body: "Call all four and place a security freeze:\n• Innovis: 1-800-540-2505\n• LexisNexis: 1-800-456-6004\n• SageStream: 1-888-395-0277\n• ARS: 1-888-456-6004\n\nThis stops new negative data from feeding into the bureaus while your disputes are in progress." },
  { phase: "Phase 2 · Step 2", color: "#D97706", title: "File Your FTC Identity Theft Report", body: "Go to IdentityTheft.gov and file your report. Download the official PDF — this invokes FCRA Section 605b, requiring bureaus to block disputed items within 4 business days of receipt." },
  { phase: "Phase 2 · Step 3", color: "#059669", title: "Mail Your Dispute Letters", body: "Send all 3 bureau letters via USPS Certified Mail with Return Receipt on the same day. Keep every receipt. Bureaus have 30 days to respond — 45 if you submit additional info after the initial dispute." },
  { phase: "Phase 2 · Step 4", color: "#DC2626", title: "Call the Backdoor Numbers", body: "Equifax: 404-885-8000 (landline) · 888-548-7811 (cell)\nExperian: 714-830-7000 (landline) · 888-397-3742 (cell)\nTransUnion: 610-690-4909 (landline) · 800-916-8800 (cell)\n\nCall each bureau's internal line and reference your certified mail tracking number." },
  { phase: "Phase 3", color: "#0F172A", title: "Build to 800+", body: "After disputes clear (60–90 days), Brandon guides you through:\n• Adding authorized user tradelines with aged, perfect-history accounts\n• Mass apply strategy for new revolving credit\n• Score optimization toward 800+\n\nConsistency wins this game." },
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
  const [approved,    setApproved]    = useState(false);
  const [showReview,  setShowReview]  = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const fileRef   = useRef(null);
  const ready     = !!pkg;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => { initAgent(); }, []);

  async function callAPI(msgs, maxTok = 900) {
    let res;
    try {
      res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model: "claude-sonnet-4-20250514", 
          max_tokens: maxTok, 
          system: SYSTEM, 
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
      setHistory([...init, { role: "assistant", content: txt }]);
      setMessages([{ from: "agent", text: txt }]);
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
      const txt = await callAPI(newHist, 4000);
      const updHist = [...newHist, { role: "assistant", content: txt }];
      setHistory(updHist);
      if (txt.includes("PACKAGE_READY:")) {
        setProgress(95); setStatusTxt("Generating package…");
        try {
          const json = JSON.parse(txt.split("PACKAGE_READY:")[1].trim());
          setPkg(json);
          setProgress(100);
          setStatusTxt("Package complete");
          setMessages(prev => [...prev, { from: "agent", text: `Your complete 3-bureau dispute package is ready, ${json.clientName?.split(" ")[0] || ""}! Tap "Package" above to review all letters. Brandon will do a quick review before you print and mail. You're almost there 💪` }]);
          setTimeout(() => { setTab(1); setShowReview(true); }, 1800);
        } catch { setMessages(prev => [...prev, { from: "agent", text: txt.replace("PACKAGE_READY:", "").trim() }]); }
      } else {
        setMessages(prev => [...prev, { from: "agent", text: txt }]);
      }
    } catch (e) {
      console.error("send error:", e.message);
      setMessages(prev => [...prev, { from: "agent", text: "Error: " + e.message + "\n\nPlease screenshot this and send to support." }]);
    }
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const fileData = await Promise.all(files.map(f => new Promise(res => {
      const r = new FileReader();
      r.onload = ev => res({ name: f.name, type: f.type, size: f.size, data: ev.target.result });
      r.readAsDataURL(f);
    })));
    setUploads(prev => [...prev, ...files.map(f => ({ name: f.name, size: f.size }))]);
    setMessages(prev => [...prev, { from: "user", text: `📎 Uploaded: ${files.map(f => f.name).join(", ")}` }]);
    setBusy(true);
    setStatusTxt("Reading documents...");
    const blocks = [];
    for (const fd of fileData) {
      if (fd.type === "application/pdf") blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: fd.data.split(",")[1] } });
      else if (fd.type.startsWith("image/")) blocks.push({ type: "image", source: { type: "base64", media_type: fd.type, data: fd.data.split(",")[1] } });
    }
    blocks.push({ type: "text", text: `I uploaded: ${files.map(f => f.name).join(", ")}. Please read carefully, extract all info, tell me what you found, and ask for anything still needed.` });
    const newHist = [...history, { role: "user", content: blocks }];
    setHistory(newHist);
    try {
      const txt = await callAPI(newHist, 4000);
      const updHist = [...newHist, { role: "assistant", content: txt }];
      setHistory(updHist);
      if (txt.includes("PACKAGE_READY:")) {
        try {
          const json = JSON.parse(txt.split("PACKAGE_READY:")[1].trim());
          setPkg(json); setProgress(100); setStatusTxt("Package complete");
          setMessages(prev => [...prev, { from: "agent", text: `Package auto-generated from your documents! Tap "Package" above to review.` }]);
          setTimeout(() => { setTab(1); setShowReview(true); }, 1400);
        } catch { setMessages(prev => [...prev, { from: "agent", text: txt.replace("PACKAGE_READY:", "").trim() }]); }
      } else {
        setMessages(prev => [...prev, { from: "agent", text: txt }]);
        setProgress(prev => Math.min(80, prev + 15));
        setStatusTxt("Documents read — continuing intake");
      }
    } catch (e) { setMessages(prev => [...prev, { from: "agent", text: "Error reading files: " + e.message }]); }
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
    BUREAUS.forEach((b, i) => { if (pkg[b.key]) body += `<div class="sec"><h2 style="color:${b.color}">${b.label}</h2><pre>${pkg[b.key]}</pre></div>${i < 2 ? '<div class="pb"></div>' : ""}`; });
    if (pkg.personalInfo) body += `<div class="pb"></div><div class="sec"><h2>Personal Information Correction</h2><pre>${pkg.personalInfo}</pre></div>`;
    if (pkg.ftcGuide) body += `<div class="pb"></div><div class="sec"><h2>FTC Filing Guide</h2><pre>${pkg.ftcGuide}</pre></div>`;
    if (pkg.checklist?.length) body += `<div class="pb"></div><div class="sec"><h2>Document Checklist</h2><ul>${pkg.checklist.map(c => `<li>${c}</li>`).join("")}</ul></div>`;
    w.document.write(`<!DOCTYPE html><html><head><title>Credit Counsel Elite</title><style>body{font-family:Georgia,serif;max-width:740px;margin:40px auto;padding:0 24px;color:#111;line-height:1.85}h1{color:#0f172a}.sub{color:#888;font-size:12px;margin-bottom:32px}h2{border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-bottom:16px}.sec{margin-bottom:48px}.pb{page-break-after:always;margin:48px 0;border-top:2px dashed #e2e8f0}pre{white-space:pre-wrap;font-size:12px;line-height:1.9;font-family:Georgia,serif}ul{line-height:2.2;font-size:13px}@media print{.pb{page-break-after:always}}</style></head><body><h1>Credit Counsel Elite</h1><div class="sub">Dispute Package — ${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>${body}</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 400);
  }

  const docTabs = [
    ...BUREAUS.map(b => ({ key: b.key, label: b.label, color: b.color })),
    { key: "personalInfo", label: "Personal Info", color: "#374151" },
    { key: "ftcGuide",     label: "FTC Guide",     color: "#D97706" },
    { key: "checklist",    label: "Checklist",     color: "#059669" },
  ];

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
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: ready ? (approved ? "rgba(16,185,129,.15)" : "rgba(234,179,8,.12)") : "rgba(255,255,255,.06)", border: `1px solid ${ready ? (approved ? "rgba(52,211,153,.25)" : "rgba(234,179,8,.3)") : "rgba(255,255,255,.1)"}` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: ready ? (approved ? "#34d399" : "#fbbf24") : "#64748b", flexShrink: 0, ...(busy ? { animation: "pulse 1.2s ease infinite" } : {}) }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: ready ? (approved ? "#34d399" : "#fbbf24") : "#94a3b8", letterSpacing: ".2px" }}>
              {ready ? (approved ? "Approved" : "Pending review") : busy ? "Processing…" : "Intake in progress"}
            </span>
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
              <div className="upload-area" onClick={() => fileRef.current?.click()} style={{ border: "1.5px dashed #e2e8f0", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: "#fff", transition: "all .15s" }}>
                <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFiles} style={{ display: "none" }} />
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f8faff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📎</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Upload Documents</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>Credit report, ID, SSN card, FTC report — AI extracts automatically</div>
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
                  {docTab === "checklist" ? (
                    <div style={{ padding: "20px 18px" }}>
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
                <div style={{ padding: "12px 16px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8, flexShrink: 0 }}>
                  {docTab !== "checklist" && (
                    <button onClick={() => copyText(pkg[docTab] || "", docTab)} className="action-btn" style={{ flex: 1, height: 42, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#fff", border: "1.5px solid #e2e8f0", color: "#374151" }}>
                      {copied === docTab ? "✓ Copied" : "Copy"}
                    </button>
                  )}
                  {!approved ? (
                    <button onClick={() => setShowReview(true)} style={{ flex: 2, height: 42, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#fef3c7", border: "1.5px solid #fde68a", color: "#92400e" }}>
                      ⚡ Brandon — Review
                    </button>
                  ) : (
                    <button onClick={printAll} className="action-btn" style={{ flex: 2, height: 42, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#1e3a8a", border: "none", color: "#fff" }}>
                      Print / Save PDF ✓
                    </button>
                  )}
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
