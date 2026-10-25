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
        message: `⚡ Live Warmup Test Succeeded! Sent from ${data.details.from} to ${data.details.to} ("${data.details.subject}") via Hostinger Relay.`,
      });
      await loadAccounts();
    } catch (err: any) {
      setTestBanner({
        type: "error",
        message: `Warmup test failed: ${err.message || String(err)}`,
      });
    } finally {
      setTestingWarmup(false);
    }
  }

  async function loadAccounts() {
    setLoading(true);
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
      await fetch("/api/email-accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mailboxIds: selectedMailboxIds,
          action,
          ...extra,
        }),
      });
      await loadAccounts();
      setSelectedMailboxIds([]);
      setIsBulkLimitOpen(false);
    } catch {
      // ignore
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
      await loadAccounts();
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
      });
      await loadAccounts();
    } catch {
      // ignore
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

  const summary = data?.summary || {
    totalMailboxes: 65,
    warmingCount: 12,
    readyCount: 53,
    atRiskCount: 0,
    avgPlatformHealth: 98.3,
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141326] border border-slate-200 dark:border-[#26253c] shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Mailboxes
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            {summary.totalMailboxes}
            <span className="text-xs font-normal text-indigo-600 dark:text-indigo-400">active pool</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Across Hostinger & GoDaddy</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141326] border border-slate-200 dark:border-[#26253c] shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Campaign Ready
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-baseline gap-2">
            {summary.readyCount}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mailboxes</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Health ≥90% & Day 14+</div>
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
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Auto-paused from sends</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141326] border border-slate-200 dark:border-[#26253c] shadow-xs">
          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Platform Avg Health
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 flex items-baseline gap-2">
            {summary.avgPlatformHealth}%
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">inbox rate</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">7-Day rolling average</div>
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
        <div className="flex items-center gap-3">
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
            {testingWarmup ? "Testing Engine..." : "⚡ Test Warmup Engine"}
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
                className="rounded-2xl border border-slate-200 dark:border-[#26253c] bg-white dark:bg-[#141326] overflow-hidden shadow-xs"
              >
                {/* DOMAIN FOLDER HEADER */}
                <div
                  onClick={() =>
                    setCollapsedFolders((prev) => ({
                      ...prev,
                      [folder.domain]: !prev[folder.domain],
                    }))
                  }
                  className="p-3.5 bg-slate-50/90 dark:bg-[#17162b] border-b border-slate-200 dark:border-[#26253c] flex items-center justify-between cursor-pointer hover:bg-slate-100/80 dark:hover:bg-[#1a1930] transition select-none"
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
                  <div className="flex items-center gap-4 text-xs">
                    {/* 4 DNS Badges for domain */}
                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFixDrawerDomain(folder.domain);
                      }}
                      title="Click to view DNS authentication status & Fix Drawer"
                    >
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          dns.spfStatus === "pass"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : dns.spfStatus === "warn"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        }`}
                      >
                        SPF
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          dns.dkimStatus === "pass"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : dns.dkimStatus === "warn"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        }`}
                      >
                        DKIM
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          dns.dmarcStatus === "pass"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : dns.dmarcStatus === "warn"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        }`}
                      >
                        DMARC
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          dns.mxStatus === "pass"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : dns.mxStatus === "warn"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        }`}
                      >
                        MX
                      </span>
                    </div>

                    {/* Avg Health */}
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <HiOutlineHeart className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {folder.avgHealth}%
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
                  <div className="divide-y divide-slate-200 dark:divide-[#201f35] overflow-x-auto">
                    {folder.mailboxes.map((row: any) => {
                      const isSelected = selectedMailboxIds.includes(row.id);
                      const isHealthGood = row.healthScore >= 90;
                      const isHealthWatch = row.healthScore >= 80 && row.healthScore < 90;

                      return (
                        <div
                          key={row.id}
                          className={`flex items-center justify-between px-4 py-3 text-xs transition select-none ${
                            isSelected
                              ? "bg-indigo-50/70 dark:bg-indigo-950/20"
                              : "hover:bg-slate-50 dark:hover:bg-[#18172e]"
                          }`}
                        >
                          {/* Left: Checkbox + Mailbox Address + Sender Name + Status */}
                          <div className="flex items-center gap-3 min-w-[320px]">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(row.id)}
                              className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-0"
                            />

                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                              <HiOutlineEnvelope className="w-4 h-4" />
                            </div>

                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{row.email}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent uppercase font-mono">
                                  {row.provider}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">{row.senderName}</div>
                            </div>

                            {/* Status Pill */}
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                row.status === "Active"
                                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30"
                                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {row.status}
                            </span>
                          </div>

                          {/* Middle: PlusVibe Metric Icons */}
                          <div className="flex items-center gap-6">
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
                              title="7-day rolling Warmup Health score (% of emails landing in Inbox vs Spam)"
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
                                {row.healthScore}%
                              </span>
                            </div>

                            {/* Reply Arrow: Reply rate % */}
                            <div
                              className="flex items-center gap-1 text-slate-600 dark:text-slate-300 min-w-[55px]"
                              title="Campaign reply rate"
                            >
                              <HiOutlineArrowUturnLeft className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono">{row.replyRate}%</span>
                            </div>

                            {/* Down-right Arrow: Bounce rate % */}
                            <div
                              className="flex items-center gap-1 min-w-[55px]"
                              title="Hard bounce rate (should stay under 2-3%)"
                            >
                              <HiOutlineArrowTrendingDown
                                className={`w-3.5 h-3.5 ${
                                  row.bounceRate > 2 ? "text-amber-500 dark:text-amber-400" : "text-slate-400"
                                }`}
                              />
                              <span
                                className={`font-mono ${
                                  row.bounceRate > 2 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                {row.bounceRate}%
                              </span>
                            </div>

                            {/* Megaphone: Campaigns Attached */}
                            <div
                              className="flex items-center gap-1 text-slate-600 dark:text-slate-300 min-w-[40px]"
                              title={`Attached to ${row.attachedCampaigns} active campaign(s)`}
                            >
                              <HiOutlineMegaphone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono">{row.attachedCampaigns}</span>
                            </div>

                            {/* 4 DNS Badges */}
                            <div
                              className="flex items-center gap-1 cursor-pointer"
                              onClick={() => setFixDrawerDomain(row.domain)}
                              title="Click to open DNS Fix Drawer"
                            >
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                  dns.spfStatus === "pass"
                                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-transparent"
                                    : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-transparent"
                                }`}
                              >
                                SPF
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                  dns.dkimStatus === "pass"
                                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-transparent"
                                    : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-transparent"
                                }`}
                              >
                                DKIM
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                  dns.dmarcStatus === "pass"
                                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-transparent"
                                    : dns.dmarcStatus === "warn"
                                    ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-transparent"
                                    : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-transparent"
                                }`}
                              >
                                DMARC
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                  dns.mxStatus === "pass"
                                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-transparent"
                                    : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-transparent"
                                }`}
                              >
                                MX
                              </span>
                            </div>
                          </div>

                          {/* Right: PlusVibe Action Icons */}
                          <div className="flex items-center gap-1 relative">
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
          isOpen={Boolean(warmupSettingsMailbox)}
          onClose={() => setWarmupSettingsMailbox(null)}
          mailbox={warmupSettingsMailbox}
          onSettingsSaved={loadAccounts}
        />
      )}
    </div>
  );
}
