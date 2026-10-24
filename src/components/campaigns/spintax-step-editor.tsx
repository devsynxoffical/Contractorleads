"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  HiOutlineSparkles,
  HiOutlineEye,
  HiOutlinePaperAirplane,
  HiOutlineCheck,
  HiOutlineExclamationCircle,
  HiOutlineCodeBracket,
  HiOutlineBolt,
} from "react-icons/hi2";
import {
  validateSpintax,
  renderOutreachEmail,
  normalizeLeadVars,
} from "@/lib/spintax-engine";

export type SpintaxStepEditorProps = {
  stepLabel: string; // e.g. "Step 1A" or "Hook A"
  subject: string;
  body: string;
  preheader?: string;
  signature?: string;
  sampleLeads?: Array<Record<string, any>>;
  onChange: (data: {
    subject: string;
    body: string;
    preheader?: string;
  }) => void;
  onSave?: () => void;
};

const DEFAULT_SAMPLE_LEADS = [
  {
    id: "lead-1",
    email: "msherwood@orbit-int.co.uk",
    firstName: "Michael",
    ownerName: "Michael Sherwood",
    businessName: "Orbit International",
    city: "Chicago",
    state: "IL",
    industry: "Roofing",
    custom_personalised_opening_line: "Saw workwear and headwear in your clothing range. Thought custom patches could complement selected everyday garment branding briefs.",
  },
  {
    id: "lead-2",
    email: "ccook@pgbranding.com",
    firstName: "Christopher",
    ownerName: "Christopher Cook",
    businessName: "PG Branding",
    city: "Dallas",
    state: "TX",
    industry: "Roofing",
    custom_personalised_opening_line: "Saw aprons, headwear and hoodies in your clothing store. Thought custom patches could add another finish for selected merchandise briefs.",
  },
  {
    id: "lead-3",
    email: "andrew@justso.biz",
    firstName: "Andrew",
    ownerName: "Andrew Justso",
    businessName: "Just So Biz",
    city: "Atlanta",
    state: "GA",
    industry: "Roofing",
    custom_personalised_opening_line: "Saw your branded clothing and promotional merchandise services. Thought custom patches could provide another branding option for selected apparel briefs.",
  },
];

