import { NextRequest, NextResponse } from "next/server";
import { TokenRegistryService } from '@/services/tokenRegistry';

//export async function GET(req: NextRequest) {
//  const q = (req.nextUrl.searchParams.get("query") || "").toUpperCase();
//
//  try {
//    // Obtener tokens de nuestro registry
//    const tokens = await TokenRegistryService.getAllTokens();
//    
//    // Filtrar y mapear a formato TradingView
//    const results = tokens
//      .filter(token => 
//        token.symbol.toUpperCase().includes(q) || 
//        token.name.toUpperCase().includes(q)
//      )
//      .map(token => ({
//        symbol: `HELL:${token.symbol}USD`,
//        full_name: `${token.symbol} / USD`,
//        description: token.name,
//        exchange: "HELL",
//        type: "crypto"
//      }));
//
//    return NextResponse.json(results);
//  } catch (error) {
//    console.error('Error searching symbols:', error);
//    
//    // Fallback con datos mock
//    const fake = [
//      { symbol: "HELL:HELLUSD", full_name: "HELL / USD", description: "HELL Token", exchange: "HELL", type: "crypto" },
//      { symbol: "HELL:DMEMEUSD", full_name: "DMEME / USD", description: "DeflaMeme", exchange: "HELL", type: "crypto" },
//    ].filter(s => s.symbol.includes(q) || s.description.includes(q));
//
//    return NextResponse.json(fake);
//  }
//}


export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("query") || "").toUpperCase();
  const base = process.env.SYMBOL_DEFAULT || "HELL:DEGENUSD";
  const list = [
    { symbol: base, full_name: base, description: "Mocked Pair", exchange: "HELL", type: "crypto" },
  ];
  return NextResponse.json(list.filter(s => s.symbol.includes(q) || s.description.toUpperCase().includes(q)));
}
