import { ImageResponse } from "next/og";
export const alt = "QC Schedules · Unofficial Queens College course listings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
    return new ImageResponse(
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: 90,
                width: "100%",
                height: "100%",
                background: "#fff",
                color: "#262626",
            }}
        >
            <div style={{ fontSize: 68, fontWeight: 600 }}>QC Schedules</div>
            <div style={{ fontSize: 28, marginTop: 24, color: "#737373" }}>
                Course schedules & historical instructor grades
            </div>
            <div style={{ fontSize: 22, marginTop: 70 }}>
                Unofficial Listings · qcs.danncd.com
            </div>
        </div>,
        size,
    );
}
