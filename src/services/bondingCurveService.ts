'use client';

import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';

export interface BondingCurveConfig {
  mintAddress: string;
  initialPrice: number;
  priceIncrement: number;
  burnRate: number;
  maxSupply: number;
  currentSupply: number;
  totalBurned: number;
  totalVolume: number;
  totalTrades: number;
  createdAt: Date;
  isActive: boolean;
}

export interface VirtualPool {
  poolId: string;
  mintAddress: string;
  solReserves: number;
  tokenReserves: number;
  currentPrice: number;
  totalLiquidity: number;
  isActive: boolean;
  createdAt: Date;
}

export interface TradeResult {
  success: boolean;
  newPrice: number;
  tokensReceived: number;
  solPaid: number;
  tokensBurned: number;
  newSupply: number;
  signature?: string;
  error?: string;
}

export class BondingCurveService {
  private connection: Connection;
  private bondingCurves: Map<string, BondingCurveConfig> = new Map();
  private virtualPools: Map<string, VirtualPool> = new Map();

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Comprar tokens usando bonding curve
   */
  async buyTokens(
    mintAddress: string,
    solAmount: number,
    buyerPublicKey: PublicKey,
    buyerWallet: { signTransaction: (tx: Transaction) => Promise<Transaction> }
  ): Promise<TradeResult> {
    try {
      console.log('🛒 Procesando compra de tokens...');
      
      const bondingCurve = this.bondingCurves.get(mintAddress);
      const virtualPool = this.virtualPools.get(mintAddress);
      
      if (!bondingCurve || !virtualPool) {
        throw new Error('Token no encontrado en bonding curve');
      }

      // Calcular tokens a recibir basado en bonding curve
      const currentPrice = this.calculateCurrentPrice(bondingCurve, virtualPool);
      const tokensToReceive = solAmount / currentPrice;
      
      // Calcular tokens a quemar (si es deflacionario)
      const tokensToBurn = bondingCurve.burnRate > 0 
        ? (tokensToReceive * bondingCurve.burnRate) / 100 
        : 0;
      
      const actualTokensReceived = tokensToReceive - tokensToBurn;
      
      // Actualizar bonding curve
      bondingCurve.currentSupply -= tokensToBurn;
      bondingCurve.totalBurned += tokensToBurn;
      bondingCurve.totalVolume += solAmount;
      bondingCurve.totalTrades += 1;
      
      // Actualizar pool virtual
      virtualPool.solReserves += solAmount;
      virtualPool.tokenReserves += actualTokensReceived;
      virtualPool.currentPrice = this.calculateCurrentPrice(bondingCurve, virtualPool);
      virtualPool.totalLiquidity = virtualPool.solReserves + (virtualPool.tokenReserves * virtualPool.currentPrice);
      virtualPool.isActive = true; // Se activa con la primera compra
      
      // Crear transacción de compra
      const transaction = new Transaction();
      
      // 1. Transferir SOL al pool (simulado - en producción sería a un smart contract)
      // 2. Transferir tokens al comprador
      const mintPublicKey = new PublicKey(mintAddress);
      const buyerTokenAccount = await getAssociatedTokenAddress(mintPublicKey, buyerPublicKey);
      
      // Verificar si la cuenta de tokens existe, si no, crearla
      try {
        await this.connection.getAccountInfo(buyerTokenAccount);
      } catch {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            buyerPublicKey,
            buyerTokenAccount,
            buyerPublicKey,
            mintPublicKey
          )
        );
      }
      
      // Transferir tokens (simulado - en producción vendría del pool)
      // transaction.add(
      //   createTransferInstruction(
      //     poolTokenAccount,
      //     buyerTokenAccount,
      //     poolPublicKey,
      //     actualTokensReceived * Math.pow(10, 9) // Convertir a lamports
      //   )
      // );
      
      // Configurar transacción
      transaction.feePayer = buyerPublicKey;
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      
      // Firmar y enviar (simulado por ahora)
      const signedTransaction = await buyerWallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log('✅ Compra procesada exitosamente');
      console.log('💰 SOL pagado:', solAmount);
      console.log('🪙 Tokens recibidos:', actualTokensReceived);
      console.log('🔥 Tokens quemados:', tokensToBurn);
      console.log('📈 Nuevo precio:', virtualPool.currentPrice);
      
