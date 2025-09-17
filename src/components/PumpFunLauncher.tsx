'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useUnifiedLauncher } from '@/hooks/useUnifiedLauncher';
import { UnifiedTokenConfig } from '@/services/unifiedLauncher';
import {
  Rocket,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Users
} from 'lucide-react';

interface UnifiedLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: unknown) => void;
}

export default function PumpFunLauncher({ isOpen, onClose, onSuccess }: UnifiedLauncherProps) {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { loading, error, lastLaunchResult, launchToken, clearError, clearLastResult } = useUnifiedLauncher();

  // Form state - SÚPER SIMPLE
  const [formData, setFormData] = useState<UnifiedTokenConfig>({
    name: '',
    symbol: '',
    description: '',
    image: '',
    website: '',
    telegram: '',
    twitter: '',
    totalSupply: 1000000,
    decimals: 6,
    isDeflationary: true, // Por defecto deflacionario
    burnRate: 200, // 2% por defecto
    initialLiquiditySOL: 0.1, // 0.1 SOL de liquidez inicial
    tokensForLiquidity: 80,
    tokensForCreator: 20,
    hasLaunchPeriod: false,
    enableGovernance: false,
    enableStaking: false,
    initialPrice: 0.001,
    bondingCurve: true,
  });

  const [step, setStep] = useState<'form' | 'preview' | 'launching' | 'success'>('form');

  // No necesitamos verificar balance - es completamente GRATIS

  // Handle form reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      clearError();
      clearLastResult();
      setStep('form');
    }
  }, [isOpen, clearError, clearLastResult]);

  const handleInputChange = (field: keyof UnifiedTokenConfig, value: string | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setStep('launching');
    
    try {
      const result = await launchToken(formData);
      if (result?.success) {
        setStep('success');
        onSuccess?.(result);
      } else {
        setStep('form');
      }
    } catch (error) {
      console.error('Error launching token:', error);
      setStep('form');
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">🚀 Launch Token REAL</h2>
                <p className="text-gray-400 text-sm">
                  Just 3 steps: Name, Symbol, LAUNCH! (Minimal fees)
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white p-2"
              disabled={loading}
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!connected ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Connect your wallet to launch tokens</p>
            </div>
          ) : step === 'form' ? (
            <>
              {/* Form SÚPER SIMPLE */}
              <div className="space-y-6">
                {/* Only the essential fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      🏷️ Token Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="My Awesome Token"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      🔤 Symbol *
                    </label>
                    <input
                      type="text"
                      value={formData.symbol}
                      onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                      placeholder="MAT"
                      maxLength={10}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    📝 Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your token in a few words..."
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                {/* Token Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    🔥 Token Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange('isDeflationary', true)}
                      className={`p-3 rounded-lg border transition-all ${
                        formData.isDeflationary
                          ? 'bg-red-500/20 border-red-500 text-red-300'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-red-500/50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">🔥</div>
                        <div className="font-semibold">Deflationary</div>
                        <div className="text-xs opacity-75">Burns 2% per tx</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('isDeflationary', false)}
                      className={`p-3 rounded-lg border transition-all ${
                        !formData.isDeflationary
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">💰</div>
                        <div className="font-semibold">Standard</div>
                        <div className="text-xs opacity-75">No burn mechanism</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Initial Liquidity */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    💧 Initial Liquidity (SOL)
                  </label>
                  <input
                    type="number"
                    value={formData.initialLiquiditySOL || ''}
                    onChange={(e) => handleInputChange('initialLiquiditySOL', parseFloat(e.target.value) || 0)}
                    placeholder="0.1"
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    Add initial liquidity to create SOL/{formData.symbol || 'TOKEN'} pair immediately
                  </p>
                </div>

                {/* SUPER BIG BUTTON TO LAUNCH */}
                <div className="mt-8">
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.name || !formData.symbol || !formData.description || loading}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Launching...
                      </div>
                    ) : (
                      '🚀 LAUNCH TOKEN NOW!'
                    )}
                  </button>
                  <p className="text-gray-400 text-sm text-center mt-2">
                    {formData.initialLiquiditySOL && formData.initialLiquiditySOL > 0 
                      ? `Total cost: ${(0.002 + (formData.initialLiquiditySOL || 0)).toFixed(3)} SOL (fees + liquidity)`
                      : 'Only 0.002 SOL for fees (~$0.50) - Users create liquidity when buying.'
                    }
                  </p>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-600/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : step === 'launching' ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-purple-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-white mb-2">Launching Token...</h3>
              <p className="text-gray-400">
                Creating token, minting supply and configuring liquidity...
              </p>
            </div>
          ) : step === 'success' && lastLaunchResult ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Token Launched Successfully!</h3>
              <p className="text-gray-400 mb-6">
                Your token <span className="text-purple-400 font-semibold">{formData.symbol}</span> is now available in the marketplace.
              </p>
              
              <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
                <h4 className="text-white font-semibold mb-3">Token Details:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Symbol:</span>
                    <span className="text-white">{formData.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mint Address:</span>
                    <span className="text-purple-300 font-mono text-xs">
                      {lastLaunchResult.tokenMint?.slice(0, 8)}...{lastLaunchResult.tokenMint?.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Supply:</span>
                    <span className="text-white">{formData.totalSupply.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Use mint address for the trade page
                    if (lastLaunchResult.tokenMint) {
                      window.open(`/trade/${lastLaunchResult.tokenMint}`, '_blank');
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View in Marketplace
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}