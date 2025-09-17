'use client';

import { useState, useEffect, useCallback } from 'react';
import { TokenMarketData, Trade, OrderBook, ChartData } from '@/types/market';
import { TokenRegistryService } from '@/services/tokenRegistry';
import { generateMockCandles, resolutionToStepSec } from '@/utils/mockCandle';

export function useMarketData() {
  const [tokens, setTokens] = useState<TokenMarketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllTokens = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TokenRegistryService.getAllTokens();
      setTokens(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching tokens');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrendingTokens = useCallback(async (limit: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const data = await TokenRegistryService.getTrendingTokens(limit);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching trending tokens');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTopGainers = useCallback(async (limit: number = 10) => {
    try {
      return await TokenRegistryService.getTopGainers(limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching top gainers');
      return [];
    }
  }, []);

  useEffect(() => {
    fetchAllTokens();
  }, [fetchAllTokens]);

  return {
    tokens,
    loading,
    error,
    fetchAllTokens,
    fetchTrendingTokens,
    fetchTopGainers,
  };
}

export function useTokenDetails(mint: string) {
  const [token, setToken] = useState<TokenMarketData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [] });
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenData = useCallback(async () => {
    if (!mint) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Real token data mapping
      const realTokens: Record<string, Partial<TokenMarketData>> = {
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { // BONK
          symbol: 'BONK',
          name: 'BONK',
          currentPrice: 0.00001234,
          priceChange24h: 8.45,
          volume24h: 25000000,
          marketCap: 850000000,
          holders: 125000,
          totalSupply: 100000000000000,
          highPrice24h: 0.00001350,
          lowPrice24h: 0.00001120,
          isDeflationary: false,
          burnRate: 0,
          isVerified: true,
          image: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
          description: 'The first dog coin for the people, by the people. BONK is a community dog coin for Solana.',
          creator: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
          launchDate: '2022-12-25',
        },
        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { // JUP
          symbol: 'JUP',
          name: 'Jupiter',
          currentPrice: 0.89,
          priceChange24h: 12.34,
          volume24h: 15000000,
          marketCap: 1200000000,
          holders: 45000,
          totalSupply: 1000000000,
          highPrice24h: 0.95,
          lowPrice24h: 0.82,
          isDeflationary: false,
          burnRate: 0,
          isVerified: true,
          image: 'https://static.jup.ag/jup/icon.png',
          description: 'Jupiter is the leading DEX aggregator on Solana, providing the best prices for traders and the most efficient routing for any token pair.',
          creator: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
          launchDate: '2024-01-31',
        },
        'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': { // WIF
          symbol: 'WIF',
          name: 'dogwifhat',
          currentPrice: 2.45,
          priceChange24h: -5.67,
          volume24h: 8500000,
          marketCap: 2450000000,
          holders: 85000,
          totalSupply: 1000000000,
          highPrice24h: 2.65,
          lowPrice24h: 2.35,
          isDeflationary: false,
          burnRate: 0,
          isVerified: true,
          image: 'https://i.imgur.com/5Q8Q9Q9.png',
          description: 'What if there was a dog with a hat?',
          creator: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
          launchDate: '2023-11-17',
        },
      };

      const realTokenData = realTokens[mint];
      const mockToken: TokenMarketData = {
        mint: mint,
        symbol: realTokenData?.symbol || 'TOKEN',
        name: realTokenData?.name || 'Unknown Token',
        currentPrice: realTokenData?.currentPrice || 0.000123,
        priceChange24h: realTokenData?.priceChange24h || 15.67,
        volume24h: realTokenData?.volume24h || 1250000,
        marketCap: realTokenData?.marketCap || 5000000,
        holders: realTokenData?.holders || 1250,
        totalSupply: realTokenData?.totalSupply || 1000000,
        highPrice24h: realTokenData?.highPrice24h || 0.00015,
        lowPrice24h: realTokenData?.lowPrice24h || 0.0001,
        isDeflationary: realTokenData?.isDeflationary || true,
        burnRate: realTokenData?.burnRate || 250,
        totalBurned: realTokenData?.totalBurned || 50000,
        isVerified: realTokenData?.isVerified || true,
        image: realTokenData?.image || '/api/placeholder/64/64',
        description: realTokenData?.description || 'A token on Solana',
        creator: realTokenData?.creator || '0x1234...5678',
        launchDate: realTokenData?.launchDate || '2025-01-10',
      };

      const mockTrades: Trade[] = [
        { id: '1', mint: mint, price: 0.000125, amount: 10000, timestamp: new Date(Date.now() - 1000 * 60 * 5), side: 'buy', buyer: '0x123...', seller: '0x456...', signature: '0xabc...' },
        { id: '2', mint: mint, price: 0.000124, amount: 5000, timestamp: new Date(Date.now() - 1000 * 60 * 10), side: 'sell', buyer: '0x789...', seller: '0xdef...', signature: '0xdef...' },
        { id: '3', mint: mint, price: 0.000126, amount: 15000, timestamp: new Date(Date.now() - 1000 * 60 * 15), side: 'buy', buyer: '0xghi...', seller: '0xjkl...', signature: '0xghi...' },
        { id: '4', mint: mint, price: 0.000123, amount: 7000, timestamp: new Date(Date.now() - 1000 * 60 * 20), side: 'sell', buyer: '0xmno...', seller: '0xpqr...', signature: '0xmno...' },
      ];

      const mockOrderBook: OrderBook = {
        asks: [
          { price: 0.000128, amount: 25000, total: 3.2, wallet: '0x123...' },
          { price: 0.000129, amount: 15000, total: 1.9, wallet: '0x456...' },
          { price: 0.000130, amount: 30000, total: 3.9, wallet: '0x789...' },
        ],
        bids: [
          { price: 0.000122, amount: 20000, total: 2.4, wallet: '0xabc...' },
          { price: 0.000121, amount: 10000, total: 1.2, wallet: '0xdef...' },
          { price: 0.000120, amount: 40000, total: 4.8, wallet: '0xghi...' },
        ],
      };

      // Generate realistic candle data using mockCandle
      const now = Math.floor(Date.now() / 1000);
      const fromTs = now - (24 * 60 * 60); // 24 hours ago
      const stepSec = resolutionToStepSec('15'); // 15 minutes
      const pricescale = 1e6; // 6 decimals
      
      const candleData = generateMockCandles(fromTs, now, stepSec, pricescale, 42);
      
      const mockChartData: ChartData = {
        data: candleData.t.map((time, index) => ({
          time: time,
          open: candleData.o[index] / pricescale,
          high: candleData.h[index] / pricescale,
          low: candleData.l[index] / pricescale,
          close: candleData.c[index] / pricescale,
          volume: candleData.v[index],
        })),
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setToken(mockToken);
      setTrades(mockTrades);
      setOrderBook(mockOrderBook);
      setChartData(mockChartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching token data');
    } finally {
      setLoading(false);
    }
  }, [mint]);

  const refreshData = useCallback(() => {
    fetchTokenData();
  }, [fetchTokenData]);

  useEffect(() => {
    fetchTokenData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTokenData, 30000);
    return () => clearInterval(interval);
  }, [fetchTokenData]);

  return {
    token,
    trades,
    orderBook,
    chartData,
    loading,
    error,
    refreshData,
  };
}
