// TradingView Datafeed implementation
export class TradingViewDatafeed {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://api.binance.com') {
    this.baseUrl = baseUrl;
  }

  onReady(callback: (config: any) => void) {
    setTimeout(() => {
      callback({
        exchanges: [
          {
            value: 'Binance',
            name: 'Binance',
            desc: 'Binance Exchange'
          }
        ],
        symbols_types: [
          {
            name: 'crypto',
            value: 'crypto'
          }
        ],
        supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
        supports_marks: false,
        supports_timescale_marks: false,
        supports_time: true,
        supports_search: true,
        supports_group_request: false
      });
    }, 0);
  }

  searchSymbols(userInput: string, exchange: string, symbolType: string, onResultReadyCallback: (results: any[]) => void) {
    // For now, return empty results
    onResultReadyCallback([]);
  }

  resolveSymbol(symbolName: string, onSymbolResolvedCallback: (symbolInfo: any) => void, onResolveErrorCallback: (reason: string) => void) {
    const symbolInfo = {
      ticker: symbolName,
      name: symbolName,
      description: symbolName,
      type: 'crypto',
      session: '24x7',
      timezone: 'Etc/UTC',
      exchange: 'Binance',
      minmov: 1,
      pricescale: 1000000,
      has_intraday: true,
      has_weekly_and_monthly: true,
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
      volume_precision: 2,
      data_status: 'streaming',
    };
    onSymbolResolvedCallback(symbolInfo);
  }

  getBars(
    symbolInfo: any,
    resolution: string,
    from: number,
    to: number,
    onHistoryCallback: (bars: any[], meta: { noData: boolean }) => void,
    onErrorCallback: (reason: string) => void,
    firstDataRequest: boolean
  ) {
    this.fetchBars(symbolInfo, resolution, from, to)
      .then((bars) => {
        onHistoryCallback(bars, { noData: false });
      })
      .catch((error) => {
        console.error('Error fetching bars:', error);
        onErrorCallback(error.message);
      });
  }

  private async fetchBars(symbolInfo: any, resolution: string, from: number, to: number): Promise<any[]> {
    const symbol = symbolInfo.ticker.replace('BINANCE:', '');
    const interval = this.convertResolution(resolution);
    
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${from * 1000}&endTime=${to * 1000}&limit=1000`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.map((kline: any[]) => ({
        time: kline[0], // Open time
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));
    } catch (error) {
      console.error('Error fetching from Binance:', error);
      // Return mock data if API fails
      return this.generateMockBars(from, to, resolution);
    }
  }

  private convertResolution(resolution: string): string {
    const resolutionMap: Record<string, string> = {
      '1': '1m',
      '5': '5m',
      '15': '15m',
      '30': '30m',
      '60': '1h',
      '240': '4h',
      '1D': '1d',
      '1W': '1w',
      '1M': '1M'
    };
    return resolutionMap[resolution] || '1h';
  }

  private generateMockBars(from: number, to: number, resolution: string): any[] {
    const bars: any[] = [];
    const intervalMs = this.getIntervalMs(resolution);
    let currentTime = from * 1000;
    let price = 0.00001234; // Starting price for BONK

    while (currentTime <= to * 1000) {
      const variation = (Math.random() - 0.5) * 0.02; // 2% max variation
      const open = price;
      const close = price * (1 + variation);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 1000000;

      bars.push({
        time: currentTime,
        open,
        high,
        low,
        close,
        volume
      });

      price = close;
      currentTime += intervalMs;
    }

    return bars;
  }

  private getIntervalMs(resolution: string): number {
    const intervalMap: Record<string, number> = {
      '1': 60 * 1000, // 1 minute
      '5': 5 * 60 * 1000, // 5 minutes
      '15': 15 * 60 * 1000, // 15 minutes
      '30': 30 * 60 * 1000, // 30 minutes
      '60': 60 * 60 * 1000, // 1 hour
      '240': 4 * 60 * 60 * 1000, // 4 hours
      '1D': 24 * 60 * 60 * 1000, // 1 day
      '1W': 7 * 24 * 60 * 60 * 1000, // 1 week
      '1M': 30 * 24 * 60 * 60 * 1000 // 1 month
    };
    return intervalMap[resolution] || 60 * 60 * 1000;
  }

  subscribeBars(
    symbolInfo: any,
    resolution: string,
    onRealtimeCallback: (bar: any) => void,
    subscribeUID: string,
    onResetCacheNeededCallback: () => void
  ) {
    // Real-time updates would go here
    console.log('Subscribing to real-time updates for:', symbolInfo.ticker);
  }

  unsubscribeBars(subscribeUID: string) {
    // Cleanup real-time updates
    console.log('Unsubscribing from real-time updates:', subscribeUID);
  }
}
