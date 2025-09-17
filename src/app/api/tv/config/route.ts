import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    supports_search: true,
    supports_group_request: false,
    supports_marks: true,
    supports_timescale_marks: true,
    supports_time: true,
    exchanges: [{ value: "HELL", name: "HELL DEX", desc: "Custom" }],
    symbols_types: [{ name: "crypto", value: "crypto" }],
    supported_resolutions: ["1", "5", "15", "60", "240", "D"],
  });
}
