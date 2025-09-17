import { NextRequest, NextResponse } from "next/server";
import { TokenRegistryService } from '@/services/tokenRegistry';
import { alignToStep, generateMockCandles, resolutionToStepSec } from "@/utils/mockCandle";

// Generador de velas dummy basado en datos reales (reemplazar por tu fuente real)
//function genOhlcvFromToken(tokenSymbol: string, fromTs: number, toTs: number, stepSec: number) {
//  const t: number[] = [], o: number[] = [], h: number[] = [], l: number[] = [], c: number[] = [], v: number[] = [];
//  
//  // Precio base según el token (en price units)
//  let basePrice = 0.001; // Default
//  if (tokenSymbol.includes('HELL')) basePrice = 0.001;
//  if (tokenSymbol.includes('DMEME')) basePrice = 0.0005;
//  if (tokenSymbol.includes('BURN')) basePrice = 0.002;
//  
//  let last = basePrice * 100000; // en "price units" (precio * pricescale)
//  
//  for (let ts = fromTs; ts <= toTs; ts += stepSec) {
//    const volatility = 0.05; // 5% max change
//    const change = (Math.random() - 0.5) * 2 * volatility;
//    
//    const open = last;
//    const priceChange = open * change;
//    const high = open + Math.abs(priceChange) + Math.random() * (open * 0.02);
//    const low = open - Math.abs(priceChange) - Math.random() * (open * 0.02);
//    const close = Math.max(1, low + Math.random() * (high - low));
//    const vol = Math.floor(Math.random() * 10000 + 100);
//
//    t.push(ts);
//    o.push(Math.round(open));
//    h.push(Math.round(high));
//    l.push(Math.round(Math.max(1, low)));
//    c.push(Math.round(close));
//    v.push(vol);
//    
//    last = close;
//  }
//  return { t, o, h, l, c, v };
//}
//
//export async function GET(req: NextRequest) {
//  const url = req.nextUrl;
//  const symbol = url.searchParams.get("symbol") || "HELL:HELLUSD";
//  const resolution = url.searchParams.get("resolution") || "1";
//  const from = parseInt(url.searchParams.get("from") || "0", 10);
//  const to = parseInt(url.searchParams.get("to") || "0", 10);
//
//  try {
//    // Extraer el símbolo del token
//    const tokenSymbol = symbol.split(':')[1]?.replace('USD', '') || 'HELL';
//    
//    // Mapeo resolución -> segundos
//    const stepSec = resolution === "D" ? 86400 : parseInt(resolution, 10) * 60;
//
//    // Generar datos OHLCV
//    const data = genOhlcvFromToken(tokenSymbol, from, to, stepSec);
//
//    if (data.t.length === 0) {
//      return NextResponse.json({ s: "no_data", nextTime: to + stepSec });
//    }
//
//    return NextResponse.json({ s: "ok", ...data });
//  } catch (error) {
//    console.error('Error getting history:', error);
//    return NextResponse.json({ s: "error", errmsg: "Internal server error" });
//  }
//}


export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const symbol = url.searchParams.get("symbol") || process.env.SYMBOL_DEFAULT || "HELL:DEGENUSD";
  const resolution = url.searchParams.get("resolution") || "1";
  const from = parseInt(url.searchParams.get("from") || "0", 10);
  const to   = parseInt(url.searchParams.get("to")   || "0", 10);

  if (!from || !to || to <= from) {
    return NextResponse.json({ s: "no_data" });
  }

  const stepSec = resolutionToStepSec(resolution);
  const pricescale = parseInt(process.env.PRICESCALE || "1000000000", 10);
  const useMock = process.env.MOCK_POOL === "1";

  if (useMock) {
    // Generamos velas sintéticas determinísticas
    const alignedFrom = alignToStep(from, stepSec);
    const data = generateMockCandles(alignedFrom, to, stepSec, pricescale, 12345);
    if (data.t.length === 0) return NextResponse.json({ s: "no_data", nextTime: to + stepSec });
    return NextResponse.json({ s: "ok", ...data });
  }

  // TODO: Reemplazar por tu fuente real (DB con OHLCV construido a partir de Jupiter/trades)
  // const data = await fetchRealOHLCV(symbol, resolution, from, to, pricescale);
  // if (!data || data.t.length === 0) return NextResponse.json({ s: "no_data" });
  // return NextResponse.json({ s: "ok", ...data });

  return NextResponse.json({ s: "no_data" });
}
