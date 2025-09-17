'use client';

import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PumpFunLauncher, PumpFunLaunchConfig, LaunchResult } from '@/services/pumpfunLauncher';

export function usePumpFunLauncher() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLaunchResult, setLastLaunchResult] = useState<LaunchResult | null>(null);

  const launcher = new PumpFunLauncher(connection);

  const launchToken = useCallback(async (config: PumpFunLaunchConfig) => {
    if (!publicKey || !signTransaction) {
      setError('Wallet no conectada');
      return null;
    }

    setLoading(true);
    setError(null);
    setLastLaunchResult(null);

    try {
      console.log('🚀 Lanzando token con configuración:', config);

      // Validaciones básicas
      if (!config.name || !config.symbol) {
        throw new Error('Nombre y símbolo son requeridos');
      }

      if (config.totalSupply <= 0) {
        throw new Error('Supply total debe ser mayor a 0');
      }

      if (config.initialLiquiditySOL <= 0) {
        throw new Error('Liquidez inicial debe ser mayor a 0');
      }

      if (config.tokensForCreator + config.tokensForLiquidity !== 100) {
        throw new Error('La suma de porcentajes debe ser 100%');
      }

      // Verificar balance de SOL del usuario
      const balance = await connection.getBalance(publicKey);
      const requiredLamports = config.initialLiquiditySOL * 1e9 + 0.01 * 1e9; // SOL + fees
      
      if (balance < requiredLamports) {
        throw new Error(`Balance insuficiente. Necesitas al menos ${(requiredLamports / 1e9).toFixed(2)} SOL`);
      }

      // Lanzar token
      const result = await launcher.launchToken(
        config,
        { signTransaction },
        publicKey
      );

      setLastLaunchResult(result);

      if (result.success) {
        console.log('✅ Token lanzado exitosamente:', result);
        return result;
      } else {
        throw new Error(result.error || 'Error desconocido en el lanzamiento');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error lanzando token';
      setError(errorMessage);
      console.error('❌ Error en lanzamiento:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, connection, launcher]);

  const verifyLaunch = useCallback(async (tokenMint: string) => {
    try {
      return await launcher.verifyLaunch(tokenMint);
    } catch (err) {
      console.error('Error verificando lanzamiento:', err);
      return false;
    }
  }, [launcher]);

  const getEstimatedPrice = useCallback(async (
    tokenMint: string,
    liquiditySOL: number,
    liquidityTokens: number
  ) => {
    try {
      return await launcher.getEstimatedPrice(tokenMint, liquiditySOL, liquidityTokens);
    } catch (err) {
      console.error('Error obteniendo precio estimado:', err);
      return 0;
    }
  }, [launcher]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearLastResult = useCallback(() => {
    setLastLaunchResult(null);
  }, []);

  return {
    // State
    loading,
    error,
    lastLaunchResult,
    
    // Actions
    launchToken,
    verifyLaunch,
    getEstimatedPrice,
    clearError,
    clearLastResult,
  };
}
