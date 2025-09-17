import { TokenMarketData, Trade, OrderBook, ChartData, PricePoint } from '@/types/market';

// Mock data para desarrollo
const mockTokens: TokenMarketData[] = [
  {
    mint: '7BwsNQH3QTBvqqb9GbFwmb8mVmfT5X6SkM7HaddbAkdT',
    name: 'HELL Token',
    symbol: 'HELL',
    description: 'Token nativo de la plataforma SolHell HELL para staking y rewards',
    creator: '4qhqUZNJsPA2U3CkVaahzwepLpUfTEPvTy5EDXtkThDS',
    createdAt: new Date('2025-01-16'),
    currentPrice: 0.001,
    priceChange24h: 5.2,
    volume24h: 15000,
    marketCap: 100000,
    holders: 2,
    totalSupply: 100000000,
    isDeflationary: false,
    highPrice24h: 0.0012,
    lowPrice24h: 0.0008,
    trades24h: 45,
    isActive: true,
    isVerified: true,
  },
  {
    mint: 'DeflaMeme111111111111111111111111111111',
    name: 'DeflaMeme',
    symbol: 'DMEME',
    description: 'El primer meme token deflacionario con quema automática del 2%',
    creator: '4qhqUZNJsPA2U3CkVaahzwepLpUfTEPvTy5EDXtkThDS',
    createdAt: new Date('2025-01-15'),
    currentPrice: 0.0005,
    priceChange24h: -2.1,
    volume24h: 8500,
    marketCap: 25000,
    holders: 156,
    totalSupply: 50000000,
    isDeflationary: true,
    burnRate: 200, // 2%
    totalBurned: 500000,
    highPrice24h: 0.0006,
    lowPrice24h: 0.0004,
    trades24h: 28,
    isActive: true,
    isVerified: false,
  },
  {
    mint: 'BurnCoin111111111111111111111111111111111',
    name: 'BurnCoin',
    symbol: 'BURN',
    description: 'Token deflacionario con mecánicas de juego y recompensas por holdear',
    creator: '2iZptRfNgUVFn3KAzwN2MozPWXmys8eaoTatzmcBxnA5',
    createdAt: new Date('2025-01-14'),
    currentPrice: 0.002,
    priceChange24h: 12.8,
    volume24h: 22000,
    marketCap: 80000,
    holders: 89,
    totalSupply: 40000000,
    isDeflationary: true,
    burnRate: 150, // 1.5%
    totalBurned: 800000,
    highPrice24h: 0.0025,
    lowPrice24h: 0.0018,
    trades24h: 67,
    isActive: true,
    isVerified: false,
  },
];

// Generate mock price data
function generateMockPriceData(basePrice: number, points: number = 100): PricePoint[] {
  const data: PricePoint[] = [];
  let currentPrice = basePrice;
  const now = Date.now();
  
  for (let i = points; i >= 0; i--) {
    const timestamp = now - (i * 5 * 60 * 1000); // 5 minutes intervals
    const volatility = 0.05; // 5% max change per point
    const change = (Math.random() - 0.5) * 2 * volatility;
    currentPrice *= (1 + change);
    
    data.push({
      timestamp,
      price: Math.max(currentPrice, basePrice * 0.5), // Don't go below 50% of base
      volume: Math.random() * 1000 + 100,
    });
  }
  
  return data;
}

export class TokenRegistryService {
  // Obtener tokens desde localStorage o usar mockTokens como fallback
  private static getStoredTokens(): TokenMarketData[] {
    if (typeof window === 'undefined') return mockTokens;
    
    try {
      const stored = localStorage.getItem('solhell_tokens');
      if (stored) {
        const parsedTokens = JSON.parse(stored);
        // Combinar tokens mock con tokens creados por usuarios
        return [...mockTokens, ...parsedTokens];
      }
    } catch (error) {
      console.error('Error loading stored tokens:', error);
    }
    
    return mockTokens;
  }

  // Guardar tokens en localStorage
  private static saveTokens(tokens: TokenMarketData[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Solo guardar tokens creados por usuarios (no los mock)
      const userTokens = tokens.filter(token => 
        !mockTokens.some(mockToken => mockToken.mint === token.mint)
      );
      localStorage.setItem('solhell_tokens', JSON.stringify(userTokens));
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  static async getAllTokens(): Promise<TokenMarketData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.getStoredTokens();
  }

  static async getTokenByMint(mint: string): Promise<TokenMarketData | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const allTokens = this.getStoredTokens();
    return allTokens.find(token => token.mint === mint) || null;
  }

