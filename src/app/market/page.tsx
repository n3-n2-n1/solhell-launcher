'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navigation from '@/components/Navigation';
import { useMarketData } from '@/hooks/useMarketData';
import { TokenMarketData } from '@/types/market';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Flame,
  Eye,
  ArrowUpRight,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';

export default function MarketPage() {
  const { connected } = useWallet();
  const { tokens, loading, error, fetchTrendingTokens, fetchTopGainers } = useMarketData();
  const [trendingTokens, setTrendingTokens] = useState<TokenMarketData[]>([]);
  const [topGainers, setTopGainers] = useState<TokenMarketData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'price_change' | 'market_cap'>('volume');
  const [filterDeflationary, setFilterDeflationary] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [trending, gainers] = await Promise.all([
        fetchTrendingTokens(5),
        fetchTopGainers(5)
      ]);
      setTrendingTokens(trending);
      setTopGainers(gainers);
    };
    loadData();
  }, [fetchTrendingTokens, fetchTopGainers]);

  const filteredTokens = tokens
    .filter(token => {
      const matchesSearch = token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = !filterDeflationary || token.isDeflationary;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.volume24h - a.volume24h;
        case 'price_change':
          return b.priceChange24h - a.priceChange24h;
        case 'market_cap':
          return b.marketCap - a.marketCap;
        default:
          return 0;
      }
    });

  const formatPrice = (price: number) => {
    return price < 0.01 ? price.toFixed(6) : price.toFixed(4);
  };

  const formatVolume = (volume: number) => {
    if (volume > 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume > 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Token Marketplace</h1>
          <p className="text-gray-400">
            Descubre y tradea tokens deflacionarios en Solana
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{tokens.length}</p>
                <p className="text-gray-400 text-sm">Tokens Activos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {formatVolume(tokens.reduce((sum, token) => sum + token.volume24h, 0))}
                </p>
                <p className="text-gray-400 text-sm">Volumen 24h</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {tokens.reduce((sum, token) => sum + token.holders, 0)}
                </p>
                <p className="text-gray-400 text-sm">Total Holders</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {tokens.filter(t => t.isDeflationary).length}
                </p>
                <p className="text-gray-400 text-sm">Tokens Deflacionarios</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trending & Top Gainers */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Trending */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Trending
            </h2>
            <div className="space-y-3">
              {trendingTokens.map((token, index) => (
                <Link 
                  key={token.mint} 
                  href={`/trade/${token.mint}`}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/80 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-4">#{index + 1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{token.symbol}</p>
                        {token.isDeflationary && <Flame className="h-3 w-3 text-red-400" />}
                      </div>
                      <p className="text-gray-400 text-xs">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">${formatPrice(token.currentPrice)}</p>
                    <p className="text-gray-400 text-xs">{formatVolume(token.volume24h)} SOL</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Top Gainers */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Top Gainers 24h
            </h2>
            <div className="space-y-3">
              {topGainers.map((token, index) => (
                <Link 
                  key={token.mint} 
                  href={`/trade/${token.mint}`}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/80 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-4">#{index + 1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{token.symbol}</p>
                        {token.isDeflationary && <Flame className="h-3 w-3 text-red-400" />}
                      </div>
                      <p className="text-gray-400 text-xs">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                    </p>
                    <p className="text-gray-400 text-xs">${formatPrice(token.currentPrice)}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="volume">Volumen</option>
                <option value="price_change">Cambio %</option>
                <option value="market_cap">Market Cap</option>
              </select>
              
              <button
                onClick={() => setFilterDeflationary(!filterDeflationary)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  filterDeflationary 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <Flame className="h-4 w-4" />
                Solo Deflacionarios
              </button>
            </div>
          </div>
        </div>

        {/* All Tokens Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    24h %
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Volumen 24h
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Market Cap
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Holders
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredTokens.map((token) => (
                  <tr key={token.mint} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{token.symbol}</p>
                            {token.isDeflationary && <Flame className="h-3 w-3 text-red-400" />}
                            {token.isVerified && (
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{token.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-white font-medium">${formatPrice(token.currentPrice)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 ${
                        token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {token.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-white">{formatVolume(token.volume24h)} SOL</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-white">{formatVolume(token.marketCap)} SOL</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-white">{token.holders.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/trade/${token.mint}`}
                        className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredTokens.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No se encontraron tokens que coincidan con los filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}
