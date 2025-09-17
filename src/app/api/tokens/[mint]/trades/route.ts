import { NextRequest, NextResponse } from "next/server";
import { TokenRegistryService } from "@/services/tokenRegistry";

export async function GET(
  request: NextRequest,
  { params }: { params: { mint: string } }
) {
  try {
    const { mint } = params;
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    
    if (!mint) {
      return NextResponse.json({
        success: false,
        error: 'Mint address requerido'
      }, { status: 400 });
    }

    const trades = await TokenRegistryService.getRecentTrades(mint, limit);
    
    return NextResponse.json({
      success: true,
      data: trades,
      count: trades.length
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
