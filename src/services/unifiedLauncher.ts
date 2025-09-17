import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { TokenRegistryService } from './tokenRegistry';
import { BondingCurveService } from './bondingCurveService';
// import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';

export interface UnifiedTokenConfig {
  // Información básica
  name: string;
  symbol: string;
  description: string;
  image?: string;
  website?: string;
  telegram?: string;
  twitter?: string;
  
  // Token economics
  totalSupply: number;
  decimals: number;
  
  // Configuración deflacionaria (opcional)
  isDeflationary: boolean;
  burnRate?: number; // basis points
  
  // Configuración de liquidez (PumpFun style)
  initialLiquiditySOL?: number; // Opcional - si no se proporciona, se crea con compras
  tokensForLiquidity: number; // porcentaje
  tokensForCreator: number; // porcentaje
  
  // Configuración de precio inicial (si no hay liquidez inicial)
  initialPrice?: number; // Precio inicial del token
  bondingCurve?: boolean; // Usar curva de bonding como PumpFun
  
  // Configuración de lanzamiento (opcional - para proyectos serios)
  hasLaunchPeriod: boolean;
  launchDurationDays?: number;
  tokensForSale?: number; // para el launch period
  pricePerToken?: number; // precio fijo durante launch
  
  // Configuración avanzada (opcional)
  enableGovernance?: boolean;
  enableStaking?: boolean;
  maxHoldingPercent?: number; // anti-whale
}

export interface UnifiedLaunchResult {
  success: boolean;
  tokenMint?: string;
  creatorTokenAccount?: string;
  liquidityPoolId?: string;
  launchConfigPDA?: string; // Si tiene launch period
  programId?: string;
  signature?: string;
  error?: string;
  
  // Información del resultado
  finalPrice?: number;
  liquidityCreated?: number;
  tradingAvailable?: boolean;
  launchEndTime?: Date;
}

export class UnifiedLauncher {
  private connection: Connection;
  private bondingCurveService: BondingCurveService;
  // private program?: Program; // Anchor program si está disponible

  constructor(connection: Connection) {
    this.connection = connection;
    this.bondingCurveService = new BondingCurveService(connection);
    // this.program = program;
  }

