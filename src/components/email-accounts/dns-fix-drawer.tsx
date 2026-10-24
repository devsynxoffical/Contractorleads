"use client";

import { useState } from "react";
import {
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineClipboardDocument,
  HiOutlineArrowPath,
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
  HiOutlineXCircle,
} from "react-icons/hi2";

export type DnsFixDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
  dnsData: any;
  onRefreshDns: (domain: string) => Promise<void>;
};

export function DnsFixDrawer({
  isOpen,
  onClose,
  domain,
  dnsData,
  onRefreshDns,
}: DnsFixDrawerProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await onRefreshDns(domain);
    setIsRefreshing(false);
  }

  const provider = dnsData?.provider || "hostinger";

  // Provider specific records recommendations
  const records = [
    {
      type: "SPF (Sender Policy Framework)",
      badge: "SPF",
      status: dnsData?.spfStatus || "pass",
      recordFound: dnsData?.spfRecord || "No SPF record found",
      host: "@",
      recordType: "TXT",
      recommended:
        provider === "google"
          ? "v=spf1 include:_spf.google.com ~all"
          : provider === "microsoft"
          ? "v=spf1 include:spf.protection.outlook.com -all"
          : provider === "godaddy"
          ? "v=spf1 include:secureserver.net ~all"
          : "v=spf1 include:_spf.mail.hostinger.com ~all",
      explanation:
        "Proves to Gmail and Outlook which mail servers have permission to send emails from @" + domain,
    },
    {
      type: "DKIM (DomainKeys Identified Mail)",
      badge: "DKIM",
      status: dnsData?.dkimStatus || "pass",
      recordFound: dnsData?.dkimRecord || "No DKIM record found",
      host: dnsData?.dkimSelector ? `${dnsData.dkimSelector}._domainkey` : "google._domainkey",
      recordType: "TXT",
      recommended:
        dnsData?.dkimRecord ||
        "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
      explanation:
        "Cryptographically signs every outgoing email so recipients know the message was not modified in transit.",
    },
    {
      type: "DMARC (Domain-based Message Authentication)",
      badge: "DMARC",
      status: dnsData?.dmarcStatus || "pass",
      recordFound: dnsData?.dmarcRecord || "No DMARC record found",
      host: "_dmarc",
      recordType: "TXT",
      recommended: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${domain}`,
      explanation:
        "Tells recipient servers to quarantine spoofed emails and send daily deliverability reports.",
    },
    {
      type: "MX (Mail Exchange)",
      badge: "MX",
      status: dnsData?.mxStatus || "pass",
      recordFound: dnsData?.mxRecords || "No MX records found",
      host: "@",
      recordType: "MX",
      recommended:
        provider === "google"
          ? "1 smtp.google.com"
          : provider === "microsoft"
          ? `0 ${domain.replace(/\./g, "-")}.mail.protection.outlook.com`
          : provider === "godaddy"
          ? "0 smtp.secureserver.net"
          : "5 mx1.hostinger.com, 10 mx2.hostinger.com",
      explanation:
        "Directs incoming replies and bounce notifications back to your mailbox.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#141326] border-l border-[#26253c] p-6 shadow-2xl flex flex-col h-full overflow-y-auto text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#26253c]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <HiOutlineShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                DNS Authentication & Fix
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {domain}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified records required by Gmail & Yahoo bulk-sender rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Re-test Action Bar */}
        <div className="my-5 p-3.5 rounded-xl bg-[#1b1a32] border border-[#2b2a45] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">Live DNS Resolution</div>
            <div className="text-[11px] text-slate-400">
              Provider detected: <span className="font-semibold text-indigo-300 capitalize">{provider}</span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition disabled:opacity-50"
          >
            <HiOutlineArrowPath className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Checking DNS..." : "Re-test DNS Now"}
          </button>
        </div>

        {/* Record Cards */}
        <div className="space-y-4 flex-1">
          {records.map((rec) => {
            const isPass = rec.status === "pass";
            const isWarn = rec.status === "warn";
            const isFail = rec.status === "fail";

            return (
              <div
                key={rec.badge}
                className="p-4 rounded-xl border border-[#26253c] bg-[#17162b] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md font-mono ${
                        isPass
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : isWarn
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {rec.badge}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">{rec.type}</span>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] font-medium">
                    {isPass && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <HiOutlineCheck className="w-3.5 h-3.5" /> Passing
                      </span>
                    )}
                    {isWarn && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <HiOutlineExclamationTriangle className="w-3.5 h-3.5" /> Weak / Monitoring
                      </span>
                    )}
                    {isFail && (
                      <span className="text-rose-400 flex items-center gap-1">
                        <HiOutlineXCircle className="w-3.5 h-3.5" /> Missing / Failed
                      </span>
                    )}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">{rec.explanation}</p>

                {/* Found record */}
                <div className="text-[11px] bg-[#0f0e1e] p-2.5 rounded-lg border border-[#201f35] font-mono text-slate-300 break-all">
                  <div className="text-[10px] text-slate-500 mb-1">CURRENT RECORD FOUND:</div>
                  {rec.recordFound}
                </div>

                {/* Recommended fix if not passing */}
                {(!isPass || isWarn) && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-semibold text-amber-300">
                      Recommended DNS Record to Add in {provider.toUpperCase()}:
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Type</span>
                        <span className="font-mono">{rec.recordType}</span>
                      </div>
                      <div className="col-span-1">
                        <span className="text-slate-500 block text-[10px]">Host</span>
                        <span className="font-mono">{rec.host}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-slate-500 block text-[10px]">Value</span>
                        <button
                          onClick={() => copyToClipboard(rec.recommended, rec.badge)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                        >
                          {copiedKey === rec.badge ? (
                            <>
                              <HiOutlineCheck className="w-3 h-3 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <HiOutlineClipboardDocument className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="p-2 bg-[#0c0b17] border border-indigo-950/60 rounded text-[11px] font-mono text-indigo-200 break-all select-all">
                      {rec.recommended}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#26253c] mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>DNS changes can take up to 15-30 minutes to propagate worldwide.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
