'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSimpleTrading } from '@/hooks/useSimpleTrading';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface SimpleTradingPanelProps {
  token: {
    symbol: string;
    name: string;
    price: number;
    priceChange: number;
  };
  className?: string;
}

export default function SimpleTradingPanel({ token, className = '' }: SimpleTradingPanelProps) {
  const { connected } = useWallet();
  const { loading, error, lastTrade, executeTrade, clearError, clearLastTrade } = useSimpleTrading();
  
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(100); // 1% default

  const formatPrice = (price: number) => {
    if (price < 0.0001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    return price.toFixed(4);
  };

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    const tradeAmount = parseFloat(amount);
    const tradePrice = token.price;
    
    const result = await executeTrade(orderType, tradeAmount, tradePrice, token.symbol);
    
    if (result.success) {
      setAmount('');
    }
  };

  const calculateOutput = () => {
    if (!amount || parseFloat(amount) <= 0) return { output: 0, total: 0 };
    
    const inputAmount = parseFloat(amount);
    const price = token.price;
    
    if (orderType === 'buy') {
      const output = inputAmount / price;
      const total = inputAmount;
      return { output, total };
    } else {
      const output = inputAmount * price;
      const total = inputAmount;
      return { output, total };
    }
  };

  const { output, total } = calculateOutput();

  if (!connected) {
    return (
      <div className={`hell-card p-6 ${className}`}>
        <h2 className="text-xl font-semibold text-white mb-4">Infernal Trading</h2>
        <div className="text-center py-8">
          <p className="text-orange-300 mb-4">Connect your wallet to trade in hell</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`hell-card p-6 ${className}`}>
      <h2 className="text-xl font-semibold text-white mb-4">Infernal Trading Panel</h2>
      
      <div className="space-y-4">
        {/* Order Type Selector */}
        <div className="flex rounded-lg hell-glass p-1">
          <button
            onClick={() => setOrderType('buy')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              orderType === 'buy'
                ? 'hell-button text-white'
                : 'text-orange-300 hover:text-white hover:bg-red-500/20'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline mr-1" />
            Buy
          </button>
          <button
            onClick={() => setOrderType('sell')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              orderType === 'sell'
                ? 'hell-button text-white'
                : 'text-orange-300 hover:text-white hover:bg-red-500/20'
            }`}
          >
            <TrendingDown className="h-4 w-4 inline mr-1" />
            Sell
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-orange-300 mb-2">
            Amount {orderType === 'buy' ? '(SOL)' : `(${token.symbol})`}
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full hell-glass border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-orange-400 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Trade Details */}
        {amount && parseFloat(amount) > 0 && (
          <div className="hell-glass rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-white mb-2">Trade Details</h3>
            
            <div className="flex justify-between text-sm">
              <span className="text-orange-300">Price:</span>
              <span className="text-white">${formatPrice(token.price)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-orange-300">
                {orderType === 'buy' ? 'You will receive:' : 'You will get:'}
              </span>
              <span className="text-white">
                {orderType === 'buy' 
                  ? `${output.toFixed(2)} ${token.symbol}`
                  : `${output.toFixed(6)} SOL`
                }
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-orange-300">Total:</span>
              <span className="text-white">
                {orderType === 'buy' 
                  ? `${total.toFixed(6)} SOL`
                  : `${total.toFixed(2)} ${token.symbol}`
                }
              </span>
            </div>
          </div>
        )}

        {/* Slippage Selector */}
        <div>
          <label className="block text-sm font-medium text-orange-300 mb-2">
            Slippage Tolerance
          </label>
          <div className="flex gap-2">
            {[50, 100, 300, 500].map((bps) => (
              <button
                key={bps}
                onClick={() => setSlippage(bps)}
                className={`px-3 py-2 text-sm rounded transition-colors ${
                  slippage === bps
                    ? 'hell-button text-white'
                    : 'hell-glass text-orange-300 hover:text-white hover:bg-red-500/20'
                }`}
              >
                {(bps / 100).toFixed(1)}%
              </button>
            ))}
          </div>
        </div>

        {/* Execute Trade Button */}
        <button
          onClick={handleTrade}
          disabled={!amount || parseFloat(amount) <= 0 || loading}
          className="w-full hell-button py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              {orderType === 'buy' ? 'Buy' : 'Sell'} {token.symbol}
            </>
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="hell-glass border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 text-sm mt-1"
            >
              Close
            </button>
          </div>
        )}

        {/* Success Display */}
        {lastTrade && lastTrade.success && (
          <div className="hell-glass border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">Infernal transaction successful!</span>
            </div>
            <div className="text-sm text-green-300 mb-2">
              {lastTrade.side === 'buy' ? 'Bought' : 'Sold'} {lastTrade.amount} {token.symbol} at ${formatPrice(lastTrade.price || 0)}
            </div>
            <a
              href={`https://explorer.solana.com/tx/${lastTrade.signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm"
            >
              View in Explorer
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={clearLastTrade}
              className="text-green-400 hover:text-green-300 text-sm mt-1"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
