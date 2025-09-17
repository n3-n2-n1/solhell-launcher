'use client';

import { useState } from 'react';
import { useTokenLauncher, TokenLaunchConfig } from '@/hooks/useTokenLauncher';
import { X, Rocket, AlertCircle, Info, Flame } from 'lucide-react';

interface CreateTokenFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateTokenForm({ isOpen, onClose, onSuccess }: CreateTokenFormProps) {
  const { createDeflationaryToken, loading } = useTokenLauncher();
  const [formData, setFormData] = useState<TokenLaunchConfig>({
    name: '',
    symbol: '',
    description: '',
    decimals: 6,
    burnRate: 200, // 2%
    tokensForSale: 1000000,
    tokensPerSol: 10000,
    launchDurationDays: 7,
    image: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 32) {
      newErrors.name = 'Maximum 32 characters';
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    } else if (formData.symbol.length > 10) {
      newErrors.symbol = 'Maximum 10 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.burnRate < 10 || formData.burnRate > 1000) {
      newErrors.burnRate = 'Burn rate must be between 0.1% and 10%';
    }

    if (formData.tokensForSale < 1000) {
      newErrors.tokensForSale = 'Minimum 1,000 tokens for sale';
    }

    if (formData.tokensPerSol < 1) {
      newErrors.tokensPerSol = 'Minimum 1 token per SOL';
    }

    if (formData.launchDurationDays < 1 || formData.launchDurationDays > 30) {
      newErrors.launchDurationDays = 'Duration must be between 1 and 30 days';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const result = await createDeflationaryToken(formData);
      console.log('Token created:', result);
      
      alert(`Token ${formData.symbol} created successfully!\nMint: ${result.project.mint}`);
      
      // Reset form
      setFormData({
        name: '',
        symbol: '',
        description: '',
        decimals: 6,
        burnRate: 200,
        tokensForSale: 1000000,
        tokensPerSol: 10000,
        launchDurationDays: 7,
        image: '',
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating token:', error);
      alert('Error creating token: ' + (error as Error).message);
    }
  };

  const handleInputChange = (field: keyof TokenLaunchConfig, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Rocket className="h-6 w-6 text-purple-400" />
            Create Deflationary Token
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Token Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g: DeflaMeme Token"
                className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Symbol *
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                placeholder="e.g: DMEME"
                className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 ${
                  errors.symbol ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {errors.symbol && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.symbol}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add a description"
              rows={3}
              className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Tokenomics */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-400" />
              Deflationary Mechanics
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Burn Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.burnRate / 100}
                    onChange={(e) => handleInputChange('burnRate', parseFloat(e.target.value) * 100)}
                    min="0.1"
                    max="10"
                    step="0.1"
                    className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 ${
                      errors.burnRate ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  <span className="absolute right-3 top-3 text-gray-400">%</span>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Burns in each transaction (0.1% - 10%)
                </p>
                {errors.burnRate && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.burnRate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Decimals
                </label>
                <select
                  value={formData.decimals}
                  onChange={(e) => handleInputChange('decimals', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={6}>6 (recommended)</option>
                  <option value={9}>9</option>
                </select>
              </div>
            </div>
          </div>

          {/* Launch Config */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Launch Configuration</h3>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tokens for Sale
                </label>
                <input
                  type="number"
                  value={formData.tokensForSale}
                  onChange={(e) => handleInputChange('tokensForSale', parseInt(e.target.value))}
                  min="1000"
                  className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 ${
                    errors.tokensForSale ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.tokensForSale && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.tokensForSale}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tokens per SOL
                </label>
                <input
                  type="number"
                  value={formData.tokensPerSol}
                  onChange={(e) => handleInputChange('tokensPerSol', parseInt(e.target.value))}
                  min="1"
                  className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 ${
                    errors.tokensPerSol ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.tokensPerSol && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.tokensPerSol}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Launch Duration (days)
              </label>
              <input
                type="number"
                value={formData.launchDurationDays}
                onChange={(e) => handleInputChange('launchDurationDays', parseInt(e.target.value))}
                min="1"
                max="30"
                className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 ${
                  errors.launchDurationDays ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {errors.launchDurationDays && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.launchDurationDays}
                </p>
              )}
            </div>
          </div>


          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5" />
                  Create coin
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
