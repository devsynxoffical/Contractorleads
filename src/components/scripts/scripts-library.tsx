"use client";

import { useState } from "react";
import { HiOutlineClipboardDocument, HiOutlineTrash } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Script = {
  id: string;
  type: string;
  title: string | null;
  content: string;
  createdAt: Date;
};

export function ScriptsLibrary({ initialScripts }: { initialScripts: Script[] }) {
  const [scripts, setScripts] = useState(initialScripts);
  const [query, setQuery] = useState("");

  const filtered = scripts.filter(
    (s) =>
      s.content.toLowerCase().includes(query.toLowerCase()) ||
      s.title?.toLowerCase().includes(query.toLowerCase())
  );

  async function remove(id: string) {
    await fetch(`/api/scripts/${id}`, { method: "DELETE" });
    setScripts((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div>
      <input
        type="search"
        placeholder="Search scripts…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 h-10 w-full max-w-sm rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
      />
      <div className="grid gap-3">
        {filtered.map((script) => (
          <Card
            key={script.id}
            className="border-border shadow-[var(--shadow-card)] transition hover:border-brand-200"
          >
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                    {script.type.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 font-medium">{script.title || "Untitled"}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{script.content}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigator.clipboard.writeText(script.content)}
                  >
                    <HiOutlineClipboardDocument className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(script.id)}>
                    <HiOutlineTrash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!filtered.length && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-ink-muted">
              No scripts saved yet. Ask Expert and tap Save to Scripts.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
