'use client';

import { useState, useCallback, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { UnifiedLauncher, UnifiedTokenConfig, UnifiedLaunchResult } from '@/services/unifiedLauncher';

export function useUnifiedLauncher() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLaunchResult, setLastLaunchResult] = useState<UnifiedLaunchResult | null>(null);

  const launcher = useMemo(() => new UnifiedLauncher(connection), [connection]);

  const launchToken = useCallback(async (config: UnifiedTokenConfig) => {
    if (!publicKey || !signTransaction) {
      setError('Wallet no conectada');
      return null;
    }

    setLoading(true);
    setError(null);
    setLastLaunchResult(null);

    try {
      console.log('🚀 Iniciando lanzamiento unificado:', config);

      // Validaciones básicas
      const validationError = validateConfig(config);
      if (validationError) {
        throw new Error(validationError);
      }

      // Verificar que el usuario tenga SOL para los fees mínimos (~0.002 SOL)
      const balance = await connection.getBalance(publicKey);
      const minimumFees = 0.002 * 1e9; // ~0.002 SOL para fees de transacción
      
      if (balance < minimumFees) {
        throw new Error(`Necesitas al menos 0.002 SOL para los fees de transacción. Tu balance: ${(balance / 1e9).toFixed(4)} SOL`);
      }
      
      console.log('🚀 Lanzamiento con fees mínimos - Balance verificado:', (balance / 1e9).toFixed(4), 'SOL');

      // Lanzar token con el sistema unificado
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
      console.error('❌ Error en lanzamiento unificado:', err);
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

  const getTokenInfo = useCallback(async (tokenMint: string) => {
    try {
      return await launcher.getTokenInfo(tokenMint);
    } catch (err) {
      console.error('Error obteniendo info del token:', err);
      return null;
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
    getTokenInfo,
    clearError,
    clearLastResult,
  };
}

/**
 * Validar configuración del token
 */
function validateConfig(config: UnifiedTokenConfig): string | null {
  // Validaciones básicas
  if (!config.name || !config.symbol) {
    return 'Nombre y símbolo son requeridos';
  }

  if (config.name.length > 32) {
    return 'Nombre muy largo (máximo 32 caracteres)';
  }

  if (config.symbol.length > 10) {
    return 'Símbolo muy largo (máximo 10 caracteres)';
  }

  if (config.totalSupply <= 0) {
    return 'Supply total debe ser mayor a 0';
  }

  // La liquidez inicial es opcional - si no se proporciona, se crea con compras
  if (config.initialLiquiditySOL !== undefined && config.initialLiquiditySOL < 0) {
    return 'Liquidez inicial no puede ser negativa';
  }

  if (config.tokensForCreator + config.tokensForLiquidity !== 100) {
    return 'La suma de porcentajes debe ser 100%';
  }

  // Validaciones deflacionarias
  if (config.isDeflationary) {
    if (!config.burnRate || config.burnRate <= 0) {
      return 'Tasa de quema requerida para tokens deflacionarios';
    }
    
    if (config.burnRate > 1000) { // 10%
      return 'Tasa de quema muy alta (máximo 10%)';
    }
  }

  // Validaciones de launch period
  if (config.hasLaunchPeriod) {
    if (!config.launchDurationDays || config.launchDurationDays <= 0) {
      return 'Duración del lanzamiento requerida';
    }

    if (config.launchDurationDays > 30) {
      return 'Duración del lanzamiento muy larga (máximo 30 días)';
    }

    if (!config.tokensForSale || config.tokensForSale <= 0) {
      return 'Cantidad de tokens para venta requerida';
    }

    if (!config.pricePerToken || config.pricePerToken <= 0) {
      return 'Precio por token requerido para launch period';
    }
  }

  // Validaciones anti-whale
  if (config.maxHoldingPercent && (config.maxHoldingPercent <= 0 || config.maxHoldingPercent > 100)) {
    return 'Porcentaje máximo de holding debe estar entre 1% y 100%';
  }

  return null; // Todo válido
}

/**
 * Crear configuración simple (estilo PumpFun)
 */
export function createSimpleConfig(
  name: string,
  symbol: string,
  description: string,
  totalSupply: number = 1000000,
  initialLiquiditySOL?: number, // Opcional - si no se proporciona, se crea con compras
  isDeflationary: boolean = false,
  burnRate?: number
): UnifiedTokenConfig {
  return {
    name,
    symbol,
    description,
    totalSupply,
    decimals: 6,
    isDeflationary,
    burnRate: isDeflationary ? (burnRate || 100) : undefined, // 1% default
    initialLiquiditySOL, // Puede ser undefined para bonding curve
    tokensForLiquidity: 80,
    tokensForCreator: 20,
    hasLaunchPeriod: false, // Trading inmediato
    enableGovernance: false,
    enableStaking: false,
    bondingCurve: !initialLiquiditySOL, // Usar bonding curve si no hay liquidez inicial
  };
}

/**
 * Crear configuración avanzada (con launch period)
 */
export function createAdvancedConfig(
  basicConfig: Omit<UnifiedTokenConfig, 'hasLaunchPeriod' | 'tokensForLiquidity' | 'tokensForCreator'>,
  launchConfig: {
    launchDurationDays: number;
    tokensForSale: number;
    pricePerToken: number;
    tokensForLiquidity: number;
    tokensForCreator: number;
  }
): UnifiedTokenConfig {
  return {
    ...basicConfig,
    hasLaunchPeriod: true,
    launchDurationDays: launchConfig.launchDurationDays,
    tokensForSale: launchConfig.tokensForSale,
    pricePerToken: launchConfig.pricePerToken,
    tokensForLiquidity: launchConfig.tokensForLiquidity,
    tokensForCreator: launchConfig.tokensForCreator,
  };
}
