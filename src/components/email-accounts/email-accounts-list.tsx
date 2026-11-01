"use client";

import { useEffect, useState, useMemo } from "react";
import {
  HiOutlineEnvelope,
  HiOutlinePaperAirplane,
  HiOutlineFire,
  HiOutlineHeart,
  HiOutlineArrowUturnLeft,
  HiOutlineArrowTrendingDown,
  HiOutlineMegaphone,
  HiOutlineArrowPath,
  HiOutlineChartBar,
  HiOutlineEllipsisHorizontal,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiOutlineChevronLeft,
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
  HiOutlinePause,
  HiOutlinePlay,
  HiOutlineTrash,
  HiOutlineBolt,
} from "react-icons/hi2";
import { DnsFixDrawer } from "./dns-fix-drawer";
import { AnalyticsDrawer } from "./analytics-drawer";
import { AddAccountModal } from "./add-account-modal";
import { WarmupSettingsModal } from "./warmup-settings-modal";
import { WarmupMessagesDrawer } from "./warmup-messages-drawer";
import { FixMailboxModal } from "./fix-mailbox-modal";

export function EmailAccountsList() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);
  const [selectedMailboxIds, setSelectedMailboxIds] = useState<string[]>([]);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fixDrawerDomain, setFixDrawerDomain] = useState<string | null>(null);
  const [analyticsMailbox, setAnalyticsMailbox] = useState<string | null>(null);
  const [warmupInboxMailbox, setWarmupInboxMailbox] = useState<string | null>(null);
  const [fixMailbox, setFixMailbox] = useState<{ id: string; email: string } | null>(null);
  const [warmupSettingsMailbox, setWarmupSettingsMailbox] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [dnsRefreshingDomain, setDnsRefreshingDomain] = useState<string | null>(null);

  // Bulk edit limit state
  const [isBulkLimitOpen, setIsBulkLimitOpen] = useState(false);
  const [bulkLimitVal, setBulkLimitVal] = useState(30);

  // Quick warmup test state
  const [testingWarmup, setTestingWarmup] = useState(false);
  const [testBanner, setTestBanner] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function handleQuickWarmupTest() {
    setTestingWarmup(true);
    setTestBanner(null);
    try {
      const res = await fetch("/api/email-accounts/test-warmup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger warmup test");
      }
      setTestBanner({
        type: "success",
        message: `Test warmup email sent from ${data.details.from} to ${data.details.to} ("${data.details.subject}").`,
      });
      await loadAccounts(true);
    } catch (err: any) {
      setTestBanner({
        type: "error",
        message: `Warmup test failed: ${err.message || String(err)}`,
      });
    } finally {
      setTestingWarmup(false);
    }
  }

  async function loadAccounts(silent = false) {
    if (!silent && !data) {
      setLoading(true);
    }
    try {
      const res = await fetch("/api/email-accounts");
      const json = await res.json();
      if (json.ok) {
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  // Filtered rows
  const allRows = useMemo(() => {
    if (!data?.mailboxes) return [];
    let list = data.mailboxes;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (m: any) =>
          m.email.toLowerCase().includes(q) ||
          m.senderName.toLowerCase().includes(q) ||
          m.domain.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, searchTerm]);

  // Pagination
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allRows.slice(start, start + pageSize);
  }, [allRows, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(allRows.length / pageSize));

  // Toggle selection
  function toggleSelectAll() {
    if (selectedMailboxIds.length === paginatedRows.length) {
      setSelectedMailboxIds([]);
    } else {
      setSelectedMailboxIds(paginatedRows.map((r: any) => r.id));
    }
  }

  function toggleSelectRow(id: string) {
    setSelectedMailboxIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  // Bulk actions
  async function handleBulkAction(action: string, extra?: Record<string, any>) {
    if (selectedMailboxIds.length === 0) return;
    try {
      const res = await fetch("/api/email-accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mailboxIds: selectedMailboxIds,
          action,
          ...extra,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "The change could not be applied");
      await loadAccounts(true);
      setSelectedMailboxIds([]);
      setIsBulkLimitOpen(false);
      const actionLabels: Record<string, string> = {
        warmup_on: "Warmup enabled",
        warmup_off: "Warmup disabled",
        pause: "Paused",
        activate: "Activated",
        set_limit: `Daily limit set to ${extra?.limit || 30}`,
        add_tag: "Tag added",
      };
      // Report what the server actually changed, not what was selected.
      setTestBanner({
        type: result.skipped > 0 ? "error" : "success",
        message: `${actionLabels[action] || action}: ${result.message || "done"}${
          result.skipped > 0 && action === "set_limit" ? " Daily limits apply to pool mailboxes only." : ""
        }`,
      });
    } catch (err: any) {
      setTestBanner({ type: "error", message: err.message || "The change could not be applied" });
    }
  }

  // Refresh single domain DNS
  async function refreshDomainDns(domain: string) {
    setDnsRefreshingDomain(domain);
    try {
      await fetch("/api/email-accounts/check-dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      await loadAccounts(true);
    } catch {
      // ignore
    } finally {
      setDnsRefreshingDomain(null);
    }
  }

  // Quick toggle warmup on/off for row
  async function toggleRowWarmup(row: any) {
    try {
      await fetch("/api/email-accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mailboxIds: [row.id],
          action: row.warmupEnabled ? "warmup_off" : "warmup_on",
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Could not change warmup");
        }
      });
      await loadAccounts(true);
    } catch (err: any) {
      setTestBanner({ type: "error", message: err.message || "Could not change warmup" });
    }
  }

  // Group paginated rows by domain folder
  const groupedFolders = useMemo(() => {
    const map: Record<string, any> = {};
    for (const folder of data?.domainFolders || []) {
      map[folder.domain] = { ...folder, mailboxes: [] };
    }
    for (const r of paginatedRows) {
      if (!map[r.domain]) {
        map[r.domain] = {
          domain: r.domain,
          dns: { spfStatus: "pass", dkimStatus: "pass", dmarcStatus: "pass", mxStatus: "pass" },
          mailboxCount: 0,
          avgHealth: 98,
          totalDailyCapacity: 0,
          mailboxes: [],
        };
      }
      map[r.domain].mailboxes.push(r);
    }
    return Object.values(map).filter((f: any) => f.mailboxes.length > 0);
  }, [data, paginatedRows]);

  // Zeros while loading: never show made-up numbers.
  const summary = data?.summary || {
    totalMailboxes: 0,
    warmingCount: 0,
    readyCount: 0,
    atRiskCount: 0,
    failingCount: 0,
    unmeasuredCount: 0,
    avgPlatformHealth: null,
  };

  return (
    <div className="space-y-6">
      {/* Mailboxes that cannot send, each with a direct fix */}
      {(() => {
        const failing = (data?.mailboxes || []).filter((m: any) => m.sendStatus === "failing");
        if (!failing.length) return null;
        return (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
            <p className="text-sm font-bold text-rose-900 dark:text-rose-100">
              {`${failing.length} mailbox${failing.length === 1 ? "" : "es"} can't send right now`}
            </p>
            <p className="mt-0.5 text-xs text-rose-800/90 dark:text-rose-200/90">
              Campaigns skip them until they work again. Open one to see what is wrong and fix it.
            </p>
            <ul className="mt-3 space-y-1.5">
              {failing.slice(0, 6).map((m: any) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2 dark:bg-black/20">
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-xs font-semibold text-slate-900 dark:text-white">{m.email}</span>
                    <span className="block truncate text-[11px] text-rose-700 dark:text-rose-300">{m.lastSendError}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFixMailbox({ id: m.id, email: m.email })}
                    className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                  >
                    {m.sendProblem === "wrong_password" ? "Fix password" : "Fix"}
                  </button>
                </li>
              ))}
            </ul>
            {failing.length > 6 && (
              <p className="mt-2 text-[11px] text-rose-800 dark:text-rose-200">
                +{failing.length - 6} more, marked "Sending failed" in the list below.
              </p>
            )}
          </div>
        );
      })()}

      {/* 1. TOP SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141326] border border-slate-200 dark:border-[#26253c] shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Mailboxes
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            {summary.totalMailboxes}
            <span className="text-xs font-normal text-indigo-600 dark:text-indigo-400">mailboxes</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Pool and connected accounts</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141326] border border-slate-200 dark:border-[#26253c] shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Campaign Ready
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-baseline gap-2">
            {summary.readyCount}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mailboxes</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Sending OK, health ≥90%, day 14+</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141326] border border-slate-200 dark:border-[#26253c] shadow-xs">
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Warming Up
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 flex items-baseline gap-2">
            {summary.warmingCount}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mailboxes</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Automated safe ramp-up</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141326] border border-slate-200 dark:border-[#26253c] shadow-xs">
          <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            At Risk
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 flex items-baseline gap-2">
            {summary.atRiskCount}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mailboxes</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {summary.failingCount > 0
              ? `${summary.failingCount} can't send right now`
              : "Skipped by campaigns until fixed"}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141326] border border-slate-200 dark:border-[#26253c] shadow-xs">
          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Platform Avg Health
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 flex items-baseline gap-2">
            {summary.avgPlatformHealth == null ? "—" : `${summary.avgPlatformHealth}%`}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">sending health</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {summary.avgPlatformHealth == null
              ? "No sends measured yet"
              : summary.unmeasuredCount > 0
                ? `7-day average · ${summary.unmeasuredCount} not measured yet`
                : "7-Day rolling average"}
          </div>
        </div>
      </div>

      {/* 2. TOP ACTION & CONTROL BAR (MATCHING PLUSVIBE REFERENCE SCREEN) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#141326] border border-slate-200 dark:border-[#26253c] shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by account address, first name or campaign name (Press enter)"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#0f0e1e] border border-slate-200 dark:border-[#26253c] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
          />
        </div>

        {/* Right controls: Page size + Pagination + Add Account Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Show N accounts per page */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Show</span>
            <input
              type="number"
              min="10"
              max="100"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Math.max(10, parseInt(e.target.value, 10) || 50));
                setPage(1);
              }}
              className="w-14 px-2 py-1 text-center rounded-lg bg-slate-50 dark:bg-[#0f0e1e] border border-slate-200 dark:border-[#26253c] text-slate-900 dark:text-white text-xs font-mono"
            />
            <span>accounts per page</span>
          </div>

          {/* Pagination Navigation */}
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
              title="First Page"
            >
              <HiOutlineChevronDoubleLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
              title="Previous Page"
            >
              <HiOutlineChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono text-slate-700 dark:text-slate-300">
              {allRows.length === 0 ? "0" : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, allRows.length)} of ${allRows.length}`}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
              title="Next Page"
            >
              <HiOutlineChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
              title="Last Page"
            >
              <HiOutlineChevronDoubleRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Warmup Test Button */}
          <button
            onClick={handleQuickWarmupTest}
            disabled={testingWarmup}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 font-semibold text-xs text-white transition shadow-sm cursor-pointer"
            title="Dispatch an instant warmup email across connected mailboxes to verify the engine is working"
          >
            {testingWarmup ? (
              <HiOutlineArrowPath className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <HiOutlineBolt className="w-3.5 h-3.5" />
            )}
            {testingWarmup ? "Testing Engine..." : "Test Warmup Engine"}
          </button>

          {/* Add Account Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white transition shadow-sm cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* TEST BANNER NOTIFICATION */}
      {testBanner && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            testBanner.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-100"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/30 text-rose-900 dark:text-rose-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{testBanner.type === "success" ? "✅" : "⚠️"}</span>
            <span className="font-medium">{testBanner.message}</span>
          </div>
          <button
            onClick={() => setTestBanner(null)}
            className="text-xs font-bold px-2 py-1 rounded-md opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. BULK ACTIONS BAR (When mailboxes are checked) */}
      {selectedMailboxIds.length > 0 && (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse" />
            <span>{selectedMailboxIds.length} mailboxes selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction("warmup_on")}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-600/30 hover:bg-emerald-200 dark:hover:bg-emerald-600/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 transition flex items-center gap-1 font-semibold"
            >
              <HiOutlineFire className="w-3.5 h-3.5" /> Enable Warmup
            </button>
            <button
              onClick={() => handleBulkAction("warmup_off")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 transition font-semibold"
            >
              Disable Warmup
            </button>
            <button
              onClick={() => handleBulkAction("pause")}
              className="px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-600/30 hover:bg-amber-200 dark:hover:bg-amber-600/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 transition flex items-center gap-1 font-semibold"
            >
              <HiOutlinePause className="w-3.5 h-3.5" /> Pause
            </button>
            <button
              onClick={() => setIsBulkLimitOpen(!isBulkLimitOpen)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold transition"
            >
              Set Limit
            </button>
            {isBulkLimitOpen && (
              <div className="flex items-center gap-1 bg-white dark:bg-[#141326] p-1 rounded-lg border border-slate-200 dark:border-[#2b2a45] shadow-md">
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={bulkLimitVal}
                  onChange={(e) => setBulkLimitVal(parseInt(e.target.value, 10))}
                  className="w-12 px-1 text-center bg-slate-50 dark:bg-black text-slate-900 dark:text-white border border-slate-200 dark:border-transparent rounded text-xs"
                />
                <button
                  onClick={() => handleBulkAction("set_limit", { limit: bulkLimitVal })}
                  className="px-2 py-0.5 bg-indigo-600 text-white rounded font-bold"
                >
                  Apply
                </button>
              </div>
            )}
            <button
              onClick={() => setSelectedMailboxIds([])}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* 4. DOMAIN FOLDERS & MAILBOX LIST (EXACT PLUSVIBE UX) */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#141326] rounded-2xl border border-slate-200 dark:border-[#26253c] shadow-xs">
          <HiOutlineArrowPath className="w-6 h-6 animate-spin mx-auto text-indigo-500 dark:text-indigo-400 mb-2" />
          Loading email accounts and verifying DNS compliance...
        </div>
      ) : groupedFolders.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#141326] rounded-2xl border border-slate-200 dark:border-[#26253c] shadow-xs">
          No email accounts match your search.
        </div>
      ) : (
        <div className="space-y-4">
          {groupedFolders.map((folder: any) => {
            const isCollapsed = Boolean(collapsedFolders[folder.domain]);
            const dns = folder.dns || {};

            return (
              <div
                key={folder.domain}
                className="rounded-2xl border border-slate-200 dark:border-[#26253c] bg-white dark:bg-[#141326] shadow-xs"
              >
                {/* DOMAIN FOLDER HEADER */}
                <div
                  onClick={() =>
                    setCollapsedFolders((prev) => ({
                      ...prev,
                      [folder.domain]: !prev[folder.domain],
                    }))
                  }
                  className={`flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50/90 dark:bg-[#17162b] cursor-pointer hover:bg-slate-100/80 dark:hover:bg-[#1a1930] transition select-none ${isCollapsed ? "rounded-2xl" : "rounded-t-2xl border-b border-slate-200 dark:border-[#26253c]"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 dark:text-slate-400">
                      {isCollapsed ? (
                        <HiOutlineChevronRight className="w-4 h-4" />
                      ) : (
                        <HiOutlineChevronDown className="w-4 h-4" />
                      )}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                      {folder.domain}
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-400 font-sans">
                        {folder.mailboxes.length} Mailboxes
                      </span>
                    </span>
                  </div>

                  {/* Domain DNS Badges + Capacity in Header */}
                  <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-xs">
                    {/* 4 DNS Badges for domain */}
                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFixDrawerDomain(folder.domain);
                      }}
                      title="Click to view DNS authentication status & Fix Drawer"
                    >
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${dnsBadgeClass(dns.spfStatus)}`} title={dnsBadgeTitle("SPF", dns.spfStatus, dns.spfRecord ?? dns.spfRecords, dns.lastCheckedAt)}>
                        SPF
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${dnsBadgeClass(dns.dkimStatus)}`} title={dnsBadgeTitle("DKIM", dns.dkimStatus, dns.dkimRecord ?? dns.dkimRecords, dns.lastCheckedAt)}>
                        DKIM
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${dnsBadgeClass(dns.dmarcStatus)}`} title={dnsBadgeTitle("DMARC", dns.dmarcStatus, dns.dmarcRecord ?? dns.dmarcRecords, dns.lastCheckedAt)}>
                        DMARC
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${dnsBadgeClass(dns.mxStatus)}`} title={dnsBadgeTitle("MX", dns.mxStatus, dns.mxRecord ?? dns.mxRecords, dns.lastCheckedAt)}>
                        MX
                      </span>
                    </div>

                    {/* Avg Health */}
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <HiOutlineHeart className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                      <span
                        className={`font-semibold ${
                          folder.failingCount > 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                        title={
                          folder.failingCount > 0
                            ? `${folder.failingCount} mailbox(es) on this domain cannot send`
                            : undefined
                        }
                      >
                        {folder.healthKnown === false ? "—" : `${folder.avgHealth}%`}
                      </span>
                    </div>

                    {/* Total Capacity */}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Daily Capacity:{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {folder.mailboxes.reduce(
                          (acc: number, m: any) => acc + m.campaignSends.limit,
                          0
                        )}{" "}
                        sends/day
                      </span>
                    </div>
                  </div>
                </div>

                {/* MAILBOX TABLE ROWS (Matching PlusVibe Columns) */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-200 dark:divide-[#201f35] overflow-visible">
                    {folder.mailboxes.map((row: any) => {
                      const isSelected = selectedMailboxIds.includes(row.id);
                      const isHealthGood = row.healthScore >= 90;
                      const isHealthWatch = row.healthScore >= 80 && row.healthScore < 90;

                      return (
                        <div
                          key={row.id}
                          className={`flex items-center justify-between gap-4 px-4 py-3 text-xs transition select-none ${
                            isSelected
                              ? "bg-indigo-50/70 dark:bg-indigo-950/20"
                              : "hover:bg-slate-50 dark:hover:bg-[#18172e]"
                          }`}
                        >
                          {/* Left: Checkbox + Mailbox Address + Sender Name + Status */}
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(row.id)}
                              className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-0"
                            />

                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                              <HiOutlineEnvelope className="w-4 h-4" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-2 font-semibold text-slate-900 dark:text-white">
                                <span className="truncate" title={row.email}>{row.email}</span>
                                <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent uppercase font-mono">
                                  {row.provider}
                                </span>
                              </div>
                              <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">{row.senderName}</div>
                              {row.sendStatus === "failing" && (
                                <div className="mt-0.5 flex min-w-0 items-center gap-2">
                                  <span
                                    className="truncate text-[11px] font-semibold text-rose-600 dark:text-rose-400"
                                    title={row.lastSendError || undefined}
                                  >
                                    {row.lastSendError || "Last send failed"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setFixMailbox({ id: row.id, email: row.email })}
                                    className="shrink-0 rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-700"
                                  >
                                    {row.sendProblem === "wrong_password" ? "Fix password" : "Fix"}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Status Pill */}
                            <span
                              className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                row.status === "Active"
                                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30"
                                  : row.status === "Sending failed"
                                    ? "cursor-pointer bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 hover:bg-rose-200"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                              }`}
                              role={row.sendStatus === "failing" ? "button" : undefined}
                              onClick={row.sendStatus === "failing" ? () => setFixMailbox({ id: row.id, email: row.email }) : undefined}
                              title={
                                row.sendStatus === "failing"
                                  ? `${row.lastSendError || "Last send failed"}${
                                      row.lastSendErrorAt ? ` (${new Date(row.lastSendErrorAt).toLocaleString()})` : ""
                                    }`
                                  : undefined
                              }
                            >
                              {row.status}
                            </span>
                          </div>

                          {/* Middle: PlusVibe Metric Icons (less important columns hide on narrower screens) */}
                          <div className="hidden shrink-0 items-center gap-4 md:flex 2xl:gap-6">
                            {/* Paper-plane: Campaign Emails Sent Today / Limit */}
                            <div
                              className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-[70px]"
                              title={`Campaign emails sent today: ${row.campaignSends.sent} / Daily limit: ${row.campaignSends.limit}`}
                            >
                              <HiOutlinePaperAirplane className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono">
                                {row.campaignSends.sent}/{row.campaignSends.limit}
                              </span>
                            </div>

                            {/* Thermometer: Warmup Emails Sent Today / Target */}
                            <div
                              className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-[70px]"
                              title={`Warmup emails sent today: ${row.warmupSends.sent} / Ramp target: ${row.warmupSends.target}`}
                            >
                              <HiOutlineFire
                                className={`w-3.5 h-3.5 ${
                                  row.warmupEnabled ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"
                                }`}
                              />
                              <span className="font-mono">
                                {row.warmupSends.sent}/{row.warmupSends.target}
                              </span>
                            </div>

                            {/* Heart: Health Score % */}
                            <div
                              className="flex items-center gap-1.5 min-w-[65px]"
                              title="7-day sending health: successful sends out of all attempts, bounces count as failures (— = no sends yet)"
                            >
                              <HiOutlineHeart
                                className={`w-3.5 h-3.5 ${
                                  isHealthGood
                                    ? "text-emerald-500 dark:text-emerald-400"
                                    : isHealthWatch
                                    ? "text-amber-500 dark:text-amber-400"
                                    : "text-rose-500 dark:text-rose-400"
                                }`}
                              />
                              <span
                                className={`font-mono font-bold ${
                                  isHealthGood
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : isHealthWatch
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {row.healthKnown === false ? "—" : `${row.healthScore}%`}
                              </span>
                            </div>

                            {/* Reply Arrow: Reply rate % */}
                            <div
                              className="hidden items-center gap-1 text-slate-600 dark:text-slate-300 min-w-[55px] lg:flex"
                              title="Campaign reply rate, last 30 days (— = no campaign sends yet)"
                            >
                              <HiOutlineArrowUturnLeft className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono">{row.replyRate == null ? "—" : `${row.replyRate}%`}</span>
                            </div>

                            {/* Down-right Arrow: Bounce rate % */}
                            <div
                              className="hidden items-center gap-1 min-w-[55px] lg:flex"
                              title="Campaign bounce rate, last 30 days; keep under 2% (— = no campaign sends yet)"
                            >
                              <HiOutlineArrowTrendingDown
                                className={`w-3.5 h-3.5 ${
                                  (row.bounceRate ?? 0) > 2 ? "text-amber-500 dark:text-amber-400" : "text-slate-400"
                                }`}
                              />
                              <span
                                className={`font-mono ${
                                  (row.bounceRate ?? 0) > 2 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                {row.bounceRate == null ? "—" : `${row.bounceRate}%`}
                              </span>
                            </div>

                            {/* Megaphone: Campaigns Attached */}
                            <div
                              className="hidden items-center gap-1 text-slate-600 dark:text-slate-300 min-w-[40px] xl:flex"
                              title={`Attached to ${row.attachedCampaigns} active campaign(s)`}
                            >
                              <HiOutlineMegaphone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono">{row.attachedCampaigns}</span>
                            </div>

                            {/* 4 DNS Badges */}
                            <div
                              className="hidden cursor-pointer items-center gap-1 2xl:flex"
                              onClick={() => setFixDrawerDomain(row.domain)}
                              title="Click to open DNS Fix Drawer"
                            >
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${dnsBadgeClass(dns.spfStatus)}`} title={dnsBadgeTitle("SPF", dns.spfStatus, dns.spfRecord ?? dns.spfRecords, dns.lastCheckedAt)}>
                        SPF
                      </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${dnsBadgeClass(dns.dkimStatus)}`} title={dnsBadgeTitle("DKIM", dns.dkimStatus, dns.dkimRecord ?? dns.dkimRecords, dns.lastCheckedAt)}>
                        DKIM
                      </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${dnsBadgeClass(dns.dmarcStatus)}`} title={dnsBadgeTitle("DMARC", dns.dmarcStatus, dns.dmarcRecord ?? dns.dmarcRecords, dns.lastCheckedAt)}>
                        DMARC
                      </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${dnsBadgeClass(dns.mxStatus)}`} title={dnsBadgeTitle("MX", dns.mxStatus, dns.mxRecord ?? dns.mxRecords, dns.lastCheckedAt)}>
                        MX
                      </span>
                            </div>
                          </div>

                          {/* Right: PlusVibe Action Icons */}
                          <div className="relative flex shrink-0 items-center gap-1">
                            {/* Re-check DNS & connection */}
                            <button
                              onClick={() => refreshDomainDns(row.domain)}
                              disabled={dnsRefreshingDomain === row.domain}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Re-run DNS and connection checks"
                            >
                              <HiOutlineArrowPath
                                className={`w-4 h-4 ${
                                  dnsRefreshingDomain === row.domain ? "animate-spin" : ""
                                }`}
                              />
                            </button>

                            {/* Thermometer Quick Toggle / Modal */}
                            <button
                              onClick={() => setWarmupSettingsMailbox(row)}
                              className={`p-1.5 rounded-lg transition ${
                                row.warmupEnabled
                                  ? "text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                                  : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                              title={
                                row.warmupEnabled
                                  ? "Warmup is ON - Click to edit settings"
                                  : "Warmup is PAUSED - Click to activate"
                              }
                            >
                              <HiOutlineFire className="w-4 h-4" />
                            </button>

                            {/* Warmup emails sent / received by this mailbox */}
                            <button
                              onClick={() => setWarmupInboxMailbox(row.email)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="View warmup emails sent and received"
                              aria-label="View warmup emails"
                            >
                              <HiOutlineEnvelope className="w-4 h-4" />
                            </button>

                            {/* Analytics Chart Drawer */}
                            <button
                              onClick={() => setAnalyticsMailbox(row.email)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Open deliverability analytics chart"
                            >
                              <HiOutlineChartBar className="w-4 h-4" />
                            </button>

                            {/* Three dots menu */}
                            <button
                              onClick={() =>
                                setActiveMenuId(activeMenuId === row.id ? null : row.id)
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                              <HiOutlineEllipsisHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === row.id && (
                              <div className="absolute right-0 top-8 z-30 w-48 rounded-xl bg-white dark:bg-[#1b1a32] border border-slate-200 dark:border-[#2b2a45] shadow-2xl p-1 text-xs text-slate-800 dark:text-slate-200 animate-in fade-in duration-100">
                                <button
                                  onClick={() => {
                                    setWarmupSettingsMailbox(row);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <HiOutlineFire className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                                  Warmup Settings
                                </button>
                                <button
                                  onClick={() => {
                                    toggleRowWarmup(row);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  {row.warmupEnabled ? (
                                    <>
                                      <HiOutlinePause className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                      Pause Warmup
                                    </>
                                  ) : (
                                    <>
                                      <HiOutlinePlay className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      Resume Warmup
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setFixMailbox({ id: row.id, email: row.email });
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <HiOutlineShieldCheck className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                  Fix / update login
                                </button>
                                <button
                                  onClick={() => {
                                    setWarmupInboxMailbox(row.email);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <HiOutlineEnvelope className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                  View warmup emails
                                </button>
                                <button
                                  onClick={() => {
                                    setAnalyticsMailbox(row.email);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <HiOutlineChartBar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                  View Trend Charts
                                </button>
                                <button
                                  onClick={() => {
                                    setFixDrawerDomain(row.domain);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <HiOutlineShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  DNS Fix Drawer
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. SLIDE-OVER DRAWERS & MODALS */}
      {fixDrawerDomain && (
        <DnsFixDrawer
          isOpen={Boolean(fixDrawerDomain)}
          onClose={() => setFixDrawerDomain(null)}
          domain={fixDrawerDomain}
          dnsData={
            data?.domainFolders?.find((f: any) => f.domain === fixDrawerDomain)?.dns
          }
          onRefreshDns={refreshDomainDns}
        />
      )}

      {fixMailbox && (
        <FixMailboxModal
          key={fixMailbox.id}
          mailboxId={fixMailbox.id}
          mailboxEmail={fixMailbox.email}
          onClose={() => setFixMailbox(null)}
          onFixed={() => loadAccounts(true)}
        />
      )}

      {warmupInboxMailbox && (
        <WarmupMessagesDrawer
          mailboxEmail={warmupInboxMailbox}
          onClose={() => setWarmupInboxMailbox(null)}
        />
      )}

      {analyticsMailbox && (
        <AnalyticsDrawer
          isOpen={Boolean(analyticsMailbox)}
          onClose={() => setAnalyticsMailbox(null)}
          mailboxEmail={analyticsMailbox}
        />
      )}

      {isAddModalOpen && (
        <AddAccountModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAccountAdded={loadAccounts}
        />
      )}

      {warmupSettingsMailbox && (
        <WarmupSettingsModal
          key={warmupSettingsMailbox.id}
          isOpen={Boolean(warmupSettingsMailbox)}
          onClose={() => setWarmupSettingsMailbox(null)}
          mailbox={warmupSettingsMailbox}
          onSettingsSaved={loadAccounts}
        />
      )}
    </div>
  );
}

/** One colour scheme for DNS badges: green pass, amber warn, red fail, grey not checked. */
function dnsBadgeClass(status?: string | null): string {
  switch (status) {
    case "pass":
      return "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40";
    case "warn":
      return "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40";
    case "fail":
      return "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40";
    default:
      return "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600";
  }
}

function dnsBadgeTitle(label: string, status?: string | null, record?: string | null, checkedAt?: string | null): string {
  const word =
    status === "pass" ? "OK" : status === "warn" ? "Needs attention" : status === "fail" ? "Missing or broken" : "Not checked yet";
  const when = checkedAt ? ` · checked ${new Date(checkedAt).toLocaleString()}` : "";
  return `${label}: ${word}${record ? ` — ${record}` : ""}${when}. Click for details and fix steps.`;
}
