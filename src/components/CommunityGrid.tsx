import { mockCommunityTokens } from '@/app/mock/MockData'
import { Star, TrendingUp } from 'lucide-react'
import { EyeIcon, HeartIcon } from 'lucide-react'
import React from 'react'
import Link from 'next/link'

type CommunityGridProps = {
  searchTerm: string;
  filterBy: string;
  sortBy: string;
}




  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPrice = (price: number) => {
    if (price < 0.0001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    return price.toFixed(4);
  };

const CommunityGrid = ({ searchTerm, filterBy, sortBy }: CommunityGridProps) => {

    const filteredTokens = mockCommunityTokens.filter(token => {
        const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterBy === 'all' || 
                             (filterBy === 'trending' && token.trending) ||
                             (filterBy === 'verified' && token.verified);
        return matchesSearch && matchesFilter;
      });

      const sortedTokens = [...filteredTokens].sort((a, b) => {
        switch (sortBy) {
          case 'marketCap':
            return b.marketCap - a.marketCap;
          case 'volume':
            return b.volume24h - a.volume24h;
          case 'price':
            return b.price - a.price;
          case 'holders':
            return b.holders - a.holders;
          default:
            return 0;
        }
      });
    
  return (
    <div className="space-y-2">
      {/* Header de la lista */}
      <div className="hell-card p-4">
        <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-orange-300">
          <div className="col-span-3">Token</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">24h Change</div>
          <div className="col-span-2 text-right">Market Cap</div>
          <div className="col-span-2 text-right">Volume</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
      </div>

      {/* Lista de tokens */}
      {sortedTokens.map((token) => (
        <div key={token.id} className="hell-card p-4 group hover:bg-red-500/10 transition-all duration-300">
          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Token Info - Clickeable */}
            <Link href={`/trade/${token.mint}`} className="col-span-3 flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{token.symbol[0]}</span>
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <h3 className="text-sm font-bold text-white">{token.name}</h3>
                  {token.verified && (
                    <Star className="h-3 w-3 text-blue-400 fill-blue-400" />
                  )}
                  {token.trending && (
                    <span className="text-xs">🔥</span>
                  )}
                </div>
                <p className="text-orange-300 text-xs">{token.symbol}</p>
              </div>
            </Link>

            {/* Price */}
            <div className="col-span-2 text-right">
              <div className="text-sm font-bold text-white">${formatPrice(token.price)}</div>
            </div>

            {/* 24h Change */}
            <div className="col-span-2 text-right">
              <div className={`text-sm flex items-center justify-end ${token.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <TrendingUp className={`h-3 w-3 mr-1 ${token.priceChange < 0 ? 'rotate-180' : ''}`} />
                {token.priceChange >= 0 ? '+' : ''}{token.priceChange.toFixed(1)}%
              </div>
            </div>

            {/* Market Cap */}
            <div className="col-span-2 text-right">
              <div className="text-sm font-semibold text-white">${formatNumber(token.marketCap)}</div>
            </div>

            {/* Volume */}
            <div className="col-span-2 text-right">
              <div className="text-sm font-semibold text-white">${formatNumber(token.volume24h)}</div>
            </div>

            {/* Actions */}
            <div className="col-span-1 flex justify-end space-x-1">
              <Link href={`/trade/${token.mint}`}>
                <button className="hell-button p-1.5 rounded-md hover:scale-110 transition-transform">
                  <EyeIcon className="h-3 w-3" />
                </button>
              </Link>
              <button className="hell-glass border border-red-500/30 p-1.5 rounded-md text-orange-300 hover:text-white hover:bg-red-500/20 transition-colors">
                <HeartIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CommunityGrid