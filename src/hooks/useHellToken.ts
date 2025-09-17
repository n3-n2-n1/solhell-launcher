'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TokenAccountNotFoundError } from '@solana/spl-token';
import { HELL_MINT_ADDRESS } from '@/config/constants';

export function useHellToken() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setBalance(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Obtener la dirección de la cuenta de tokens asociada
      const tokenAccountAddress = await getAssociatedTokenAddress(
        HELL_MINT_ADDRESS,
        publicKey
      );

      try {
        // Intentar obtener la cuenta de tokens
        const tokenAccount = await getAccount(connection, tokenAccountAddress);
        
        // Convertir balance de lamports a tokens (considerando 6 decimales)
        const tokenBalance = Number(tokenAccount.amount) / Math.pow(10, 6);
        setBalance(tokenBalance);
        
        console.log(`💰 Balance HELL: ${tokenBalance.toLocaleString()}`);
      } catch (error) {
        if (error instanceof TokenAccountNotFoundError) {
          // La cuenta de tokens no existe, balance es 0
          setBalance(0);
          console.log('📝 Cuenta de tokens HELL no encontrada, balance: 0');
        } else {
          throw error;
        }
      }
    } catch (err) {
      console.error('Error fetching HELL balance:', err);
      setError('Error al obtener el balance de HELL');
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected, connection]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const refreshBalance = () => {
    fetchBalance();
  };

  return {
    balance,
    loading,
    error,
    refreshBalance,
    mintAddress: HELL_MINT_ADDRESS.toString(),
  };
}