export function SpintaxStepEditor({
  stepLabel,
  subject,
  body,
  preheader = "",
  signature = "",
  sampleLeads = DEFAULT_SAMPLE_LEADS,
  onChange,
  onSave,
}: SpintaxStepEditorProps) {
  const [showPreheader, setShowPreheader] = useState(Boolean(preheader));
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [selectedLeadIndex, setSelectedLeadIndex] = useState(0);
  const [showSpintaxModal, setShowSpintaxModal] = useState(false);
  const [showVariableDropdown, setShowVariableDropdown] = useState(false);
  const [showSpamDetails, setShowSpamDetails] = useState(false);

  // Helper popup state
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");

  // AI loading state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testSentMsg, setTestSentMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Validation report
  const validation = useMemo(() => {
    return validateSpintax(body, subject);
  }, [body, subject]);

  const activeLead = sampleLeads[selectedLeadIndex] || sampleLeads[0];

  // Rendered preview for selected lead
  const previewRender = useMemo(() => {
    return renderOutreachEmail(
      {
        subject,
        body,
        preheader,
        signature,
      },
      activeLead,
      {
        campaignId: "campaign-preview",
        stepId: stepLabel,
        leadId: activeLead.id || activeLead.email,
        mode: "random",
      }
    );
  }, [subject, body, preheader, signature, activeLead, stepLabel]);

  // Insert Spintax block helper
  function handleInsertSpintax() {
    if (!opt1.trim() || !opt2.trim()) return;
    const block = opt3.trim()
      ? `{{random|${opt1.trim()}|${opt2.trim()}|${opt3.trim()}}}`
      : `{{random|${opt1.trim()}|${opt2.trim()}}}`;

    insertAtCursor(block);
    setShowSpintaxModal(false);
    setOpt1("");
    setOpt2("");
    setOpt3("");
  }

  function insertVariable(varName: string) {
    insertAtCursor(`{{${varName}}}`);
    setShowVariableDropdown(false);
  }

  function insertAtCursor(text: string) {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newBody = body.substring(0, start) + text + body.substring(end);
    onChange({ subject, body: newBody, preheader });

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    }, 50);
  }

  // Use AI to generate 2 alternative phrasings
  async function handleUseAI() {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const selected = body.substring(el.selectionStart, el.selectionEnd).trim();

    if (!selected) {
      alert("Please highlight a sentence or line of text first to generate AI spintax options!");
      return;
    }

    setAiGenerating(true);
    try {
      const res = await fetch("/api/spintax/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selected }),
      });
      const data = await res.json();
      if (data.ok && data.spintaxBlock) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newBody = body.substring(0, start) + data.spintaxBlock + body.substring(end);
        onChange({ subject, body: newBody, preheader });
      }
    } catch {
      // ignore
    } finally {
      setAiGenerating(false);
    }
  }

  // Test Send
  async function handleTestSend() {
    setTestSending(true);
    setTestSentMsg(null);
    try {
      const res = await fetch("/api/campaigns/test-send-generic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: previewRender.subject,
          bodyText: previewRender.body,
        }),
      });
      if (res.ok) {
        setTestSentMsg("Test email delivered to your inbox!");
        setTimeout(() => setTestSentMsg(null), 3000);
      }
    } catch {
      // ignore
    } finally {
      setTestSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#26253c] bg-[#141326] shadow-xl overflow-hidden flex flex-col text-slate-100">
      {/* 1. TOP HEADER & SUBJECT ROW (MATCHING PLUSVIBE SCREENSHOT 1) */}
      <div className="p-4 border-b border-[#26253c] bg-[#17162b] space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            {/* Step Badge */}
            <span className="px-3 py-1 rounded-full bg-indigo-600 font-bold text-xs text-white shrink-0 shadow-xs">
              {stepLabel}
            </span>

            {/* Subject Line Input with Spintax Support */}
            <input
              type="text"
              value={subject}
              onChange={(e) => onChange({ subject: e.target.value, body, preheader })}
              placeholder="{{random|A smaller patch run?|Custom patches for your next order?|Only need 10 patches?}}"
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#0f0e1e] border border-[#2b2a45] text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-indigo-500 transition"
            />
          </div>

          {/* Preheader toggle */}
          <button
            type="button"
            onClick={() => setShowPreheader(!showPreheader)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition shrink-0"
          >
            {showPreheader ? "Hide preheader" : "Add preheader"}
          </button>
        </div>

        {/* Preheader Field */}
        {showPreheader && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 w-16 shrink-0">
              Preheader:
            </span>
            <input
              type="text"
              value={preheader}
              onChange={(e) => onChange({ subject, body, preheader: e.target.value })}
              placeholder="Preview snippet shown in recipient inbox..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#0f0e1e] border border-[#2b2a45] text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition font-mono"
            />
          </div>
        )}
      </div>

      {/* 2. RICH EDITOR TOOLBAR (PlusVibe Reference) */}
      <div className="px-4 py-2 bg-[#191830] border-b border-[#26253c] flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left Formatting Buttons */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <button
            type="button"
            onClick={() => insertAtCursor("**bold text**")}
            className="px-2 py-1 rounded hover:bg-slate-800 font-bold"
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => insertAtCursor("*italic text*")}
            className="px-2 py-1 rounded hover:bg-slate-800 italic font-serif"
            title="Italic"
          >
            i
          </button>
          <button
            type="button"
            onClick={() => insertAtCursor("<u>underlined</u>")}
            className="px-2 py-1 rounded hover:bg-slate-800 underline"
            title="Underline"
          >
            U
          </button>

          <span className="w-px h-4 bg-slate-700 mx-1" />

          {/* Insert Variable Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowVariableDropdown(!showVariableDropdown)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 flex items-center gap-1 font-mono font-semibold"
              title="Insert Lead Variable"
            >
              <HiOutlineCodeBracket className="w-3.5 h-3.5" />
              {"{ }"} Variables
            </button>
            {showVariableDropdown && (
              <div className="absolute left-0 top-8 z-30 w-56 rounded-xl bg-[#1b1a32] border border-[#2b2a45] shadow-2xl p-1.5 text-xs text-slate-200 animate-in fade-in duration-100">
                <div className="text-[10px] text-slate-500 font-bold px-2 py-1 uppercase">
                  Lead Attributes
                </div>
                {[
                  { label: "First Name", val: "firstName" },
                  { label: "Full Name", val: "ownerName" },
                  { label: "Business Name", val: "businessName" },
                  { label: "City", val: "city" },
                  { label: "State", val: "state" },
                  { label: "Industry", val: "industry" },
                  { label: "Opening Line (AI)", val: "custom_personalised_opening_line" },
                  { label: "Sender Name", val: "fromName" },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => insertVariable(item.val)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-between font-mono text-[11px]"
                  >
                    <span>{item.label}</span>
                    <span className="text-slate-500 text-[10px]">{`{{${item.val}}}`}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Insert Spintax Block Button */}
          <button
            type="button"
            onClick={() => setShowSpintaxModal(true)}
            className="px-2.5 py-1 rounded bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1 transition"
          >
            <HiOutlineBolt className="w-3.5 h-3.5" />
            + Spintax (3 options)
          </button>
        </div>

        {/* Right Toggle: Edit View vs Lead Preview */}
        <div className="flex items-center gap-1 bg-[#100f21] p-1 rounded-xl border border-[#2b2a45]">
          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={`px-3 py-1 rounded-lg transition font-semibold ${
              activeTab === "editor"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Edit Template
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1 rounded-lg transition font-semibold flex items-center gap-1.5 ${
              activeTab === "preview"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <HiOutlineEye className="w-3.5 h-3.5" />
            Live Lead Preview
          </button>
        </div>
      </div>

      {/* 3. MAIN BODY AREA */}
      {activeTab === "editor" ? (
        <div className="p-4 space-y-3">
          <textarea
            ref={textareaRef}
            rows={12}
            value={body}
            onChange={(e) => onChange({ subject, body: e.target.value, preheader })}
            placeholder={`{{random|Hi|Hello|Hey}} {{first_name}},\n\n{{custom_personalised_opening_line}}\n\n{{random|We make custom patches from 10 pieces.|Our minimum is 10 custom patches.|You can start with 10 patches.}}\n\nChoose embroidered, chain stitch, chenille, leather, PVC, woven or sequin.\n\n{{random|Backing, delivery and a physical example of your design are included.|We include your preferred backing, delivery and a physical example.|Your pricing covers backing, delivery and a physical example of your patch.}}\n\n{{random|Considering patches for a project?|Working on a patch project?|Have a design in mind?}}`}
            className="w-full p-4 rounded-xl bg-[#0e0d1c] border border-[#2b2a45] text-slate-100 font-mono text-xs leading-relaxed focus:outline-hidden focus:border-indigo-500 transition resize-y select-text"
          />

          {/* Validation Warnings / Errors */}
          {validation.errors.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              {validation.errors.map((err, i) => (
                <div key={i} className="flex items-center gap-2">
                  <HiOutlineExclamationCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* LIVE LEAD PREVIEW (MATCHING PLUSVIBE SCREENSHOT 2) */
        <div className="p-5 space-y-4 bg-[#0e0d1c]">
          {/* Lead Dropdown Selector */}
          <div className="flex items-center justify-between pb-3 border-b border-[#26253c]">
            <div className="text-xs font-semibold text-slate-300">
              Lead Details for Personalization:
            </div>
            <select
              value={selectedLeadIndex}
              onChange={(e) => setSelectedLeadIndex(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 rounded-xl bg-[#17162b] border border-[#2b2a45] text-white text-xs font-mono focus:outline-hidden"
            >
              {sampleLeads.map((lead, idx) => (
                <option key={lead.id || idx} value={idx}>
                  {lead.email} ({lead.firstName} - {lead.businessName})
                </option>
              ))}
            </select>
          </div>

          {/* Rendered Email Preview Card */}
          <div className="rounded-xl border border-[#26253c] bg-[#141326] p-6 space-y-4 font-sans text-xs shadow-md">
            {/* Subject */}
            <div>
              <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">
                Rendered Subject
              </div>
              <div className="text-sm font-bold text-white font-mono">
                {previewRender.subject}
              </div>
            </div>

            {/* Sender and Date Badge */}
            <div className="flex items-center justify-between pt-2 border-t border-[#201f35] text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600/40 border border-indigo-500 text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                  CL
                </span>
                <span>
                  Contractor Leads &lt;outreach@{activeLead.email.split("@")[1] || "contractorleads.us"}&gt;
                </span>
              </div>
              <span className="font-mono text-[10px]">{new Date().toLocaleDateString()}</span>
            </div>

            {/* Rendered Body */}
            <div className="pt-2 text-slate-200 whitespace-pre-wrap leading-relaxed text-xs">
              {previewRender.body}
            </div>

            {/* Deterministic Hash & Choice Indices */}
            <div className="pt-3 border-t border-[#201f35] flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Deterministic seed hash: {previewRender.renderedHash}</span>
              <span>Spintax choices: [{previewRender.choices.join(", ")}]</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. FOOTER BAR (MATCHING PLUSVIBE SCREENSHOT 1) */}
      <div className="px-5 py-3 bg-[#17162b] border-t border-[#26253c] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Overall Score + Character count + Unique Variations */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Overall score:</span>
            <span
              onClick={() => setShowSpamDetails(!showSpamDetails)}
              className={`px-2.5 py-0.5 rounded-full font-bold text-xs cursor-pointer ${
                validation.spamScore.rating === "Excellent"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : validation.spamScore.rating === "Good"
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              {validation.spamScore.rating}
            </span>
            <button
              type="button"
              onClick={() => setShowSpamDetails(!showSpamDetails)}
              className="text-indigo-400 hover:text-indigo-300 text-[11px] underline"
            >
              See Details →
            </button>
          </div>

          <span className="w-px h-4 bg-slate-700" />

          {/* Live Combinations Math */}
          <div className="text-slate-300 font-mono font-semibold flex items-center gap-1.5">
            <span className="text-indigo-400 font-bold text-sm">
              {validation.uniqueCombinations}
            </span>
            <span>unique versions</span>
          </div>

          <span className="w-px h-4 bg-slate-700" />

          {/* Character Counter */}
          <div className="text-slate-400 font-mono">
            Characters : <span className="text-slate-200">{body.length}</span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          {testSentMsg && (
            <span className="text-xs text-emerald-400 font-medium animate-in fade-in">
              {testSentMsg}
            </span>
          )}

          {/* Test Send */}
          <button
            type="button"
            onClick={handleTestSend}
            disabled={testSending}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            title="Send test email to your account"
          >
            <HiOutlinePaperAirplane className="w-3.5 h-3.5" />
            {testSending ? "Sending..." : "Test Send"}
          </button>

          {/* Use AI Button (Pink Gradient / Styled per PlusVibe reference) */}
          <button
            type="button"
            onClick={handleUseAI}
            disabled={aiGenerating}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-pink-500/20 transition disabled:opacity-50"
            title="Highlight text and click to generate 2 alternative phrasings"
          >
            <HiOutlineSparkles className="w-4 h-4" />
            {aiGenerating ? "Generating..." : "Use AI"}
          </button>

          {/* Save Button */}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-sm"
            >
              Save All
            </button>
          )}
        </div>
      </div>

      {/* 5. POPUP MODAL: INSERT 3-OPTION SPINTAX */}
      {showSpintaxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#141326] border border-[#26253c] rounded-2xl p-6 shadow-2xl space-y-4 text-xs text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-[#26253c]">
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <HiOutlineBolt className="w-4 h-4 text-indigo-400" />
                Add 3-Option Spintax Block
              </div>
              <button
                onClick={() => setShowSpintaxModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Every lead deterministically receives one of these 3 variations. 3 options create 729+ combinations across 6 blocks.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Option 1</label>
                <input
                  type="text"
                  value={opt1}
                  onChange={(e) => setOpt1(e.target.value)}
                  placeholder="e.g. You can start with 10 patches."
                  className="w-full px-3 py-2 rounded-xl bg-[#0f0e1e] border border-[#2b2a45] text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Option 2</label>
                <input
                  type="text"
                  value={opt2}
                  onChange={(e) => setOpt2(e.target.value)}
                  placeholder="e.g. Our minimum is 10 custom patches."
                  className="w-full px-3 py-2 rounded-xl bg-[#0f0e1e] border border-[#2b2a45] text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Option 3 <span className="text-indigo-400 font-normal">(recommended)</span>
                </label>
                <input
                  type="text"
                  value={opt3}
                  onChange={(e) => setOpt3(e.target.value)}
                  placeholder="e.g. We make custom patches from 10 pieces."
                  className="w-full px-3 py-2 rounded-xl bg-[#0f0e1e] border border-[#2b2a45] text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSpintaxModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertSpintax}
                disabled={!opt1.trim() || !opt2.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white disabled:opacity-40"
              >
                Insert Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. POPUP: SPAM DETAILS DIALOG */}
      {showSpamDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#141326] border border-[#26253c] rounded-2xl p-6 shadow-2xl space-y-4 text-xs text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-[#26253c]">
              <div className="font-bold text-sm text-white">Deliverability & Spam Score Details</div>
              <button
                onClick={() => setShowSpamDetails(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#17162b] border border-[#26253c]">
                <span>Content Deliverability Rating</span>
                <span className="font-bold text-emerald-400">
                  {validation.spamScore.score}/100 ({validation.spamScore.rating})
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#17162b] border border-[#26253c]">
                <span>Unique Combinations Generated</span>
                <span className="font-bold text-indigo-400">{validation.uniqueCombinations}</span>
              </div>

              {validation.spamScore.flaggedWords.length > 0 ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
                  <div className="font-semibold">Flagged trigger words:</div>
                  <ul className="list-disc pl-4 text-[11px]">
                    {validation.spamScore.flaggedWords.map((w, idx) => (
                      <li key={idx}>"{w}"</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  No high-risk spam keywords detected. Copy reads naturally and conversationally.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSpamDetails(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
