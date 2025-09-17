let tvLibPromise: Promise<void> | null = null;

declare global {
  interface Window {
    TradingView?: unknown; // o un tipo más específico si tenés definiciones
  }
}
export function loadTVLibrary(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve(); // SSR no ejecuta

  if ((window as any).TradingView) return Promise.resolve();
  if (tvLibPromise) return tvLibPromise;

  tvLibPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    // Para desarrollo, usamos la versión CDN de TradingView
    // En producción deberías usar la Charting Library descargada
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      // Verificar que TradingView se cargó correctamente
      if ((window as any).TradingView) {
        resolve();
      } else {
        reject(new Error('TradingView library failed to load'));
      }
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });

  return tvLibPromise;
}