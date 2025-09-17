// Alternative Solana Token Service using CORS-friendly APIs
export interface SolanaTokenData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  price?: number;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  supply?: number;
  holders?: number;
}

export interface SolanaTokenPrice {
  address: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
}

class SolanaTokenService {
  // Use CORS-friendly APIs
  private birdeyeUrl = 'https://public-api.birdeye.so';
  private dexscreenerUrl = 'https://api.dexscreener.com/latest';
  private coingeckoUrl = 'https://api.coingecko.com/api/v3';

  // Get token data from Birdeye (CORS-friendly)
  async getTokenData(address: string): Promise<SolanaTokenData> {
    try {
      // Try Birdeye API first (usually CORS-friendly)
      const response = await fetch(`${this.birdeyeUrl}/defi/token_overview?address=${address}`);
      
      if (!response.ok) {
        throw new Error(`Birdeye API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const tokenData = data.data;
        return {
          address: address,
          name: tokenData.name || 'Unknown Token',
          symbol: tokenData.symbol || 'UNKNOWN',
          decimals: tokenData.decimals || 6,
          logo: tokenData.logoURI,
          price: tokenData.price || 0,
          marketCap: tokenData.mc || 0,
          volume24h: tokenData.v24hUSD || 0,
          priceChange24h: tokenData.priceChange24h || 0,
          supply: tokenData.totalSupply || 0,
          holders: tokenData.holder || 0,
        };
      }
      
      throw new Error('No data returned from Birdeye');
    } catch (error) {
      console.error('Error fetching token data from Birdeye:', error);
      
      // Fallback to basic token info
      return {
        address: address,
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: 6,
        logo: undefined,
        price: 0,
        marketCap: 0,
        volume24h: 0,
        priceChange24h: 0,
        supply: 0,
        holders: 0,
      };
    }
  }

  // Get token price from CoinGecko (if available)
  async getTokenPrice(address: string): Promise<SolanaTokenPrice | null> {
    try {
      // First, try to find the token in CoinGecko's Solana token list
      const response = await fetch(`${this.coingeckoUrl}/coins/solana/contract/${address}`);
      
      if (!response.ok) {
        // Token not found in CoinGecko, return null
        return null;
      }

      const data = await response.json();
      
      return {
        address: address,
        price: data.market_data?.current_price?.usd || 0,
        priceChange24h: data.market_data?.price_change_percentage_24h || 0,
        volume24h: data.market_data?.total_volume?.usd || 0,
        marketCap: data.market_data?.market_cap?.usd || 0,
      };
    } catch (error) {
      console.error('Error fetching token price from CoinGecko:', error);
      return null;
    }
  }

  // Get token info from DexScreener (CORS-friendly)
  async getDexScreenerTokenInfo(address: string): Promise<SolanaTokenData | null> {
    try {
      const response = await fetch(`${this.dexscreenerUrl}/dex/tokens/${address}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const tokenData = data.pairs?.[0];
      
      if (!tokenData) {
        return null;
      }

      return {
        address: address,
        name: tokenData.baseToken?.name || 'Unknown Token',
        symbol: tokenData.baseToken?.symbol || 'UNKNOWN',
        decimals: tokenData.baseToken?.decimals || 6,
        logo: tokenData.baseToken?.image,
        price: parseFloat(tokenData.priceUsd) || 0,
        marketCap: parseFloat(tokenData.fdv) || 0,
        volume24h: parseFloat(tokenData.volume?.h24) || 0,
        priceChange24h: parseFloat(tokenData.priceChange?.h24) || 0,
      };
    } catch (error) {
      console.error('Error fetching token info from DexScreener:', error);
      return null;
    }
  }

  // Get comprehensive token data from multiple sources
  async getComprehensiveTokenData(address: string): Promise<SolanaTokenData> {
    try {
      // Try Birdeye first (most comprehensive)
      const birdeyeInfo = await this.getTokenData(address);
      
      // If Birdeye has good data, use it
      if ((birdeyeInfo.price || 0) > 0 && birdeyeInfo.name !== 'Unknown Token') {
        return birdeyeInfo;
      }
      
      // Fallback to DexScreener
      const dexscreenerInfo = await this.getDexScreenerTokenInfo(address);
      if (dexscreenerInfo && (dexscreenerInfo.price || 0) > 0) {
        return dexscreenerInfo;
      }
      
      // Fallback to CoinGecko if available
      const coingeckoPrice = await this.getTokenPrice(address);
      if (coingeckoPrice) {
        return {
          ...birdeyeInfo,
          price: coingeckoPrice.price,
          marketCap: coingeckoPrice.marketCap,
          volume24h: coingeckoPrice.volume24h,
          priceChange24h: coingeckoPrice.priceChange24h,
        };
      }

      // Return basic info if all else fails
      return birdeyeInfo;
    } catch (error) {
      console.error('Error fetching comprehensive token data:', error);
      return {
        address: address,
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: 6,
        logo: undefined,
        price: 0,
        marketCap: 0,
        volume24h: 0,
        priceChange24h: 0,
        supply: 0,
        holders: 0,
      };
    }
  }

  // Get token pairs from DexScreener (CORS-friendly)
  async getTokenPairs(address: string): Promise<Array<{
    pairAddress: string;
    baseToken: { address?: string; symbol?: string; name?: string };
    quoteToken: { address?: string; symbol?: string; name?: string };
    liquidity: { usd: number };
    volume: { h24: number };
    priceChange: { h24: number };
    marketCap: number;
  }>> {
    try {
      const response = await fetch(`${this.dexscreenerUrl}/dex/tokens/${address}`);
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      if (!data.pairs || data.pairs.length === 0) {
        return [];
      }

      // Return the first few pairs
      return data.pairs.slice(0, 5).map((pair: {
        pairAddress: string;
        baseToken?: { address?: string; symbol?: string; name?: string };
        quoteToken?: { address?: string; symbol?: string; name?: string };
        liquidity?: { usd?: string };
        volume?: { h24?: string };
        priceChange?: { h24?: string };
        fdv?: string;
      }) => ({
        pairAddress: pair.pairAddress,
        baseToken: {
          address: pair.baseToken?.address,
          symbol: pair.baseToken?.symbol,
          name: pair.baseToken?.name,
        },
        quoteToken: {
          address: pair.quoteToken?.address,
          symbol: pair.quoteToken?.symbol,
          name: pair.quoteToken?.name,
        },
        liquidity: {
          usd: parseFloat(pair.liquidity?.usd || '0') || 0,
        },
        volume: {
          h24: parseFloat(pair.volume?.h24 || '0') || 0,
        },
        priceChange: {
          h24: parseFloat(pair.priceChange?.h24 || '0') || 0,
        },
        marketCap: parseFloat(pair.fdv || '0') || 0,
      }));
    } catch (error) {
      console.error('Error fetching token pairs from DexScreener:', error);
      return [];
    }
  }
}

export const solanaTokenService = new SolanaTokenService();
