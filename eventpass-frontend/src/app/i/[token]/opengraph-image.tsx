import { ImageResponse } from "next/og";

export const alt = "Wedding invitation — Ikram Halane & Nebil Yusuf";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #f5f0e6 0%, #e8e2d4 50%, #ddd6c6 100%)",
          fontFamily: "serif",
          padding: 60,
        }}
      >
        <div
          style={{
            border: "6px solid #c59b27",
            boxShadow: "0 0 60px rgba(197,155,39,0.35)",
            background: "#fcfbfa",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 80px",
            width: "86%",
            height: "78%",
          }}
        >
          <div
            style={{
              fontSize: 28,
              letterSpacing: 8,
              color: "#b58d3d",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            You&apos;re Invited
          </div>
          <div
            style={{
              fontSize: 88,
              color: "#9a7428",
              textAlign: "center",
              lineHeight: 1.05,
            }}
          >
            Ikram Halane
          </div>
          <div style={{ fontSize: 56, color: "#c59b27", margin: "4px 0" }}>&amp;</div>
          <div
            style={{
              fontSize: 88,
              color: "#9a7428",
              textAlign: "center",
              lineHeight: 1.05,
            }}
          >
            Nebil Yusuf
          </div>
          <div
            style={{
              fontSize: 30,
              letterSpacing: 6,
              color: "#8a641c",
              marginTop: 32,
              textTransform: "uppercase",
            }}
          >
            October 18, 2026 · Woodbine Banquet Hall
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
