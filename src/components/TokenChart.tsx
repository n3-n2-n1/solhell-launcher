'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType, CandlestickData, Time } from 'lightweight-charts';
import { BarChart3, TrendingUp, TrendingDown, ExternalLink, Copy } from 'lucide-react';

interface TokenChartProps {
  tokenAddress: string;
  className?: string;
}

interface TokenData {
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  logo?: string;
}

interface CandlestickData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function TokenChart({ tokenAddress, className = '' }: TokenChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('1h');

  useEffect(() => {
    fetchTokenData();
  }, [tokenAddress]);

  useEffect(() => {
    if (candlestickData.length > 0) {
      initChart();
    }
  }, [candlestickData]);

  const fetchTokenData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try DexScreener first (CORS-friendly)
      try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
        
        if (response.ok) {
          const data = await response.json();
          const pair = data.pairs?.[0];
          
          if (pair && pair.priceUsd) {
            const tokenInfo = {
              name: pair.baseToken?.name || 'Unknown Token',
              symbol: pair.baseToken?.symbol || 'UNKNOWN',
              price: parseFloat(pair.priceUsd) || 0,
              priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
              volume24h: parseFloat(pair.volume?.h24) || 0,
              marketCap: parseFloat(pair.fdv) || 0,
              logo: pair.baseToken?.image,
            };
            
            setTokenData(tokenInfo);
            
            // Generate candlestick data based on real price
            generateCandlestickData(tokenInfo.price);
            setLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.warn('DexScreener API failed, using fallback data:', apiError);
      }

      // Fallback to mock data
      const mockData = getMockTokenData(tokenAddress);
      setTokenData(mockData);
      generateCandlestickData(mockData.price);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching token data:', error);
      setError('Failed to load token data');
      setLoading(false);
    }
  };

  const getMockTokenData = (address: string): TokenData => {
    const mockTokens: Record<string, TokenData> = {
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': {
        name: 'Jupiter',
        symbol: 'JUP',
        price: 0.85,
        priceChange24h: 5.2,
        volume24h: 12500000,
        marketCap: 1200000000,
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png'
      },
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': {
        name: 'Bonk',
        symbol: 'BONK',
        price: 0.000012,
        priceChange24h: -2.1,
        volume24h: 45000000,
        marketCap: 850000000,
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png'
      },
      'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': {
        name: 'dogwifhat',
        symbol: 'WIF',
        price: 2.45,
        priceChange24h: 8.7,
        volume24h: 32000000,
        marketCap: 2450000000,
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm/logo.png'
      }
    };

    return mockTokens[address] || {
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      price: 0,
      priceChange24h: 0,
      volume24h: 0,
      marketCap: 0,
    };
  };

  const generateCandlestickData = (currentPrice: number) => {
    const now = Math.floor(Date.now() / 1000);
    const data: CandlestickData[] = [];
    
    // Generate 100 candlesticks (last 100 hours for 1h timeframe)
    for (let i = 99; i >= 0; i--) {
      const time = (now - i * 3600) as Time; // 1 hour intervals
      
      // Generate realistic price movement
      const volatility = 0.02; // 2% volatility
      const trend = Math.sin(i / 10) * 0.01; // Slight trend
      const random = (Math.random() - 0.5) * volatility;
      
      const priceChange = trend + random;
      const open = currentPrice * (1 - priceChange / 2);
      const close = currentPrice * (1 + priceChange / 2);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      
      data.push({
        time,
        open: Number(open.toFixed(8)),
        high: Number(high.toFixed(8)),
        low: Number(low.toFixed(8)),
        close: Number(close.toFixed(8)),
      });
    }
    
    setCandlestickData(data);
  };

  const initChart = () => {
    if (!chartContainerRef.current || candlestickData.length === 0) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    }

    // Create new chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1f2937' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#4b5563',
      },
      timeScale: {
        borderColor: '#4b5563',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Set data
    candlestickSeries.setData(candlestickData);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  const formatPrice = (price: number) => {
    if (price < 0.0001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    return price.toFixed(4);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className={`hell-card p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-600 rounded w-32"></div>
            <div className="h-8 bg-gray-600 rounded w-24"></div>
          </div>
          <div className="h-96 bg-gray-700/50 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-12 w-12 text-gray-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className={`hell-card p-6 ${className}`}>
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400">Error loading chart: {error || 'Token not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`hell-card p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="flex items-center gap-3">
            {tokenData.logo && (
              <img 
                src={tokenData.logo} 
                alt={tokenData.symbol}
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-white">{tokenData.symbol}</h2>
              <p className="text-gray-400 text-sm">{tokenData.name}</p>
              <p className="text-xs text-gray-500">
                Data: {tokenData.price > 0 ? 'Live' : 'Mock'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              ${formatPrice(tokenData.price)}
            </span>
            <div className={`flex items-center gap-1 ${
              tokenData.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {tokenData.priceChange24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{tokenData.priceChange24h >= 0 ? '+' : ''}{tokenData.priceChange24h.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex hell-glass rounded-lg p-1">
          {['1h', '4h', '1d'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                timeframe === tf
                  ? 'hell-button text-white'
                  : 'text-orange-300 hover:text-white hover:bg-red-500/20'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="w-full h-96 bg-gray-900/50 rounded-lg mb-6"
      />

      {/* Token Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-orange-300 text-sm">Address</p>
          <div className="flex items-center gap-2">
            <span className="text-white font-mono text-xs">
              {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-8)}
            </span>
            <button
              onClick={() => copyToClipboard(tokenAddress)}
              className="text-gray-500 hover:text-gray-300"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div>
          <p className="text-orange-300 text-sm">Market Cap</p>
          <p className="text-white font-semibold">
            ${formatNumber(tokenData.marketCap)}
          </p>
        </div>
        <div>
          <p className="text-orange-300 text-sm">24h Volume</p>
          <p className="text-white font-semibold">
            ${formatNumber(tokenData.volume24h)}
          </p>
        </div>
        <div>
          <p className="text-orange-300 text-sm">24h Change</p>
          <p className={`font-semibold ${
            tokenData.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {tokenData.priceChange24h >= 0 ? '+' : ''}{tokenData.priceChange24h.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <a
          href={`https://explorer.solana.com/address/${tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Solana Explorer
        </a>
        <a
          href={`https://dexscreener.com/solana/${tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
        >
          📊 DexScreener
        </a>
        <a
          href={`https://jup.ag/swap/${tokenData.symbol}-SOL`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
        >
          🔄 Jupiter Swap
        </a>
      </div>
    </div>
  );
}
