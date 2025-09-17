'use client';

import { useState, useCallback, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { BondingCurveService, BondingCurveConfig, VirtualPool, TradeResult } from '../services/bondingCurveService';

export function useBondingCurve() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bondingCurveService = useMemo(() => new BondingCurveService(connection), [connection]);

  const buyTokens = useCallback(async (
    mintAddress: string,
    solAmount: number
  ): Promise<TradeResult | null> => {
    if (!publicKey || !signTransaction) {
      setError('Wallet no conectada');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await bondingCurveService.buyTokens(
        mintAddress,
        solAmount,
        publicKey,
        { signTransaction }
      );

      if (!result.success) {
        setError(result.error || 'Error en la compra');
        return null;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, bondingCurveService]);

  const sellTokens = useCallback(async (
    mintAddress: string,
    tokenAmount: number
  ): Promise<TradeResult | null> => {
    if (!publicKey || !signTransaction) {
      setError('Wallet no conectada');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await bondingCurveService.sellTokens(
        mintAddress,
        tokenAmount,
        publicKey,
        { signTransaction }
      );

      if (!result.success) {
        setError(result.error || 'Error en la venta');
        return null;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, bondingCurveService]);

  const getBondingCurveData = useCallback((mintAddress: string): BondingCurveConfig | null => {
    return bondingCurveService.getBondingCurveData(mintAddress);
  }, [bondingCurveService]);

  const getVirtualPoolData = useCallback((mintAddress: string): VirtualPool | null => {
    return bondingCurveService.getVirtualPoolData(mintAddress);
  }, [bondingCurveService]);

  const getPriceHistory = useCallback((mintAddress: string, hours: number = 24) => {
    return bondingCurveService.getPriceHistory(mintAddress, hours);
  }, [bondingCurveService]);

  return {
    buyTokens,
    sellTokens,
    getBondingCurveData,
    getVirtualPoolData,
    getPriceHistory,
    loading,
    error,
    clearError: () => setError(null)
  };
}
