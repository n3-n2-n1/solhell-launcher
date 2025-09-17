export interface TokenMarketData {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image?: string;
  creator: string;
  createdAt?: Date;
  launchDate?: string;
  
  // Market data
  currentPrice: number; // in SOL
  priceChange24h: number; // percentage
  volume24h: number; // in SOL
  marketCap: number; // in SOL
  holders: number;
  totalSupply: number;
  
  // Deflationary data
  isDeflationary: boolean;
  burnRate?: number; // basis points
  totalBurned?: number;
  
  // Trading data
  highPrice24h: number;
  lowPrice24h: number;
  trades24h?: number;
  
  // Status
  isActive?: boolean;
  isVerified: boolean;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  wallet: string;
}

export interface OrderBook {
  bids: OrderBookEntry[]; // Buy orders
  asks: OrderBookEntry[]; // Sell orders
}

export interface Trade {
  id?: string;
  mint?: string;
  price: number;
  amount: number;
  total?: number;
  side: 'buy' | 'sell';
  timestamp: Date;
  buyer?: string;
  seller?: string;
  signature?: string;
}

export interface PricePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ChartData {
  timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  data: PricePoint[];
}
