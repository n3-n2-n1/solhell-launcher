'use client';

import { useParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import Navigation from '@/components/Navigation';
import TokenChart from '@/components/TokenChart';
import SimpleTradingPanel from '@/components/SimpleTradingPanel';
import { useTokenDetails } from '@/hooks/useMarketData';
import { 
  TrendingUp, 
  TrendingDown, 
  Flame,
  ArrowLeft,
  Copy,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function TradePage() {
  const params = useParams();
  const mint = params.mint as string;
  const { } = useWallet();
  const { token, trades, orderBook, loading, error } = useTokenDetails(mint);
  

  const formatPrice = (price: number) => {
    return price < 0.01 ? price.toFixed(6) : price.toFixed(4);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-700 rounded"></div>
              <div className="h-96 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">Error: {error || 'Token not found'}</p>
            <Link href="/" className="text-purple-400 hover:text-purple-300">
              ← Back to marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white">{token.symbol}</h1>
                  {token.isDeflationary && <Flame className="h-6 w-6 text-red-400" />}
                  {token.isVerified && (
                    <div className="w-5 h-5 bg-green-500 rounded-full"></div>
                  )}
                </div>
                <p className="text-gray-400">{token.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(token.mint)}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <a 
                    href={`https://explorer.solana.com/address/${token.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-300"
                    title="View on Solana Explorer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a 
                    href={`https://dexscreener.com/solana/${token.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-300 ml-2"
                    title="View on DexScreener"
                  >
                    📊
                  </a>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-3xl font-bold text-white">${formatPrice(token.currentPrice)}</p>
                <div className={`flex items-center gap-1 ${
                  token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {token.priceChange24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>{token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="hell-card p-4">
            <p className="text-orange-300 text-sm">24h Volume</p>
            <p className="text-white font-semibold">{token.volume24h.toLocaleString()} SOL</p>
          </div>
          <div className="hell-card p-4">
            <p className="text-orange-300 text-sm">Market Cap</p>
            <p className="text-white font-semibold">{token.marketCap.toLocaleString()} SOL</p>
          </div>
          <div className="hell-card p-4">
            <p className="text-orange-300 text-sm">Holders</p>
            <p className="text-white font-semibold">{token.holders.toLocaleString()}</p>
          </div>
          <div className="hell-card p-4">
            <p className="text-orange-300 text-sm">Supply</p>
            <p className="text-white font-semibold">{token.totalSupply.toLocaleString()}</p>
          </div>
          <div className="hell-card p-4">
            <p className="text-orange-300 text-sm">24h High</p>
            <p className="text-white font-semibold">${formatPrice(token.highPrice24h)}</p>
          </div>
          <div className="hell-card p-4">
            <p className="text-orange-300 text-sm">24h Low</p>
            <p className="text-white font-semibold">${formatPrice(token.lowPrice24h)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   {/* Chart & Order Book */}
                   <div className="lg:col-span-2 space-y-6">
                             {/* Token Chart */}
                             <div className="relative">
                               <TokenChart
                                 tokenAddress={token.mint}
                               />
                             </div>

            {/* Order Book */}
            <div className="hell-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Order Book</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Asks (Sell Orders) */}
                <div>
                  <h3 className="text-red-400 font-medium mb-3">Sell Orders</h3>
                  <div className="space-y-1">
                    {orderBook.asks.slice(0, 8).map((ask, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-red-400">${formatPrice(ask.price)}</span>
                        <span className="text-gray-300">{ask.amount.toFixed(0)}</span>
                        <span className="text-gray-400">${ask.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bids (Buy Orders) */}
                <div>
                  <h3 className="text-green-400 font-medium mb-3">Buy Orders</h3>
                  <div className="space-y-1">
                    {orderBook.bids.slice(0, 8).map((bid, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-green-400">${formatPrice(bid.price)}</span>
                        <span className="text-gray-300">{bid.amount.toFixed(0)}</span>
                        <span className="text-gray-400">${bid.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Panel & Recent Trades */}
          <div className="space-y-6">
            {/* Trading Panel */}
            <SimpleTradingPanel token={{
              symbol: token.symbol,
              name: token.name,
              price: token.currentPrice,
              priceChange: token.priceChange24h
            }} />

            {/* Recent Trades */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Trades Recientes</h2>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-4 text-xs text-gray-400 font-medium">
                  <span>Precio</span>
                  <span>Cantidad</span>
                  <span>Tiempo</span>
                </div>
                {trades.slice(0, 10).map((trade, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 text-sm py-1">
                    <span className={trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                      ${formatPrice(trade.price)}
                    </span>
                    <span className="text-gray-300">{trade.amount.toFixed(0)}</span>
                    <span className="text-gray-400">{formatTime(trade.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Real Token Info */}
        {['DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'].includes(token.mint) && (
          <div className="mt-8 bg-green-600/10 border border-green-500/20 rounded-lg p-6">
            <div className="flex gap-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex-shrink-0 mt-0.5"></div>
              <div>
                <h3 className="text-green-300 font-medium mb-2">✅ Real Solana Token</h3>
                <p className="text-green-200 text-sm mb-4">
                  This is a verified token on the Solana blockchain with real liquidity and trading activity.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <a 
                    href={`https://explorer.solana.com/address/${token.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Solana Explorer
                  </a>
                  <a 
                    href={`https://dexscreener.com/solana/${token.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                  >
                    📊 DexScreener
                  </a>
                  <a 
                    href={`https://jup.ag/swap/${token.symbol}-SOL`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                  >
                    🔄 Jupiter Swap
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Token Info */}
        {token.isDeflationary && (
          <div className="mt-8 bg-red-600/10 border border-red-500/20 rounded-lg p-6">
            <div className="flex gap-3">
              <Flame className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-300 font-medium mb-2">Deflationary Token</h3>
                <p className="text-red-200 text-sm mb-2">
                  This token has a burn rate of {(token.burnRate! / 100).toFixed(1)}% on each transaction.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-red-300">Total Burned: </span>
                    <span className="text-white">{token.totalBurned?.toLocaleString() || 0} {token.symbol}</span>
                  </div>
                  <div>
                    <span className="text-red-300">Current Supply: </span>
                    <span className="text-white">{(token.totalSupply - (token.totalBurned || 0)).toLocaleString()} {token.symbol}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