  static async getTrendingTokens(limit: number = 10): Promise<TokenMarketData[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allTokens = this.getStoredTokens();
    return [...allTokens]
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, limit);
  }

  static async getTopGainers(limit: number = 10): Promise<TokenMarketData[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allTokens = this.getStoredTokens();
    return [...allTokens]
      .sort((a, b) => b.priceChange24h - a.priceChange24h)
      .slice(0, limit);
  }

  static async getRecentTrades(mint: string, limit: number = 50): Promise<Trade[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Generate mock trades
    const trades: Trade[] = [];
    const allTokens = this.getStoredTokens();
    const token = allTokens.find(t => t.mint === mint);
    if (!token) return [];

    for (let i = 0; i < limit; i++) {
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      const amount = Math.random() * 10000 + 100;
      const priceVariation = (Math.random() - 0.5) * 0.1; // ±10% price variation
      const price = token.currentPrice * (1 + priceVariation);
      
      trades.push({
        id: `trade_${i}_${Date.now()}`,
        mint,
        price,
        amount,
        total: price * amount,
        side,
        timestamp: new Date(Date.now() - i * 60000), // 1 minute intervals
        buyer: side === 'buy' ? 'user123' : 'user456',
        seller: side === 'sell' ? 'user123' : 'user456',
        signature: `sig_${i}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    return trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  static async getOrderBook(mint: string): Promise<OrderBook> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const allTokens = this.getStoredTokens();
    const token = allTokens.find(t => t.mint === mint);
    if (!token) return { bids: [], asks: [] };

    const basePrice = token.currentPrice;
    const bids: Array<{price: number, amount: number, total: number, wallet: string}> = [];
    const asks: Array<{price: number, amount: number, total: number, wallet: string}> = [];

    // Generate mock bids (buy orders) - below current price
    for (let i = 0; i < 10; i++) {
      const price = basePrice * (0.95 - i * 0.02); // Decreasing prices
      const amount = Math.random() * 5000 + 100;
      bids.push({
        price,
        amount,
        total: price * amount,
        wallet: `buyer_${i}`,
      });
    }

    // Generate mock asks (sell orders) - above current price
    for (let i = 0; i < 10; i++) {
      const price = basePrice * (1.05 + i * 0.02); // Increasing prices
      const amount = Math.random() * 5000 + 100;
      asks.push({
        price,
        amount,
        total: price * amount,
        wallet: `seller_${i}`,
      });
    }

    return { bids, asks };
  }

  static async getChartData(mint: string, timeframe: string = '1h'): Promise<ChartData> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const allTokens = this.getStoredTokens();
    const token = allTokens.find(t => t.mint === mint);
    if (!token) {
      return {
        timeframe: timeframe as '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
        data: [],
      };
    }

    const points = timeframe === '1d' ? 24 : timeframe === '1h' ? 60 : 100;
    const data = generateMockPriceData(token.currentPrice, points);

    return {
      timeframe: timeframe as '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
      data,
    };
  }

  static async addToken(tokenData: Partial<TokenMarketData>): Promise<TokenMarketData> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newToken: TokenMarketData = {
      mint: tokenData.mint || 'new_token_mint',
      name: tokenData.name || 'New Token',
      symbol: tokenData.symbol || 'NEW',
      description: tokenData.description || '',
      creator: tokenData.creator || 'unknown',
      createdAt: new Date(),
      currentPrice: tokenData.currentPrice || 0.001,
      priceChange24h: 0,
      volume24h: 0,
      marketCap: 0,
      holders: 1,
      totalSupply: tokenData.totalSupply || 1000000,
      isDeflationary: tokenData.isDeflationary || false,
      burnRate: tokenData.burnRate,
      totalBurned: 0,
      highPrice24h: tokenData.currentPrice || 0.001,
      lowPrice24h: tokenData.currentPrice || 0.001,
      trades24h: 0,
      isActive: true,
      isVerified: false,
    };

    // Obtener tokens existentes y agregar el nuevo
    const existingTokens = this.getStoredTokens();
    const updatedTokens = [...existingTokens, newToken];
    
    // Guardar en localStorage
    this.saveTokens(updatedTokens);
    
    console.log('✅ Token guardado en localStorage:', newToken.mint);
    return newToken;
  }
}
