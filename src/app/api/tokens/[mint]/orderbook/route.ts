import { NextRequest, NextResponse } from "next/server";
import { TokenRegistryService } from "@/services/tokenRegistry";

export async function GET(
  request: NextRequest,
  { params }: { params: { mint: string } }
) {
  try {
    const { mint } = params;
    
    if (!mint) {
      return NextResponse.json({
        success: false,
        error: 'Mint address requerido'
      }, { status: 400 });
    }

    const orderBook = await TokenRegistryService.getOrderBook(mint);
    
    return NextResponse.json({
      success: true,
      data: orderBook
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
