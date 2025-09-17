import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse(Math.floor(Date.now() / 1000).toString(), {
    headers: { "content-type": "text/plain" },
  });
}

