'use client';

import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { JupiterService, SwapQuote } from '@/services/jupiterService';
import { TokenMarketData } from '@/types/market';

export interface TradeOrder {
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  amount: number;
  price?: number; // For limit orders
  slippageBps?: number;
}

export function useTrading(token: TokenMarketData | null) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [lastTransactionSignature, setLastTransactionSignature] = useState<string | null>(null);

  const getQuote = useCallback(async (order: TradeOrder) => {
    if (!token || !publicKey) {
      setError('Token o wallet no disponible');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const SOL_MINT = 'So11111111111111111111111111111111111111112';
      let inputMint: string;
      let outputMint: string;
      let amount: number;

      if (order.type === 'buy') {
        // Buying token with SOL
        inputMint = SOL_MINT;
        outputMint = token.mint;
        amount = Math.floor(order.amount * 1e9); // Convert SOL to lamports
      } else {
        // Selling token for SOL
        inputMint = token.mint;
        outputMint = SOL_MINT;
        amount = Math.floor(order.amount * Math.pow(10, 6)); // Assuming 6 decimals
      }

      const jupiterQuote = await JupiterService.getQuote(
        inputMint,
        outputMint,
        amount,
        order.slippageBps || 100 // 1% default slippage
      );

      if (!jupiterQuote) {
        throw new Error('No se pudo obtener cotización de Jupiter');
      }

      setQuote(jupiterQuote);
      return jupiterQuote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error obteniendo cotización';
      setError(errorMessage);
      console.error('Error getting quote:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, publicKey]);

  const executeMarketOrder = useCallback(async (order: TradeOrder) => {
    if (!token || !publicKey || !signTransaction) {
      setError('Configuración requerida no disponible');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      let signature: string | null = null;

      if (order.type === 'buy') {
        signature = await JupiterService.buyTokenWithSOL(
          token.mint,
          order.amount,
          publicKey.toBase58(),
          connection,
          { signTransaction },
          order.slippageBps || 100
        );
      } else {
        signature = await JupiterService.sellTokenForSOL(
          token.mint,
          order.amount,
          6, // Assuming 6 decimals
          publicKey.toBase58(),
          connection,
          { signTransaction },
          order.slippageBps || 100
        );
      }

      if (signature) {
        setLastTransactionSignature(signature);
        console.log(`${order.type === 'buy' ? 'Compra' : 'Venta'} exitosa:`, signature);
        return signature;
      } else {
        throw new Error('Transacción falló');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error ejecutando orden';
      setError(errorMessage);
      console.error('Error executing market order:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, publicKey, signTransaction, connection]);

  const executeLimitOrder = useCallback(async (order: TradeOrder) => {
    // Limit orders require a more complex implementation
    // For now, we'll simulate with a market order if price is close
    if (!token || !order.price) {
      setError('Precio límite requerido');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if current price is within acceptable range for limit order
      const priceDifference = Math.abs(token.currentPrice - order.price) / token.currentPrice;
      
      if (priceDifference > 0.05) { // 5% threshold
        setError('Precio límite muy alejado del precio actual. Use orden de mercado.');
        return null;
      }

      // Execute as market order if price is close
      return await executeMarketOrder({
        ...order,
        orderType: 'market'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error ejecutando orden límite';
      setError(errorMessage);
      console.error('Error executing limit order:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, executeMarketOrder]);

  const executeTrade = useCallback(async (order: TradeOrder) => {
    if (order.orderType === 'market') {
      return await executeMarketOrder(order);
    } else {
      return await executeLimitOrder(order);
    }
  }, [executeMarketOrder, executeLimitOrder]);

  const calculateTradeDetails = useCallback((order: TradeOrder, currentQuote?: SwapQuote) => {
    if (!token) return null;

    const quoteToUse = currentQuote || quote;
    if (!quoteToUse) return null;

    const inputAmount = parseFloat(quoteToUse.inAmount);
    const outputAmount = parseFloat(quoteToUse.outAmount);
    const priceImpact = parseFloat(quoteToUse.priceImpactPct);

    let effectivePrice: number;
    let total: number;

    if (order.type === 'buy') {
      // Buying tokens with SOL
      effectivePrice = (inputAmount / 1e9) / (outputAmount / 1e6); // SOL per token
      total = inputAmount / 1e9; // Total SOL needed
    } else {
      // Selling tokens for SOL  
      effectivePrice = (outputAmount / 1e9) / (inputAmount / 1e6); // SOL per token
      total = outputAmount / 1e9; // Total SOL received
    }

    return {
      effectivePrice,
      total,
      priceImpact,
      inputAmount: order.type === 'buy' ? inputAmount / 1e9 : inputAmount / 1e6,
      outputAmount: order.type === 'buy' ? outputAmount / 1e6 : outputAmount / 1e9,
    };
  }, [token, quote]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearQuote = useCallback(() => {
    setQuote(null);
  }, []);

  return {
    // State
    loading,
    error,
    quote,
    lastTransactionSignature,
    
    // Actions
    getQuote,
    executeTrade,
    executeMarketOrder,
    executeLimitOrder,
    calculateTradeDetails,
    clearError,
    clearQuote,
  };
}
