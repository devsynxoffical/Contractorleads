import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Contractor Leads — verified contractor leads for agencies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background:
            "linear-gradient(135deg, #0c0820 0%, #1a1035 40%, #4a1d6a 75%, #c026d3 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background:
                "linear-gradient(135deg, #db2777 0%, #c026d3 50%, #7c3aed 100%)",
            }}
          />
          Contractor Leads
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              maxWidth: 900,
            }}
          >
            Verified contractor leads for agencies
          </div>
          <div
            style={{
              fontSize: 26,
              color: "rgba(255,255,255,0.78)",
              maxWidth: 820,
              lineHeight: 1.35,
            }}
          >
            AI-scored home-service prospects · real contacts · no fake lists
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          www.contractorleads.us
        </div>
      </div>
    ),
    { ...size },
  );
}
