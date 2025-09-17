import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { TokenMarketData } from '@/types/market';

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
  }>;
}

export interface SwapTransaction {
  swapTransaction: string; // Base64 encoded transaction
}

export class JupiterService {
  private static readonly JUPITER_API_URL = 'https://quote-api.jup.ag/v6';
  private static readonly SOL_MINT = 'So11111111111111111111111111111111111111112';

  static async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50 // 0.5% default slippage
  ): Promise<SwapQuote | null> {
    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amount.toString(),
        slippageBps: slippageBps.toString(),
        onlyDirectRoutes: 'false',
        asLegacyTransaction: 'false',
      });

      const response = await fetch(`${this.JUPITER_API_URL}/quote?${params}`);
      
      if (!response.ok) {
        console.error('Jupiter quote failed:', await response.text());
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Jupiter quote:', error);
      return null;
    }
  }

  static async getSwapTransaction(
    quote: SwapQuote,
    userPublicKey: string,
    wrapAndUnwrapSol: boolean = true
  ): Promise<SwapTransaction | null> {
    try {
      const response = await fetch(`${this.JUPITER_API_URL}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey,
          wrapAndUnwrapSol,
          computeUnitPriceMicroLamports: 'auto',
        }),
      });

      if (!response.ok) {
        console.error('Jupiter swap transaction failed:', await response.text());
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting swap transaction:', error);
      return null;
    }
  }

  static async executeSwap(
    connection: Connection,
    swapTransaction: SwapTransaction,
    wallet: any // Wallet adapter
  ): Promise<string | null> {
    try {
      // Deserialize the transaction
      const transactionBuf = Buffer.from(swapTransaction.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(transactionBuf);

      // Sign and send transaction
      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await connection.sendTransaction(signedTransaction);

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        console.error('Transaction failed:', confirmation.value.err);
        return null;
      }

      return signature;
    } catch (error) {
      console.error('Error executing swap:', error);
      return null;
    }
  }

  // Helper method to buy a token with SOL
  static async buyTokenWithSOL(
    tokenMint: string,
    solAmount: number,
    userPublicKey: string,
    connection: Connection,
    wallet: any,
    slippageBps: number = 100 // 1% slippage for buys
  ): Promise<string | null> {
    try {
      console.log(`Getting quote to buy ${tokenMint} with ${solAmount} SOL...`);
      
      // Convert SOL to lamports
      const lamports = Math.floor(solAmount * 1e9);
      
      // Get quote
      const quote = await this.getQuote(
        this.SOL_MINT,
        tokenMint,
        lamports,
        slippageBps
      );

      if (!quote) {
        throw new Error('Failed to get quote from Jupiter');
      }

      console.log('Quote received:', quote);

      // Get swap transaction
      const swapTransaction = await this.getSwapTransaction(quote, userPublicKey);
      
      if (!swapTransaction) {
        throw new Error('Failed to get swap transaction');
      }

      console.log('Executing swap...');
      
      // Execute swap
      const signature = await this.executeSwap(connection, swapTransaction, wallet);
      
      if (!signature) {
        throw new Error('Failed to execute swap');
      }

      console.log('Swap successful! Signature:', signature);
      return signature;
    } catch (error) {
      console.error('Error in buyTokenWithSOL:', error);
      throw error;
    }
  }

  // Helper method to sell a token for SOL
  static async sellTokenForSOL(
    tokenMint: string,
    tokenAmount: number,
    decimals: number,
    userPublicKey: string,
    connection: Connection,
    wallet: any,
    slippageBps: number = 100 // 1% slippage for sells
  ): Promise<string | null> {
    try {
      console.log(`Getting quote to sell ${tokenAmount} tokens for SOL...`);
      
      // Convert token amount to smallest units
      const tokenUnits = Math.floor(tokenAmount * Math.pow(10, decimals));
      
      // Get quote
      const quote = await this.getQuote(
        tokenMint,
        this.SOL_MINT,
        tokenUnits,
        slippageBps
      );

      if (!quote) {
        throw new Error('Failed to get quote from Jupiter');
      }

      console.log('Quote received:', quote);

      // Get swap transaction
      const swapTransaction = await this.getSwapTransaction(quote, userPublicKey);
      
      if (!swapTransaction) {
        throw new Error('Failed to get swap transaction');
      }

      console.log('Executing swap...');
      
      // Execute swap
      const signature = await this.executeSwap(connection, swapTransaction, wallet);
      
      if (!signature) {
        throw new Error('Failed to execute swap');
      }

      console.log('Swap successful! Signature:', signature);
      return signature;
    } catch (error) {
      console.error('Error in sellTokenForSOL:', error);
      throw error;
    }
  }

  // Get price for a token pair
  static async getTokenPrice(
    inputMint: string,
    outputMint: string = this.SOL_MINT,
    amount: number = 1e6 // 1 unit in smallest denomination
  ): Promise<number | null> {
    try {
      const quote = await this.getQuote(inputMint, outputMint, amount, 50);
      
      if (!quote) {
        return null;
      }

      const outputAmount = parseInt(quote.outAmount);
      return outputAmount / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error getting token price:', error);
      return null;
    }
  }
}
