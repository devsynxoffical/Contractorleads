import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deductCredits, logActivity } from "@/lib/credits";
import { getWaterfallEnrichCreditCost } from "@/lib/plans";
import { insufficientCreditsPayload } from "@/lib/lead-access";
import {
  runWaterfallEnrichment,
  type WaterfallInput,
  type WaterfallResult,
} from "@/lib/services/waterfall-enrichment";

export const maxDuration = 300;

/**
 * Returns the current admin-configured Waterfall Enrichment credit fee
 * and the signed-in user's remaining credit balance.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creditCostPerLead = await getWaterfallEnrichCreditCost();
  return NextResponse.json({
    creditCostPerLead,
    creditsRemaining: user.creditsRemaining,
  });
}

/**
 * Bulk & Datasheet Waterfall Enrichment endpoint.
 * Accepts uploaded datasheet rows or existing lead items, runs sequential
 * waterfall enrichment (Internal DB -> Website -> Public Web -> External APIs),
 * and charges the admin-configured enrichment fee ONLY for rows where verified
 * contact info is found.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rawItems = Array.isArray(body.items) ? (body.items as WaterfallInput[]) : [];
  const items = rawItems
    .filter((it) => it && typeof it.businessName === "string" && it.businessName.trim())
    .slice(0, 500);

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Please provide at least one lead or datasheet row to enrich." },
      { status: 400 },
    );
  }

  const creditCostPerLead = await getWaterfallEnrichCreditCost();
  const freshUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { creditsRemaining: true },
  });
  let creditsRemaining = freshUser?.creditsRemaining ?? user.creditsRemaining;

  if (creditCostPerLead > 0 && creditsRemaining < creditCostPerLead) {
    return NextResponse.json(
      insufficientCreditsPayload(creditCostPerLead, creditsRemaining),
      { status: 402 },
    );
  }

  const wantsStream =
    body.stream === true ||
    request.headers.get("accept")?.includes("text/event-stream");

  if (wantsStream) {
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = async (event: string, data: unknown) => {
      try {
        await writer.write(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      } catch {
        /* client disconnected */
      }
    };

    void writer.write(encoder.encode(": connected\n\n"));

    (async () => {
      try {
        await sendEvent("start", {
          total: items.length,
          creditCostPerLead,
          creditsRemaining,
        });

        const results: Array<WaterfallResult & { rowIndex: number; charged: number }> = [];
        let totalCharged = 0;
        let enrichedCount = 0;
        let stoppedForCredits = false;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          // Check if user still has enough credits before running external waterfall
          if (creditCostPerLead > 0 && creditsRemaining < creditCostPerLead) {
            stoppedForCredits = true;
            break;
          }

          const res = await runWaterfallEnrichment(item);
          const shouldBill =
            creditCostPerLead > 0 &&
            (res.newlyFoundFields.length > 0 ||
              (res.emailVerified && !item.email));

          let rowCharged = 0;
          if (shouldBill) {
            try {
              creditsRemaining = await deductCredits(
                user.id,
                creditCostPerLead,
                "waterfall_enrich",
                res.leadId || item.businessName,
              );
              rowCharged = creditCostPerLead;
              totalCharged = Math.round((totalCharged + rowCharged) * 100) / 100;
              enrichedCount += 1;
            } catch (err) {
              if (err instanceof Error && err.message === "INSUFFICIENT_CREDITS") {
                stoppedForCredits = true;
                break;
              }
            }
          } else if (res.foundVerifiedContact) {
            enrichedCount += 1;
          }

          const payload = { ...res, rowIndex: i, charged: rowCharged };
          results.push(payload);

          await sendEvent("row", {
            current: i + 1,
            total: items.length,
            rowIndex: i,
            result: payload,
            totalCharged,
            creditsRemaining,
          });
        }

        if (totalCharged > 0 || enrichedCount > 0) {
          await logActivity(
            user.id,
            "waterfall_enrich_bulk",
            `Waterfall enriched ${enrichedCount}/${items.length} leads (${totalCharged} credits charged)`,
            {
              totalItems: items.length,
              enrichedCount,
              totalCharged,
              creditCostPerLead,
            },
          );
        }

        await sendEvent("done", {
          ok: true,
          results,
          stats: {
            totalProcessed: results.length,
            enrichedCount,
            withVerifiedEmail: results.filter((r) => r.email && r.emailVerified).length,
            withPhone: results.filter((r) => Boolean(r.phone)).length,
            withOwner: results.filter((r) => Boolean(r.ownerName)).length,
            totalCharged,
            creditCostPerLead,
            creditsRemaining,
            stoppedForCredits,
          },
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Bulk waterfall enrichment failed";
        await sendEvent("error", { error: message });
      } finally {
        try {
          await writer.close();
        } catch {
          /* ignore */
        }
      }
    })();

    return new Response(responseStream.readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // Non-streaming JSON mode
  const results: Array<WaterfallResult & { rowIndex: number; charged: number }> = [];
  let totalCharged = 0;
  let enrichedCount = 0;
  let stoppedForCredits = false;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (creditCostPerLead > 0 && creditsRemaining < creditCostPerLead) {
      stoppedForCredits = true;
      break;
    }

    const res = await runWaterfallEnrichment(item);
    const shouldBill =
      creditCostPerLead > 0 &&
      (res.newlyFoundFields.length > 0 || (res.emailVerified && !item.email));

    let rowCharged = 0;
    if (shouldBill) {
      try {
        creditsRemaining = await deductCredits(
          user.id,
          creditCostPerLead,
          "waterfall_enrich",
          res.leadId || item.businessName,
        );
        rowCharged = creditCostPerLead;
        totalCharged = Math.round((totalCharged + rowCharged) * 100) / 100;
        enrichedCount += 1;
      } catch (err) {
        if (err instanceof Error && err.message === "INSUFFICIENT_CREDITS") {
          stoppedForCredits = true;
          break;
        }
      }
    } else if (res.foundVerifiedContact) {
      enrichedCount += 1;
    }

    results.push({ ...res, rowIndex: i, charged: rowCharged });
  }

  if (totalCharged > 0 || enrichedCount > 0) {
    await logActivity(
      user.id,
      "waterfall_enrich_bulk",
      `Waterfall enriched ${enrichedCount}/${items.length} leads (${totalCharged} credits charged)`,
      {
        totalItems: items.length,
        enrichedCount,
        totalCharged,
        creditCostPerLead,
      },
    );
  }

  return NextResponse.json({
    ok: true,
    results,
    stats: {
      totalProcessed: results.length,
      enrichedCount,
      withVerifiedEmail: results.filter((r) => r.email && r.emailVerified).length,
      withPhone: results.filter((r) => Boolean(r.phone)).length,
      withOwner: results.filter((r) => Boolean(r.ownerName)).length,
      totalCharged,
      creditCostPerLead,
      creditsRemaining,
      stoppedForCredits,
    },
  });
}
