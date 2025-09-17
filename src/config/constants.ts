import { PublicKey } from '@solana/web3.js';

// Network Configuration
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
export const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// Program IDs
export const DEFLA_STAKING_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_DEFLA_STAKING_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'
);

export const DEFLATIONARY_TOKEN_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_DEFLATIONARY_TOKEN_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'
);

// Token Addresses
export const HELL_MINT_ADDRESS = new PublicKey(
  process.env.NEXT_PUBLIC_HELL_MINT_ADDRESS || '7BwsNQH3QTBvqqb9GbFwmb8mVmfT5X6SkM7HaddbAkdT'
);

// Legacy alias for compatibility
export const DEFLA_MINT_ADDRESS = HELL_MINT_ADDRESS;

// Staking Configuration
export const STAKING_CONFIG = {
  MIN_STAKE_AMOUNT: 10_000, // 10,000 HELL
  MIN_LOCK_PERIOD_DAYS: 7,
  MAX_LOCK_PERIOD_DAYS: 120,
  DAILY_APR: 0.0075, // 0.75%
  DEFLA_DECIMALS: 6,
};

// UI Configuration
export const UI_CONFIG = {
  REFRESH_INTERVAL: 30000, // 30 seconds
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 5000,
};

// Feature Flags
export const FEATURES = {
  ENABLE_STAKING: true,
  ENABLE_LAUNCHER: true,
  ENABLE_AIRDROPS: true,
  ENABLE_NOTIFICATIONS: false,
  ENABLE_ANALYTICS: false,
};

// Mock Data (for development)
export const MOCK_DATA = {
  USE_MOCK_BALANCES: process.env.NODE_ENV === 'development',
  MOCK_DEFLA_BALANCE: 50_000,
  MOCK_SOL_BALANCE: 10,
};