      return {
        success: true,
        newPrice: virtualPool.currentPrice,
        tokensReceived: actualTokensReceived,
        solPaid: solAmount,
        tokensBurned: tokensToBurn,
        newSupply: bondingCurve.currentSupply,
        signature
      };
      
    } catch (error) {
      console.error('❌ Error en compra:', error);
      return {
        success: false,
        newPrice: 0,
        tokensReceived: 0,
        solPaid: 0,
        tokensBurned: 0,
        newSupply: 0,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Vender tokens usando bonding curve
   */
  async sellTokens(
    mintAddress: string,
    tokenAmount: number,
    sellerPublicKey: PublicKey,
    sellerWallet: { signTransaction: (tx: Transaction) => Promise<Transaction> }
  ): Promise<TradeResult> {
    try {
      console.log('💸 Procesando venta de tokens...');
      
      const bondingCurve = this.bondingCurves.get(mintAddress);
      const virtualPool = this.virtualPools.get(mintAddress);
      
      if (!bondingCurve || !virtualPool || !virtualPool.isActive) {
        throw new Error('Token no disponible para venta');
      }

      // Calcular SOL a recibir basado en bonding curve
      const currentPrice = this.calculateCurrentPrice(bondingCurve, virtualPool);
      const solToReceive = tokenAmount * currentPrice;
      
      // Calcular tokens a quemar (si es deflacionario)
      const tokensToBurn = bondingCurve.burnRate > 0 
        ? (tokenAmount * bondingCurve.burnRate) / 100 
        : 0;
      
      const actualTokensSold = tokenAmount - tokensToBurn;
      const actualSolReceived = actualTokensSold * currentPrice;
      
      // Actualizar bonding curve
      bondingCurve.currentSupply -= tokensToBurn;
      bondingCurve.totalBurned += tokensToBurn;
      bondingCurve.totalVolume += actualSolReceived;
      bondingCurve.totalTrades += 1;
      
      // Actualizar pool virtual
      virtualPool.solReserves -= actualSolReceived;
      virtualPool.tokenReserves -= actualTokensSold;
      virtualPool.currentPrice = this.calculateCurrentPrice(bondingCurve, virtualPool);
      virtualPool.totalLiquidity = virtualPool.solReserves + (virtualPool.tokenReserves * virtualPool.currentPrice);
      
      console.log('✅ Venta procesada exitosamente');
      console.log('🪙 Tokens vendidos:', actualTokensSold);
      console.log('💰 SOL recibido:', actualSolReceived);
      console.log('🔥 Tokens quemados:', tokensToBurn);
      console.log('📉 Nuevo precio:', virtualPool.currentPrice);
      
      return {
        success: true,
        newPrice: virtualPool.currentPrice,
        tokensReceived: 0,
        solPaid: actualSolReceived,
        tokensBurned: tokensToBurn,
        newSupply: bondingCurve.currentSupply
      };
      
    } catch (error) {
      console.error('❌ Error en venta:', error);
      return {
        success: false,
        newPrice: 0,
        tokensReceived: 0,
        solPaid: 0,
        tokensBurned: 0,
        newSupply: 0,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Calcular precio actual basado en bonding curve
   */
  private calculateCurrentPrice(bondingCurve: BondingCurveConfig, virtualPool: VirtualPool): number {
    if (!virtualPool.isActive) {
      return bondingCurve.initialPrice;
    }
    
    // Fórmula simple de bonding curve: precio = precio_inicial + (trades * incremento)
    const priceIncrease = bondingCurve.totalTrades * bondingCurve.priceIncrement;
    return bondingCurve.initialPrice + priceIncrease;
  }

  /**
   * Obtener datos del bonding curve
   */
  getBondingCurveData(mintAddress: string): BondingCurveConfig | null {
    return this.bondingCurves.get(mintAddress) || null;
  }

  /**
   * Obtener datos del pool virtual
   */
  getVirtualPoolData(mintAddress: string): VirtualPool | null {
    return this.virtualPools.get(mintAddress) || null;
  }

  /**
   * Registrar bonding curve (llamado desde el launcher)
   */
  registerBondingCurve(config: BondingCurveConfig, pool: VirtualPool): void {
    this.bondingCurves.set(config.mintAddress, config);
    this.virtualPools.set(config.mintAddress, pool);
    console.log('📊 Bonding curve registrada:', config.mintAddress);
  }

  /**
   * Obtener historial de precios para charts
   */
  getPriceHistory(mintAddress: string, hours: number = 24): Array<{timestamp: number, price: number, volume: number}> {
    const bondingCurve = this.bondingCurves.get(mintAddress);
    const virtualPool = this.virtualPools.get(mintAddress);
    
    if (!bondingCurve || !virtualPool) {
      return [];
    }

    // Simular historial de precios (en producción vendría de una base de datos)
    const history = [];
    const now = Date.now();
    const interval = (hours * 60 * 60 * 1000) / 24; // 24 puntos por hora
    
    for (let i = 0; i < 24; i++) {
      const timestamp = now - (i * interval);
      const price = bondingCurve.initialPrice + (i * bondingCurve.priceIncrement * 0.1);
      const volume = Math.random() * 1000; // Simulado
      
      history.push({ timestamp, price, volume });
    }
    
    return history.reverse();
  }
}
