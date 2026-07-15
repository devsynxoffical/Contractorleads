"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const types = [
  { key: "email", label: "Cold Email" },
  { key: "sms", label: "Cold SMS" },
  { key: "followup", label: "Follow-up" },
  { key: "sales_script", label: "Sales Script" },
];

export function OutreachStudio({
  leadId,
  businessName,
}: {
  leadId: string;
  businessName: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  async function generate(type: string) {
    setLoading(type);
    setError("");
    const res = await fetch("/api/ai/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, type }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Generation failed");
      setLoading(null);
      return;
    }
    setContent(data.script.content);
    setLoading(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Outreach Studio</CardTitle>
        <p className="text-sm text-ink-muted">
          Personalized outreach for {businessName}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <Button
              key={t.key}
              variant="secondary"
              size="sm"
              onClick={() => generate(t.key)}
              disabled={loading !== null}
            >
              {loading === t.key ? "Generating…" : t.label}
            </Button>
          ))}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {content && (
          <div className="rounded-lg border border-border bg-[#FBFAF8] p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => navigator.clipboard.writeText(content)}
            >
              Copy
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
