
export type CandleArrays = {
  t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[];
};

/**
 * Genera velas determinísticas por timeframe usando una PRNG simple.
 * pricescale: entero (ej. 1e9)
 * stepSec: 60, 300, 900, 3600, 86400...
 */
export function generateMockCandles(
  fromTs: number,
  toTs: number,
  stepSec: number,
  pricescale: number,
  seed = 42
): CandleArrays {
  const t:number[] = [], o:number[] = [], h:number[] = [], l:number[] = [], c:number[] = [], v:number[] = [];

  // PRNG simple (xorshift-ish)
  let x = seed >>> 0;
  const rnd = () => (x ^= x << 13, x ^= x >>> 17, x ^= x << 5, (x >>> 0) / 4294967296);

  // Precio base ~ 0.01 en unidades reales -> entero escalado
  let last = Math.max(1, Math.round(0.01 * pricescale));

  for (let ts = alignToStep(fromTs, stepSec); ts <= toTs; ts += stepSec) {
    const drift = Math.round((rnd() - 0.5) * 0.002 * pricescale);  // +/- 0.2% aprox
    const open  = Math.max(1, last);
    const high  = Math.max(1, open + Math.abs(Math.round((0.002 + rnd()*0.003) * pricescale)));
    const low   = Math.max(1, open - Math.abs(Math.round((0.002 + rnd()*0.003) * pricescale)));
    const close = Math.max(1, clamp(Math.round(open + drift), low, high));
    const vol   = Math.max(1, Math.round(1000 + rnd() * 5000)); // volumen sintético

    t.push(ts);
    o.push(open); h.push(high); l.push(low); c.push(close); v.push(vol);

    last = close;
  }
  return { t, o, h, l, c, v };
}

export function resolutionToStepSec(res: string): number {
  if (res === "D") return 86400;
  const n = parseInt(res, 10);
  return Number.isFinite(n) ? n * 60 : 60; // fallback 1m
}

export function alignToStep(ts: number, stepSec: number): number {
  return Math.floor(ts / stepSec) * stepSec;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}
