import { useState } from 'react';

interface TradeResult {
  success: boolean;
  signature?: string;
  amount?: number;
  price?: number;
  side?: 'buy' | 'sell';
  error?: string;
}

export function useSimpleTrading() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTrade, setLastTrade] = useState<TradeResult | null>(null);

  const executeTrade = async (
    side: 'buy' | 'sell',
    amount: number,
    price: number,
    _tokenSymbol: string
  ): Promise<TradeResult> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate random success/failure
      const success = Math.random() > 0.1; // 90% success rate

      if (!success) {
        throw new Error('Transaction failed: Insufficient liquidity');
      }

      // Generate mock transaction signature
      const signature = Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      const result: TradeResult = {
        success: true,
        signature,
        amount,
        price,
        side
      };

      setLastTrade(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      const result: TradeResult = {
        success: false,
        error: errorMessage
      };
      return result;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);
  const clearLastTrade = () => setLastTrade(null);

  return {
    loading,
    error,
    lastTrade,
    executeTrade,
    clearError,
    clearLastTrade
  };
}
