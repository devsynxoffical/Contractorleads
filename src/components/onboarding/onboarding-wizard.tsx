"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const questions = [
  {
    key: "companyName",
    label: "What's your company name?",
    placeholder: "Million Dollar Media",
    type: "input" as const,
  },
  {
    key: "businessDescription",
    label: "Describe your business in one sentence",
    placeholder: "We help home-service contractors get more leads through paid media",
    type: "textarea" as const,
  },
  {
    key: "services",
    label: "What services do you offer?",
    placeholder: "Facebook ads, Google ads, funnel builds, creative",
    type: "textarea" as const,
  },
  {
    key: "idealCustomer",
    label: "Who is your ideal customer?",
    placeholder: "Roofing and HVAC owners doing $500K–$3M/year",
    type: "textarea" as const,
  },
  {
    key: "serviceAreas",
    label: "What areas do you serve?",
    placeholder: "United States — primarily Texas, Florida, Arizona",
    type: "input" as const,
  },
  {
    key: "mainGoal",
    label: "What's your main goal right now?",
    placeholder: "Book 8 new agency clients per month",
    type: "textarea" as const,
  },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState(false);
  const [loading, setLoading] = useState(false);

  const current = questions[step];

  async function saveProfile(skip = false) {
    setLoading(true);
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...answers, onboardingComplete: !skip }),
    });
    router.push("/home");
    router.refresh();
  }

  if (summary) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Confirm your profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q) => (
            <div key={q.key}>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                {q.label}
              </p>
              <p className="mt-1 text-sm text-ink">{answers[q.key] || "—"}</p>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setSummary(false)} variant="secondary">
              Edit
            </Button>
            <Button onClick={() => saveProfile(false)} disabled={loading}>
              Save & continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <p className="text-xs font-medium text-ink-muted">
          Step {step + 1} of {questions.length}
        </p>
        <CardTitle className="mt-2 text-lg">{current.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {current.type === "input" ? (
          <Input
            value={answers[current.key] || ""}
            onChange={(e) =>
              setAnswers((a) => ({ ...a, [current.key]: e.target.value }))
            }
            placeholder={current.placeholder}
          />
        ) : (
          <Textarea
            value={answers[current.key] || ""}
            onChange={(e) =>
              setAnswers((a) => ({ ...a, [current.key]: e.target.value }))
            }
            placeholder={current.placeholder}
          />
        )}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => saveProfile(true)}
            className="text-sm text-ink-muted hover:text-ink"
          >
            Skip for now
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button
              onClick={() => {
                if (step < questions.length - 1) setStep(step + 1);
                else setSummary(true);
              }}
              disabled={!answers[current.key]?.trim()}
            >
              {step < questions.length - 1 ? "Next" : "Review"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
