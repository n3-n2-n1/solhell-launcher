
import { platformStats } from '@/app/mock/MockData'
const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };
const Stats = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
    <div className="hell-card p-4 text-center">
      <div className="text-2xl font-bold text-white mb-1">{platformStats.totalTokens}</div>
      <div className="text-sm text-orange-300">Total Tokens</div>
    </div>
    <div className="hell-card p-4 text-center">
      <div className="text-2xl font-bold text-white mb-1">${formatNumber(platformStats.totalVolume24h)}</div>
      <div className="text-sm text-orange-300">24h Volume</div>
    </div>
    <div className="hell-card p-4 text-center">
      <div className="text-2xl font-bold text-white mb-1">${formatNumber(platformStats.totalMarketCap)}</div>
      <div className="text-sm text-orange-300">Market Cap</div>
    </div>
    <div className="hell-card p-4 text-center">
      <div className="text-2xl font-bold text-white mb-1">{formatNumber(platformStats.activeUsers)}</div>
      <div className="text-sm text-orange-300">Active Users</div>
    </div>
    <div className="hell-card p-4 text-center">
      <div className="text-2xl font-bold text-white mb-1">{formatNumber(platformStats.tokensBurned)}</div>
      <div className="text-sm text-orange-300">Tokens Burned</div>
    </div>
  </div>
  )
}

export default Stats