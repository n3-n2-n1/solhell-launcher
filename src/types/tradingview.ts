// TradingView Charting Library types
export interface ChartingLibraryWidgetOptions {
  symbol?: string;
  datafeed?: {
    onReady: (callback: (config: any) => void) => void;
    searchSymbols: (userInput: string, exchange: string, symbolType: string, onResultReadyCallback: (results: any[]) => void) => void;
    resolveSymbol: (symbolName: string, onSymbolResolvedCallback: (symbolInfo: any) => void, onResolveErrorCallback: (reason: string) => void) => void;
    getBars: (symbolInfo: any, resolution: string, from: number, to: number, onHistoryCallback: (bars: any[], meta: { noData: boolean }) => void, onErrorCallback: (reason: string) => void, firstDataRequest: boolean) => void;
    subscribeBars: (symbolInfo: any, resolution: string, onRealtimeCallback: (bar: any) => void, subscribeUID: string, onResetCacheNeededCallback: () => void) => void;
    unsubscribeBars: (subscribeUID: string) => void;
  };
  interval?: string;
  container?: HTMLElement;
  library_path?: string;
  locale?: string;
  disabled_features?: string[];
  enabled_features?: string[];
  charts_storage_url?: string;
  charts_storage_api_version?: string;
  client_id?: string;
  user_id?: string;
  fullscreen?: boolean;
  autosize?: boolean;
  theme?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  hide_side_toolbar?: boolean;
  allow_symbol_change?: boolean;
  details?: boolean;
  hotlist?: boolean;
  calendar?: boolean;
  studies?: string[];
  container_id?: string;
}

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko';
export type ResolutionString = '1' | '5' | '15' | '30' | '60' | '240' | '1D' | '1W' | '1M';

// Extend Window interface
declare global {
  interface Window {
    TradingView?: unknown;
    Datafeeds?: unknown;
  }
}
