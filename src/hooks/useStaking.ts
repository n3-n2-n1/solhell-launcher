'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export function useStaking() {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stake = useCallback(async (amount: number, lockPeriodDays: number) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // En producción, aquí crearías la transacción real para el staking
      console.log('Staking:', { amount, lockPeriodDays });
      
      // Simular delay de transacción
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful staking
      return {
        signature: 'mock_signature_' + Date.now(),
        success: true,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  const unstake = useCallback(async (stakeId: string) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // En producción, aquí crearías la transacción real para el unstaking
      console.log('Unstaking:', stakeId);
      
      // Simular delay de transacción
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        signature: 'mock_unstake_signature_' + Date.now(),
        success: true,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  const claimRewards = useCallback(async (stakeId: string) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // En producción, aquí crearías la transacción real para reclamar rewards
      console.log('Claiming rewards for:', stakeId);
      
      // Simular delay de transacción
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        signature: 'mock_claim_signature_' + Date.now(),
        success: true,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  const calculateRewards = useCallback((amount: number, days: number, apr: number = 0.0075) => {
    const dailyReward = amount * apr;
    const totalRewards = dailyReward * days;
    return {
      dailyReward,
      totalRewards,
      apr,
    };
  }, []);

  return {
    stake,
    unstake,
    claimRewards,
    calculateRewards,
    loading,
    error,
  };
}
