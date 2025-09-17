export interface StakeAccount {
  publicKey: string;
  amount: number;
  startDate: Date;
  endDate: Date;
  lockPeriodDays: number;
  dailyRewards: number;
  totalRewards: number;
  isActive: boolean;
  canWithdraw: boolean;
}

export interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  isDeflationary: boolean;
  burnRate: number;
}

export interface AirdropInfo {
  id: string;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  amount: number;
  claimDeadline: Date;
  isClaimed: boolean;
  requiresActiveStaking: boolean;
}

export interface LaunchpadProject {
  id: string;
  name: string;
  symbol: string;
  description: string;
  totalSupply: number;
  initialPrice: number;
  deflationRate: number;
  launchDate: Date;
  status: 'upcoming' | 'live' | 'ended';
  raised: number;
  goal: number;
  participants: number;
}

export interface UserStats {
  totalStaked: number;
  totalRewards: number;
  activeDays: number;
  airdropsClaimed: number;
  tokensLaunched: number;
  deflaBalance: number;
}
