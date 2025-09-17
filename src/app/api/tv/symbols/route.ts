import { NextRequest, NextResponse } from "next/server";

//export async function GET(req: NextRequest) {
//  const symbol = req.nextUrl.searchParams.get("symbol") || "HELL:SOLUSD";
//
//  // TODO: mapear símbolo -> metadatos (price scale, session, etc.)
//  return NextResponse.json({
//    name: symbol,
//    ticker: symbol,
//    description: symbol,
//    type: "crypto",
//    session: "24x7",
//    exchange: "HELL",
//    minmov: 1,
//    pricescale: 100000, // 5 decimales => 10^5 (ajusta a tu token)
//    has_intraday: true,
//    supported_resolutions: ["1","5","15","60","240","D"],
//    volume_precision: 2,
//    data_status: "streaming",
//  });
//}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || process.env.SYMBOL_DEFAULT || "HELL:DEGENUSD";
  const pricescale = parseInt(process.env.PRICESCALE || "1000000000", 10); // 1e9 por defecto

  return NextResponse.json({
    name: symbol,
    ticker: symbol,
    description: symbol,
    type: "crypto",
    session: "24x7",
    exchange: "HELL",
    minmov: 1,
    pricescale, // ¡CRÍTICO!: enteros en /history están en esta escala
    has_intraday: true,
    supported_resolutions: ["1","5","15","60","240","D"],
    volume_precision: 2,
    data_status: "streaming",
  });
}