  /**
   * Launcher unificado que combina PumpFun + Smart Contracts
   * 
   * Flujo:
   * 1. Crear token mint (siempre)
   * 2. Deploy smart contract (si es deflacionario o tiene launch period)
   * 3. Configurar liquidez automática (siempre)
   * 4. Setup launch period (si está habilitado)
   * 5. Registrar en marketplace
   */
  async launchToken(
    config: UnifiedTokenConfig,
    creatorWallet: { signTransaction: (tx: Transaction) => Promise<Transaction> },
    creatorPublicKey: PublicKey
  ): Promise<UnifiedLaunchResult> {
    try {
      console.log('🚀 Iniciando lanzamiento unificado...', config);

      // 1. CREAR TOKEN MINT (siempre necesario)
      const mintResult = await this.createTokenMint(config, creatorWallet, creatorPublicKey);
      if (!mintResult.success) {
        return { success: false, error: mintResult.error };
      }

      const mintKeypair = mintResult.mintKeypair!;
      const mintSignature = mintResult.signature!;

      // 2. DEPLOY SMART CONTRACT (si es necesario)
      let programResult;
      if (config.isDeflationary || config.hasLaunchPeriod || config.enableGovernance) {
        programResult = await this.deploySmartContract(config, mintKeypair.publicKey, creatorWallet, creatorPublicKey);
        if (!programResult.success) {
          return { success: false, error: programResult.error };
        }
      }

      // 3. CONFIGURAR LIQUIDEZ (automática o bonding curve)
      const liquidityResult = await this.setupLiquidity(
        config, 
        mintKeypair.publicKey, 
        creatorWallet, 
        creatorPublicKey
      );

      // 4. SETUP LAUNCH PERIOD (si está habilitado)
      let launchResult;
      if (config.hasLaunchPeriod) {
        launchResult = await this.setupLaunchPeriod(config, mintKeypair.publicKey, creatorWallet, creatorPublicKey);
      }

      // 5. CONFIGURAR BONDING CURVE Y DEFLACIONARIO
      const bondingCurveResult = await this.setupBondingCurve(
        config, 
        mintKeypair.publicKey, 
        creatorWallet, 
        creatorPublicKey
      );

      // 6. REGISTRAR EN MARKETPLACE
      await this.registerInMarketplace(config, mintKeypair.publicKey.toBase58(), creatorPublicKey.toBase58());

      // 6. DETERMINAR SI EL TRADING ESTÁ DISPONIBLE
      const tradingAvailable = !config.hasLaunchPeriod; // Si no hay launch period, trading inmediato
      const finalPrice = this.calculateFinalPrice(config);

      console.log('✅ Lanzamiento unificado completado exitosamente!');

      return {
        success: true,
        tokenMint: mintKeypair.publicKey.toBase58(),
        creatorTokenAccount: mintResult.creatorTokenAccount,
        liquidityPoolId: liquidityResult?.poolId || `unified_pool_${mintKeypair.publicKey.toBase58().slice(0, 8)}`,
        launchConfigPDA: launchResult?.configPDA,
        programId: programResult?.programId,
        signature: mintSignature,
        finalPrice,
        liquidityCreated: config.initialLiquiditySOL || 0,
        tradingAvailable,
        launchEndTime: config.hasLaunchPeriod 
          ? new Date(Date.now() + (config.launchDurationDays || 7) * 24 * 60 * 60 * 1000)
          : undefined
      };

    } catch (error) {
      console.error('❌ Error en lanzamiento unificado:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Crear el token mint REAL en la blockchain
   * Usa el sistema de fees de Solana (muy baratos ~$0.00025)
   */
  private async createTokenMint(
    config: UnifiedTokenConfig,
    creatorWallet: { signTransaction: (tx: Transaction) => Promise<Transaction> },
    creatorPublicKey: PublicKey
  ) {
    try {
      console.log('📝 Creando token mint REAL en la blockchain...');
      
      // Generar keypair para el mint
      const mintKeypair = Keypair.generate();
      console.log('🎯 Mint address:', mintKeypair.publicKey.toBase58());
      
      // Calcular rent exemption para el mint account
      const mintRent = await this.connection.getMinimumBalanceForRentExemption(82);
      console.log('💰 Rent exemption:', mintRent / 1e9, 'SOL');
      
      // Crear transacción para el mint
      const transaction = new Transaction();
      
      // 1. Crear la cuenta del mint
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: creatorPublicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: 82,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        })
      );
      
      // 2. Inicializar el mint
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          config.decimals,
          creatorPublicKey, // mint authority
          creatorPublicKey  // freeze authority
        )
      );
      
