import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt =
  "Pixelise — transform ordinary product photos into extraordinary visuals";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(file: string) {
  return readFile(path.join(process.cwd(), "src/fonts", file));
}

export default async function OpengraphImage() {
  const [extraBold, medium] = await Promise.all([
    loadFont("Manrope-ExtraBold.ttf"),
    loadFont("Manrope-Medium.ttf"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#FFFFFF",
          padding: "64px 72px",
          fontFamily: "Manrope",
          position: "relative",
        }}
      >
        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              backgroundColor: "#6045F5",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <div style={{ display: "flex", gap: 3 }}>
              <div style={{ width: 13, height: 13, borderRadius: 3, background: "#fff" }} />
              <div
                style={{ width: 13, height: 13, borderRadius: 3, background: "#fff", opacity: 0.55 }}
              />
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              <div
                style={{ width: 13, height: 13, borderRadius: 3, background: "#fff", opacity: 0.55 }}
              />
              <div style={{ width: 13, height: 13, borderRadius: 3, background: "#fff" }} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1.4, color: "#15152C" }}>
            Pixelise
          </div>
          <div
            style={{
              marginLeft: 10,
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: 2,
              color: "#6F7083",
            }}
          >
            AI PRODUCT PHOTOGRAPHY STUDIO
          </div>
        </div>

        {/* headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: -2.6,
            lineHeight: 1.1,
            color: "#15152C",
            maxWidth: 960,
          }}
        >
          <span>Transform ordinary product</span>
          <span style={{ display: "flex" }}>
            <span>photos into</span>
            <span style={{ color: "#6045F5", marginLeft: 18 }}>extraordinary</span>
          </span>
          <span>visuals for your store.</span>
        </div>

        {/* footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #ECEAF4",
            paddingTop: 24,
            fontSize: 20,
            fontWeight: 500,
            color: "#6F7083",
          }}
        >
          <span>Studio · Ecommerce · AI product photography</span>
          <span style={{ color: "#6045F5", fontWeight: 800 }}>pixelise.in</span>
        </div>

        {/* restrained accent */}
        <div
          style={{
            position: "absolute",
            right: -160,
            top: -160,
            width: 460,
            height: 460,
            borderRadius: 460,
            background: "linear-gradient(140deg, #F1ECFF 0%, #FFFFFF 70%)",
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Manrope", data: extraBold, weight: 800, style: "normal" },
        { name: "Manrope", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
