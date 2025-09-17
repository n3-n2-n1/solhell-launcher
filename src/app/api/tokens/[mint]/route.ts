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

    const token = await TokenRegistryService.getTokenByMint(mint);
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token no encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: token
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
