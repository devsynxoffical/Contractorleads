"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EmailFinderResult, FoundContact } from "@/lib/email-finder";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineSparkles,
  HiOutlineGlobeAlt,
  HiOutlineBuildingOffice2,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineUser,
  HiOutlineArrowDownTray,
  HiOutlineClipboardDocument,
  HiOutlinePaperAirplane,
  HiOutlineArrowPath,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineXCircle,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { FaLinkedin, FaFacebook, FaInstagram } from "react-icons/fa";

type ActiveTab = "single" | "bulk";

export function EmailFinderView() {
  const [tab, setTab] = useState<ActiveTab>("single");

  // Single finder state
  const [singleDomain, setSingleDomain] = useState("");
  const [singleResult, setSingleResult] = useState<EmailFinderResult | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Bulk finder state
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResults, setBulkResults] = useState<EmailFinderResult[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSearch, setBulkSearch] = useState("");
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  }

  // Single domain finder
  async function findSingle(domainToFind?: string) {
    const target = (domainToFind || singleDomain).trim();
    if (!target) return;
    setSingleLoading(true);
    setSingleError(null);
    try {
      const res = await fetch("/api/email/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: target, verify: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Email search failed");
      }
      setSingleResult(data.result);
      if (domainToFind) setSingleDomain(domainToFind);
    } catch (err) {
      setSingleError(err instanceof Error ? err.message : "Failed to find emails");
    } finally {
      setSingleLoading(false);
    }
  }

  // Sample click
  function testSample(domain: string) {
    setSingleDomain(domain);
    void findSingle(domain);
  }

  // Bulk finder handler
  async function runBulkFind() {
    const lines = bulkInput
      .split(/[\n,;]+/)
      .map((s) => s.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0])
      .filter((s) => s.length > 2 && s.includes("."));

    const uniqueDomains = [...new Set(lines)];
    if (!uniqueDomains.length) {
      setBulkError("Please enter at least one valid website domain (e.g. company.com).");
      return;
    }

    if (uniqueDomains.length > 100) {
      setBulkError("Maximum 100 domains per batch. Please reduce your list.");
      return;
    }

    setBulkLoading(true);
    setBulkError(null);
    setBulkResults([]);
    setProgress({ current: 0, total: uniqueDomains.length });

    try {
      const batchSize = 10;
      const allResults: EmailFinderResult[] = [];

      for (let i = 0; i < uniqueDomains.length; i += batchSize) {
        const chunk = uniqueDomains.slice(i, i + batchSize);
        const res = await fetch("/api/email/find-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domains: chunk }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Bulk search failed");
        }
        allResults.push(...(data.results || []));
        setBulkResults([...allResults]);
        setProgress({ current: Math.min(i + batchSize, uniqueDomains.length), total: uniqueDomains.length });
      }
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Bulk search failed");
    } finally {
      setBulkLoading(false);
      setProgress(null);
    }
  }

  // File upload handler
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const domainMatches = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/g) || [];
      const clean = [...new Set(domainMatches.map((d) => d.replace(/^https?:\/\//i, "").replace(/^www\./i, "")))].join("\n");
      setBulkInput(clean);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // Flattened contacts for bulk export
  const allDiscoveredContacts = useMemo(() => {
    const list: Array<{
      company: string;
      domain: string;
      email: string;
      name: string;
      role: string;
      phone: string;
      status: string;
      score: number;
    }> = [];

    for (const r of bulkResults) {
      if (!r.contacts.length && r.primaryEmail) {
        list.push({
          company: r.companyName || r.domain,
          domain: r.domain,
          email: r.primaryEmail,
          name: r.ownerName || "",
          role: r.ownerRole || "Contact",
          phone: r.phone || "",
          status: "Found",
          score: 80,
        });
      }
      for (const c of r.contacts) {
        list.push({
          company: r.companyName || r.domain,
          domain: r.domain,
          email: c.email,
          name: c.name || r.ownerName || "",
          role: c.role || "Contact",
          phone: r.phone || "",
          status: c.verification?.status || "valid",
          score: c.verification?.score || 80,
        });
      }
    }
    return list;
  }, [bulkResults]);

  // Export CSV
  function exportCleanCsv() {
    if (!allDiscoveredContacts.length) return;

    const headers = ["Company", "Domain", "Email", "Name", "Role", "Phone", "Verification Status", "Score"];
    const rows = allDiscoveredContacts.map((c) => [
      `"${c.company.replace(/"/g, '""')}"`,
      `"${c.domain}"`,
      `"${c.email}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.role.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${c.status}"`,
      c.score,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `discovered_emails_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Bulk stats
  const bulkStats = useMemo(() => {
    const total = bulkResults.length;
    const withEmail = bulkResults.filter((r) => r.contacts.length > 0 || r.primaryEmail).length;
    const totalFound = allDiscoveredContacts.length;
    const successRate = total > 0 ? Math.round((withEmail / total) * 100) : 0;
    return { total, withEmail, totalFound, successRate };
  }, [bulkResults, allDiscoveredContacts]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return allDiscoveredContacts.filter((c) => {
      if (bulkSearch) {
        const q = bulkSearch.toLowerCase();
        return (
          c.company.toLowerCase().includes(q) ||
          c.domain.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allDiscoveredContacts, bulkSearch]);

  return (
    <div className="space-y-6">
      {/* Feature Callout Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-brand-900/10 via-[var(--surface)] to-brand-900/5 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              <HiOutlineSparkles className="h-3.5 w-3.5" /> 100% Free & Unlimited
            </div>
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Bulk Email Finder & Decision-Maker Discovery
            </h2>
            <p className="max-w-2xl text-[13.5px] leading-relaxed text-ink-muted">
              Discover verified business emails, owners, founders, and estimators directly from any website URL or domain. Extracts phone numbers, social links, and pre-verifies deliverability.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/email-verifier"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-[var(--input-bg)] px-4 py-2.5 text-[13px] font-semibold text-ink shadow-sm hover:bg-border transition"
            >
              <HiOutlineShieldCheck className="h-4 w-4 text-brand-600" />
              Email Verifier
            </Link>
            <Link
              href="/inbox?tab=bulk"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              <HiOutlineEnvelope className="h-4 w-4" />
              Send Bulk Email
            </Link>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-2xl border border-border bg-[var(--surface)] p-1.5 shadow-sm max-w-md">
        <button
          type="button"
          onClick={() => setTab("single")}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition",
            tab === "single"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-ink-muted hover:bg-[var(--input-bg)] hover:text-ink",
          )}
        >
          <HiOutlineMagnifyingGlass className="h-4 w-4" />
          Single Domain Finder
        </button>
        <button
          type="button"
          onClick={() => setTab("bulk")}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition",
            tab === "bulk"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-ink-muted hover:bg-[var(--input-bg)] hover:text-ink",
          )}
        >
          <HiOutlineUserGroup className="h-4 w-4" />
          Bulk Email Finder
        </button>
      </div>

      {/* TAB 1: SINGLE DOMAIN FINDER */}
      {tab === "single" && (
        <div className="space-y-6">
          <Card className="border-border bg-[var(--surface)] shadow-[var(--shadow-card)]">
            <CardContent className="p-6 space-y-4">
              <label className="block text-[13px] font-semibold text-ink">
                Enter Contractor Website or Domain
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="e.g. rooferpros.com or https://apexcontracting.com"
                    value={singleDomain}
                    onChange={(e) => setSingleDomain(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void findSingle();
                      }
                    }}
                    className="h-12 text-[14.5px] pl-4 pr-10 rounded-xl"
                  />
                  {singleDomain && (
                    <button
                      type="button"
                      onClick={() => setSingleDomain("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <Button
                  onClick={() => findSingle()}
                  disabled={singleLoading || !singleDomain.trim()}
                  className="h-12 px-6 rounded-xl text-[14px] font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                >
                  {singleLoading ? (
                    <>
                      <HiOutlineArrowPath className="mr-2 h-4 w-4 animate-spin" />
                      Searching Website…
                    </>
                  ) : (
                    <>
                      <HiOutlineMagnifyingGlass className="mr-2 h-5 w-5" />
                      Find Emails
                    </>
                  )}
                </Button>
              </div>

              {/* Sample Domain Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[12px] text-ink-muted">
                <span className="font-medium">Try example:</span>
                <button
                  type="button"
                  onClick={() => testSample("google.com")}
                  className="rounded-lg border border-border bg-[var(--input-bg)] px-2.5 py-1 font-mono text-[11.5px] text-ink hover:border-brand-400 hover:text-brand-600 transition"
                >
                  google.com
                </button>
                <button
                  type="button"
                  onClick={() => testSample("microsoft.com")}
                  className="rounded-lg border border-border bg-[var(--input-bg)] px-2.5 py-1 font-mono text-[11.5px] text-ink hover:border-brand-400 hover:text-brand-600 transition"
                >
                  microsoft.com
                </button>
                <button
                  type="button"
                  onClick={() => testSample("stripe.com")}
                  className="rounded-lg border border-border bg-[var(--input-bg)] px-2.5 py-1 font-mono text-[11.5px] text-ink hover:border-brand-400 hover:text-brand-600 transition"
                >
                  stripe.com
                </button>
              </div>

              {singleError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-[13px] text-rose-900 flex items-center gap-2.5">
                  <HiOutlineXCircle className="h-5 w-5 shrink-0 text-rose-600" />
                  <span>{singleError}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Presentation */}
          {singleResult && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Company Summary Card */}
              <Card className="border-border bg-[var(--surface)] shadow-[var(--shadow-card)]">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 shadow-sm">
                        <HiOutlineBuildingOffice2 className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-ink">
                            {singleResult.companyName || singleResult.domain}
                          </h3>
                          <Badge variant="brand" className="text-[11px]">
                            {singleResult.contacts.length} Contact{singleResult.contacts.length === 1 ? "" : "s"} Found
                          </Badge>
                        </div>
                        <p className="text-[13px] text-ink-muted flex items-center gap-2 mt-1">
                          <HiOutlineGlobeAlt className="h-4 w-4 text-ink-faint" />
                          <a
                            href={singleResult.websiteUrl || `https://${singleResult.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline font-mono text-xs"
                          >
                            {singleResult.domain}
                          </a>
                          {singleResult.phone && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-semibold text-ink">
                                <HiOutlinePhone className="h-3.5 w-3.5" />
                                {singleResult.phone}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Socials */}
                    <div className="flex items-center gap-2">
                      {singleResult.socials.linkedin && (
                        <a
                          href={singleResult.socials.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-border p-2 text-blue-600 hover:bg-blue-50 transition"
                          title="LinkedIn Profile"
                        >
                          <FaLinkedin className="h-4 w-4" />
                        </a>
                      )}
                      {singleResult.socials.facebook && (
                        <a
                          href={singleResult.socials.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-border p-2 text-blue-500 hover:bg-blue-50 transition"
                          title="Facebook Profile"
                        >
                          <FaFacebook className="h-4 w-4" />
                        </a>
                      )}
                      {singleResult.socials.instagram && (
                        <a
                          href={singleResult.socials.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-border p-2 text-pink-600 hover:bg-pink-50 transition"
                          title="Instagram Profile"
                        >
                          <FaInstagram className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Found Contacts List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-ink">
                    Discovered Email Addresses & Decision Makers
                  </h3>
                  <span className="text-xs text-ink-muted">
                    Found in {singleResult.durationMs}ms ({singleResult.pagesChecked.length} pages scanned)
                  </span>
                </div>

                {singleResult.contacts.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-[var(--surface)] p-8 text-center text-ink-muted">
                    <p className="text-[14px]">No public email address found on this website.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {singleResult.contacts.map((contact, idx) => (
                      <Card
                        key={idx}
                        className="border-border bg-[var(--surface)] shadow-[var(--shadow-card)] hover:border-brand-300 transition"
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-mono text-[14px] font-bold text-ink truncate">
                                {contact.email}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 text-[12px] text-ink-muted">
                                <HiOutlineUser className="h-3.5 w-3.5" />
                                <span className="font-semibold text-ink">
                                  {contact.name || contact.role || "Direct Contact"}
                                </span>
                                {contact.type === "owner" && (
                                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] py-0">
                                    Owner
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Verification Pill */}
                            {contact.verification && (
                              <Badge
                                className={cn(
                                  "capitalize text-[11px] shrink-0 font-bold",
                                  contact.verification.status === "valid"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : contact.verification.status === "risky"
                                      ? "bg-amber-100 text-amber-900 border-amber-300"
                                      : "bg-rose-100 text-rose-800 border-rose-300",
                                )}
                              >
                                {contact.verification.status} ({contact.verification.score}%)
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                            <span className="text-ink-faint truncate max-w-[150px]" title={contact.sourceUrl}>
                              Source: {contact.sourceUrl.replace(/^https?:\/\//i, "")}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => copy(contact.email)}
                                className="h-7 px-2 text-[11px]"
                              >
                                <HiOutlineClipboardDocument className="mr-1 h-3 w-3" />
                                {copiedText === contact.email ? "Copied" : "Copy"}
                              </Button>
                              <Link
                                href={`/inbox?tab=compose&to=${encodeURIComponent(contact.email)}`}
                                className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-brand-700 transition"
                              >
                                <HiOutlinePaperAirplane className="mr-1 h-3 w-3" />
                                Send
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BULK DOMAIN FINDER */}
      {tab === "bulk" && (
        <div className="space-y-6">
          <Card className="border-border bg-[var(--surface)] shadow-[var(--shadow-card)]">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label className="text-[14px] font-semibold text-ink">
                    Paste Website URLs or Upload Domain List
                  </label>
                  <p className="text-[12.5px] text-ink-muted">
                    Enter one domain/URL per line (e.g. precisionroofing.com), up to 100 websites per batch.
                  </p>
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-border bg-[var(--input-bg)] px-3.5 py-2 text-xs font-semibold text-ink hover:bg-border transition shadow-sm">
                    <HiOutlineDocumentText className="h-4 w-4 text-brand-600" />
                    Upload Domains (.csv / .txt)
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <Textarea
                rows={6}
                placeholder={"precisionroofing.com\nhttps://apexpainters.com\nsummitbuilders.net\neliteplumbingpros.com"}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="font-mono text-[13px] rounded-xl"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-ink-muted">
                  {bulkInput.split(/[\n,;]+/).filter((s) => s.trim().includes(".")).length} domains detected
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setBulkInput("");
                      setBulkResults([]);
                    }}
                    disabled={bulkLoading || (!bulkInput && !bulkResults.length)}
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={runBulkFind}
                    disabled={bulkLoading || !bulkInput.trim()}
                    className="bg-brand-600 text-white hover:bg-brand-700 font-semibold shadow-sm"
                  >
                    {bulkLoading ? (
                      <>
                        <HiOutlineArrowPath className="mr-2 h-4 w-4 animate-spin" />
                        Finding Emails {progress ? `(${progress.current}/${progress.total})` : "…"}
                      </>
                    ) : (
                      <>
                        <HiOutlineMagnifyingGlass className="mr-2 h-4 w-4" />
                        Find All Emails
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {progress && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold text-ink">
                    <span>Searching domain websites…</span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full bg-brand-600 transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {bulkError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-[13px] text-rose-900 flex items-center gap-2.5">
                  <HiOutlineXCircle className="h-5 w-5 shrink-0 text-rose-600" />
                  <span>{bulkError}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk Results Table & KPIs */}
          {bulkResults.length > 0 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Stats KPI Cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                    Websites Scanned
                  </p>
                  <p className="mt-1 text-2xl font-bold text-ink">{bulkStats.total}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">Domains crawled</p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Domains with Email
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-800">{bulkStats.withEmail}</p>
                  <p className="mt-0.5 text-xs text-emerald-700">{bulkStats.successRate}% Success rate</p>
                </div>

                <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-900">
                    Total Contacts Found
                  </p>
                  <p className="mt-1 text-2xl font-bold text-brand-900">{bulkStats.totalFound}</p>
                  <p className="mt-0.5 text-xs text-brand-700">Verified emails</p>
                </div>

                <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm flex flex-col justify-center">
                  <Button
                    onClick={exportCleanCsv}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 shadow-sm"
                  >
                    <HiOutlineArrowDownTray className="mr-1.5 h-4 w-4" />
                    Export CSV ({bulkStats.totalFound})
                  </Button>
                  <Link
                    href="/inbox?tab=bulk"
                    className="mt-2 text-center text-xs font-semibold text-brand-600 hover:underline"
                  >
                    Send Bulk Campaign $\rightarrow$
                  </Link>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search company, domain, or email…"
                    value={bulkSearch}
                    onChange={(e) => setBulkSearch(e.target.value)}
                    className="h-8 text-xs w-64 rounded-lg"
                  />
                  <span className="text-xs text-ink-muted">
                    Showing {filteredContacts.length} of {allDiscoveredContacts.length} contacts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={exportCleanCsv}
                    className="h-8 text-xs font-semibold"
                  >
                    <HiOutlineArrowDownTray className="mr-1.5 h-3.5 w-3.5" />
                    Download CSV
                  </Button>
                </div>
              </div>

              {/* Discovered Contacts Table */}
              <div className="overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="border-b border-border bg-[var(--input-bg)] text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                      <tr>
                        <th className="py-3 px-4">Company / Domain</th>
                        <th className="py-3 px-4">Discovered Email</th>
                        <th className="py-3 px-4">Name & Role</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Deliverability</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredContacts.map((c, i) => (
                        <tr key={i} className="hover:bg-brand-50/30 transition">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-ink">{c.company}</p>
                            <p className="text-[11px] font-mono text-ink-muted">{c.domain}</p>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-ink">
                            {c.email}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-ink">{c.name || "—"}</p>
                            <p className="text-[11px] text-ink-muted">{c.role}</p>
                          </td>
                          <td className="py-3 px-4 text-ink-muted font-mono text-xs">
                            {c.phone || "—"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={cn(
                                "capitalize text-[11px] px-2 py-0.5 font-bold",
                                c.status === "valid"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-amber-100 text-amber-900 border-amber-300",
                              )}
                            >
                              {c.status} ({c.score}%)
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => copy(c.email)}
                              className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline"
                            >
                              {copiedText === c.email ? "Copied" : "Copy"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