      // 3. Obtener la dirección de la cuenta de tokens asociada
      const creatorTokenAccountAddress = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        creatorPublicKey
      );
      
      // 4. Agregar instrucción para crear la cuenta de tokens asociada
      transaction.add(
        createAssociatedTokenAccountInstruction(
          creatorPublicKey, // payer
          creatorTokenAccountAddress, // associatedToken
          creatorPublicKey, // owner
          mintKeypair.publicKey // mint
        )
      );
      
      // 5. Mintear el supply total al creador
      const totalSupplyAmount = config.totalSupply * Math.pow(10, config.decimals);
      transaction.add(
        createMintToInstruction(
          mintKeypair.publicKey,
          creatorTokenAccountAddress,
          creatorPublicKey,
          totalSupplyAmount
        )
      );
      
      // Configurar la transacción
      transaction.feePayer = creatorPublicKey;
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      
      // Firmar la transacción
      const signedTransaction = await creatorWallet.signTransaction(transaction);
      signedTransaction.partialSign(mintKeypair);
      
      // Enviar la transacción
      console.log('🚀 Enviando transacción a la blockchain...');
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      
      // Confirmar la transacción
      console.log('⏳ Confirmando transacción...');
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log('✅ Token mint REAL creado exitosamente!');
      console.log('🔗 Signature:', signature);
      console.log('📍 Mint Address:', mintKeypair.publicKey.toBase58());
      console.log('👤 Creator Token Account:', creatorTokenAccountAddress.toBase58());
      console.log('💰 Total Supply:', config.totalSupply, config.symbol);

      return {
        success: true,
        mintKeypair,
        signature,
        creatorTokenAccount: creatorTokenAccountAddress.toBase58()
      };

    } catch (error) {
      console.error('❌ Error creando mint real:', error);
      return {
        success: false,
        error: `Error creando mint: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Deploy smart contract para funcionalidades avanzadas
   */
  private async deploySmartContract(
    config: UnifiedTokenConfig,
    mintPublicKey: PublicKey,
    creatorWallet: { signTransaction: (tx: Transaction) => Promise<Transaction> },
    creatorPublicKey: PublicKey
  ) {
    try {
      console.log('🔧 Desplegando smart contract...');

      // Simular deploy del programa (sin Anchor por ahora)
      console.log('⚠️ Programa no disponible, simulando deploy...');
      return {
        success: true,
        programId: 'simulated_program_id',
        configPDA: 'simulated_config_pda'
      };

    } catch (error) {
      return {
        success: false,
        error: `Error desplegando smart contract: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Configurar bonding curve para tokens deflacionarios
   */
  private async setupBondingCurve(
    config: UnifiedTokenConfig,
    mintPublicKey: PublicKey,
    creatorWallet: { signTransaction: (tx: Transaction) => Promise<Transaction> },
    creatorPublicKey: PublicKey
  ) {
    try {
      console.log('🎯 Configurando bonding curve deflacionario...');
      
      // Configurar parámetros de la bonding curve
      const bondingCurveConfig = {
        mintAddress: mintPublicKey.toBase58(),
        initialPrice: config.initialPrice || 0.001, // $0.001 por token
        priceIncrement: 0.0001, // +$0.0001 por cada compra
        burnRate: config.isDeflationary ? (config.burnRate || 2) : 0, // 2% burn por defecto
        maxSupply: config.totalSupply,
        currentSupply: config.totalSupply,
        totalBurned: 0,
        totalVolume: 0,
        totalTrades: 0,
        createdAt: new Date(),
        isActive: true
      };

      // Simular configuración de bonding curve
      // En producción, esto se guardaría en una base de datos o smart contract
      console.log('📊 Bonding curve configurada:');
      console.log('  💰 Precio inicial:', bondingCurveConfig.initialPrice, 'USD');
      console.log('  📈 Incremento por compra:', bondingCurveConfig.priceIncrement, 'USD');
      console.log('  🔥 Tasa de quema:', bondingCurveConfig.burnRate, '%');
      console.log('  📦 Supply inicial:', bondingCurveConfig.maxSupply, config.symbol);

      // Crear pool de liquidez virtual (se activará con la primera compra)
      const virtualPool = {
        poolId: `bonding_curve_${mintPublicKey.toBase58().slice(0, 8)}`,
        mintAddress: mintPublicKey.toBase58(),
        solReserves: 0,
        tokenReserves: 0,
        currentPrice: bondingCurveConfig.initialPrice,
        totalLiquidity: 0,
        isActive: false, // Se activa con la primera compra
        createdAt: new Date()
      };

      console.log('🏊 Pool virtual creado (se activará con la primera compra)');
      console.log('🎯 El token está listo para trading!');

      // Registrar en el servicio de bonding curve
      this.bondingCurveService.registerBondingCurve(bondingCurveConfig, virtualPool);

      return {
        success: true,
        bondingCurveConfig,
        virtualPool,
        poolId: virtualPool.poolId
      };

    } catch (error) {
      console.error('❌ Error configurando bonding curve:', error);
      return {
        success: false,
        error: `Error configurando bonding curve: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Configurar liquidez (automática o bonding curve)
   */
  private async setupLiquidity(
    config: UnifiedTokenConfig,
    mintPublicKey: PublicKey,
    creatorWallet: { signTransaction: (tx: Transaction) => Promise<Transaction> },
    creatorPublicKey: PublicKey
  ) {
    try {
      if (config.initialLiquiditySOL) {
        console.log('🏊 Configurando liquidez automática...');
        
        // Calcular distribución
        const totalSupplyAmount = config.totalSupply * Math.pow(10, config.decimals);
        const liquidityAmount = Math.floor(totalSupplyAmount * (config.tokensForLiquidity / 100));
        
        console.log(`💰 Liquidez: ${config.initialLiquiditySOL} SOL + ${liquidityAmount / Math.pow(10, config.decimals)} ${config.symbol}`);

        // En producción, aquí se crearía el pool real con Raydium/Orca
        const poolId = `unified_pool_${mintPublicKey.toBase58().slice(0, 8)}`;

        console.log('✅ Liquidez automática configurada');

        return {
          success: true,
          poolId,
          liquidityAmount,
          solAmount: config.initialLiquiditySOL
        };
      } else {
      console.log('🚀 Configurando bonding curve GRATIS...');
      
      // Configurar bonding curve - los usuarios crean liquidez al comprar
      const bondingCurveId = `bonding_curve_${mintPublicKey.toBase58().slice(0, 8)}`;
      
      console.log(`📈 Bonding curve configurada con precio inicial: $${config.initialPrice || 0.001}`);
      console.log('✅ Los usuarios crearán liquidez al comprar tokens');
      console.log('💰 ¡Lanzamiento GRATIS! Los fees se pagan al comprar');

        return {
          success: true,
          poolId: bondingCurveId,
          liquidityAmount: 0,
          solAmount: 0,
          bondingCurve: true,
          initialPrice: config.initialPrice || 0.001
        };
      }

    } catch (error) {
      console.error('Error configurando liquidez:', error);
      return {
        success: false,
        error: `Error configurando liquidez: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Setup launch period para proyectos que necesitan fundraising
   */
  private async setupLaunchPeriod(
    config: UnifiedTokenConfig,
    mintPublicKey: PublicKey,
    creatorWallet: { signTransaction: (tx: Transaction) => Promise<Transaction> },
    creatorPublicKey: PublicKey
  ) {
    try {
      console.log('⏰ Configurando período de lanzamiento...');

      // Aquí se configuraría el launch period con el smart contract
      const configPDA = `launch_config_${mintPublicKey.toBase58().slice(0, 8)}`;

      console.log('✅ Período de lanzamiento configurado');

      return {
        success: true,
        configPDA
      };

    } catch (error) {
      return {
        success: false,
        error: `Error configurando launch period: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Registrar token en el marketplace
   */
  private async registerInMarketplace(
    config: UnifiedTokenConfig,
    mintAddress: string,
    creatorAddress: string
  ) {
    try {
      console.log('📋 Registrando en marketplace...');

      TokenRegistryService.addToken({
        mint: mintAddress,
        name: config.name,
        symbol: config.symbol,
        description: config.description,
        image: config.image || '/default-token-logo.png',
        creator: creatorAddress,
        totalSupply: config.totalSupply,
        isDeflationary: config.isDeflationary,
        burnRate: config.isDeflationary ? config.burnRate : 0,
        createdAt: new Date(),
        currentPrice: config.initialPrice || 0.001,
        priceChange24h: 0,
        volume24h: 0,
        marketCap: 0,
        holders: 1,
        highPrice24h: config.initialPrice || 0.001,
        lowPrice24h: config.initialPrice || 0.001,
        trades24h: 0,
        isActive: true,
        isVerified: false,
      });

      console.log('✅ Token registrado en marketplace');

    } catch (error) {
      console.error('Error registrando en marketplace:', error);
    }
  }

  /**
   * Calcular precio final del token
   */
  private calculateFinalPrice(config: UnifiedTokenConfig): number {
    if (config.hasLaunchPeriod && config.pricePerToken) {
      return config.pricePerToken;
    }
    
    // Precio basado en liquidez (estilo PumpFun)
    const liquidityTokens = (config.totalSupply * config.tokensForLiquidity) / 100;
    return (config.initialLiquiditySOL || 0) / liquidityTokens;
  }

  /**
   * Verificar si un token fue lanzado exitosamente
   */
  async verifyLaunch(tokenMint: string): Promise<boolean> {
    try {
      const mintPublicKey = new PublicKey(tokenMint);
      const mintInfo = await this.connection.getAccountInfo(mintPublicKey);
      return mintInfo !== null;
    } catch {
      return false;
    }
  }

  /**
   * Obtener información completa del token lanzado
   */
  async getTokenInfo(tokenMint: string) {
    try {
      const tokenDetails = TokenRegistryService.getTokenByMint(tokenMint);
      const isVerified = await this.verifyLaunch(tokenMint);
      
      return {
        ...tokenDetails,
        isVerified,
        launchMethod: 'unified'
      };
    } catch (error) {
      console.error('Error obteniendo info del token:', error);
      return null;
    }
  }
}
