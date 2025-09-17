import { NextResponse } from "next/server";
import { TokenRegistryService } from "@/services/tokenRegistry";

export async function GET() {
  try {
    const tokens = await TokenRegistryService.getAllTokens();
    return NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
