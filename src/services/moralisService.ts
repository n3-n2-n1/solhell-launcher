// Moralis Solana API Service
export interface MoralisOHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MoralisTokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  logoHash?: string;
  thumbnail?: string;
  blockNumber?: string;
  validated?: number;
  createdAt?: string;
}

export interface MoralisTokenPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
}

export interface MoralisSwapData {
  transactionHash: string;
  address: string;
  blockTimestamp: string;
  blockNumber: string;
  blockHash: string;
  toAddress: string;
  fromAddress: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenLogo?: string;
  tokenDecimals: string;
  valueFormatted: string;
  possibleSpam: boolean;
  verifiedContract: boolean;
}

class MoralisService {
  private baseUrl = 'https://solana-gateway.moralis.io';
  private apiKey: string;

  constructor() {
    // You'll need to get an API key from Moralis
    this.apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Moralis API key not found. Please set NEXT_PUBLIC_MORALIS_API_KEY in your .env.local file');
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get OHLCV data for a token pair
  async getOHLCVData(
    pairAddress: string,
    chain: string = 'solana',
    timeframe: string = '1h',
    fromDate?: string,
    toDate?: string
  ): Promise<MoralisOHLCVData[]> {
    try {
      const params: Record<string, string> = {
        chain,
        timeframe,
      };

      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const data = await this.makeRequest(`/token/${pairAddress}/ohlcv`, params);
      
      return data.result.map((item: any) => ({
        timestamp: new Date(item.timestamp).getTime(),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume),
      }));
    } catch (error) {
      console.error('Error fetching OHLCV data:', error);
      throw error;
    }
  }

  // Get token metadata
  async getTokenMetadata(address: string): Promise<MoralisTokenMetadata> {
    try {
      const data = await this.makeRequest(`/token/mainnet/${address}/metadata`);
      
      return data;
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      // Return mock data if API fails
      return {
        address: address,
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: 6,
        logo: undefined,
        logoHash: undefined,
        thumbnail: undefined,
        blockNumber: undefined,
        validated: 0,
        createdAt: undefined,
      };
    }
  }

  // Get token pairs
  async getTokenPairs(address: string): Promise<MoralisTokenPair[]> {
    try {
      const data = await this.makeRequest(`/token/mainnet/${address}/pairs`);
      
      return data.result || [];
    } catch (error) {
      console.error('Error fetching token pairs:', error);
      // Return empty array if API fails
      return [];
    }
  }

  // Get swaps for a token
  async getTokenSwaps(
    address: string,
    limit: number = 100,
    fromBlock?: string,
    toBlock?: string
  ): Promise<MoralisSwapData[]> {
    try {
      const params: Record<string, string> = {
        chain: 'solana',
        limit: limit.toString(),
      };

      if (fromBlock) params.from_block = fromBlock;
      if (toBlock) params.to_block = toBlock;

      const data = await this.makeRequest(`/token/${address}/swaps`, params);
      
      return data.result || [];
    } catch (error) {
      console.error('Error fetching token swaps:', error);
      throw error;
    }
  }

  // Get price data for a token
  async getTokenPrice(address: string): Promise<{ usdPrice: number; nativePrice: number }> {
    try {
      const data = await this.makeRequest(`/token/mainnet/${address}/price`);
      
      return {
        usdPrice: parseFloat(data.usdPrice || '0'),
        nativePrice: parseFloat(data.nativePrice || '0'),
      };
    } catch (error) {
      console.error('Error fetching token price:', error);
      // Return default values if API fails
      return {
        usdPrice: 0,
        nativePrice: 0,
      };
    }
  }

  // Get liquidity data for a token
  async getTokenLiquidity(address: string): Promise<{ liquidity: number; marketCap: number }> {
    try {
      const pairs = await this.getTokenPairs(address);
      
      if (pairs.length === 0) {
        return { liquidity: 0, marketCap: 0 };
      }

      // Get the pair with highest liquidity
      const mainPair = pairs.reduce((prev, current) => 
        (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev
      );

      return {
        liquidity: mainPair.liquidity?.usd || 0,
        marketCap: mainPair.marketCap || 0,
      };
    } catch (error) {
      console.error('Error fetching token liquidity:', error);
      throw error;
    }
  }
}

export const moralisService = new MoralisService();
