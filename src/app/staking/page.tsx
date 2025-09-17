'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navigation from '@/components/Navigation';
import { Coins, Clock, TrendingUp, AlertCircle, Calculator, Lock } from 'lucide-react';

// Mock data
const mockStakePositions = [
  {
    id: '1',
    amount: 25000,
    startDate: new Date('2025-01-10'),
    lockPeriodDays: 30,
    dailyRewards: 187.5,
    totalRewards: 1125,
    isActive: true,
    canWithdraw: false,
  },
  {
    id: '2',
    amount: 15000,
    startDate: new Date('2025-01-05'),
    lockPeriodDays: 60,
    dailyRewards: 112.5,
    totalRewards: 1237.5,
    isActive: true,
    canWithdraw: false,
  },
];

const DEFLA_BALANCE = 50000; // Mock balance
const MIN_STAKE_AMOUNT = 10000;
const MAX_LOCK_PERIOD = 120;
const MIN_LOCK_PERIOD = 7;
const DAILY_APR = 0.0075; // 0.75%

export default function StakingPage() {
  const { connected } = useWallet();
  const [stakeAmount, setStakeAmount] = useState('');
  const [lockPeriod, setLockPeriod] = useState(30);
  const [isStaking, setIsStaking] = useState(false);

  const calculateRewards = (amount: number, days: number) => {
    const dailyReward = amount * DAILY_APR;
    const totalRewards = dailyReward * days;
    return { dailyReward, totalRewards };
  };

  const handleStake = async () => {
    if (!connected) return;
    
    const amount = parseFloat(stakeAmount);
    if (amount < MIN_STAKE_AMOUNT) {
      alert(`El monto mínimo es ${MIN_STAKE_AMOUNT} $HELL`);
      return;
    }
    
    if (amount > DEFLA_BALANCE) {
      alert('Saldo insuficiente');
      return;
    }

    setIsStaking(true);
    
    // Simular transacción
    setTimeout(() => {
      alert('¡Staking realizado exitosamente!');
      setIsStaking(false);
      setStakeAmount('');
    }, 2000);
  };

  const handleWithdraw = async (_positionId: string) => {
    // Simular retiro
    alert('Retiro procesado');
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <Lock className="h-16 w-16 text-purple-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Conecta tu Wallet</h1>
            <p className="text-gray-400">Necesitas conectar tu wallet para acceder al staking</p>
          </div>
        </div>
      </div>
    );
  }

  const projectedRewards = stakeAmount ? calculateRewards(parseFloat(stakeAmount) || 0, lockPeriod) : { dailyReward: 0, totalRewards: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Staking $HELL</h1>
          <p className="text-gray-400">
            Gana 0.75% diario con interés compuesto y accede a airdrops exclusivos
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Staking Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 mb-8">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Coins className="h-5 w-5 text-purple-400" />
                Nuevo Staking
              </h2>
              
              <div className="space-y-6">
                {/* Balance */}
                <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-300">Balance disponible:</span>
                    <span className="text-white font-semibold">{DEFLA_BALANCE.toLocaleString()} $HELL</span>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cantidad a stakear
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder={`Mínimo ${MIN_STAKE_AMOUNT} $HELL`}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={() => setStakeAmount(DEFLA_BALANCE.toString())}
                      className="absolute right-3 top-3 text-purple-400 text-sm hover:text-purple-300"
                    >
                      MAX
                    </button>
                  </div>
                  {stakeAmount && parseFloat(stakeAmount) < MIN_STAKE_AMOUNT && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Monto mínimo requerido: {MIN_STAKE_AMOUNT} $HELL
                    </p>
                  )}
                </div>

                {/* Lock Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Período de bloqueo: {lockPeriod} días
                  </label>
                  <input
                    type="range"
                    min={MIN_LOCK_PERIOD}
                    max={MAX_LOCK_PERIOD}
                    value={lockPeriod}
                    onChange={(e) => setLockPeriod(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>{MIN_LOCK_PERIOD} días</span>
                    <span>{MAX_LOCK_PERIOD} días</span>
                  </div>
                </div>

                {/* Projected Rewards */}
                {stakeAmount && parseFloat(stakeAmount) >= MIN_STAKE_AMOUNT && (
                  <div className="bg-green-600/10 border border-green-500/20 rounded-lg p-4">
                    <h3 className="text-green-300 font-medium mb-3 flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Recompensas proyectadas
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Recompensa diaria</p>
                        <p className="text-white font-semibold">
                          {projectedRewards.dailyReward.toFixed(2)} $HELL
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total estimado ({lockPeriod} días)</p>
                        <p className="text-green-400 font-semibold">
                          {projectedRewards.totalRewards.toFixed(2)} $HELL
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stake Button */}
                <button
                  onClick={handleStake}
                  disabled={!stakeAmount || parseFloat(stakeAmount) < MIN_STAKE_AMOUNT || isStaking}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium"
                >
                  {isStaking ? 'Procesando...' : 'Iniciar Staking'}
                </button>

                {/* Warning */}
                <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-300">
                      <p className="font-medium mb-1">Importante:</p>
                      <ul className="space-y-1 text-yellow-200">
                        <li>• Los fondos estarán bloqueados durante el período seleccionado</li>
                        <li>• Si retiras antes de tiempo, perderás acceso a airdrops</li>
                        <li>• Las recompensas se calculan diariamente</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Estadísticas</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">APR Diario:</span>
                  <span className="text-green-400 font-semibold">0.75%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">APR Anual:</span>
                  <span className="text-green-400 font-semibold">~273%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Staked:</span>
                  <span className="text-white font-semibold">1.2M $HELL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Usuarios activos:</span>
                  <span className="text-white font-semibold">847</span>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Beneficios del Staking</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium">Recompensas diarias</p>
                    <p className="text-gray-400 text-xs">Interés compuesto automático</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Coins className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium">Airdrops exclusivos</p>
                    <p className="text-gray-400 text-xs">Tokens de nuevos proyectos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium">Acceso anticipado</p>
                    <p className="text-gray-400 text-xs">A nuevas funcionalidades</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Stakes */}
        {mockStakePositions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Tus Posiciones Activas</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {mockStakePositions.map((position) => {
                const daysRemaining = Math.max(0, position.lockPeriodDays - Math.floor((Date.now() - position.startDate.getTime()) / (1000 * 60 * 60 * 24)));
                const progress = ((position.lockPeriodDays - daysRemaining) / position.lockPeriodDays) * 100;
                
                return (
                  <div key={position.id} className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-2xl font-bold text-white">{position.amount.toLocaleString()} $HELL</p>
                        <p className="text-gray-400 text-sm">Stakeado desde {position.startDate.toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-semibold">+{position.totalRewards.toFixed(2)} $HELL</p>
                        <p className="text-gray-400 text-sm">Total ganado</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progreso del período</span>
                        <span className="text-white">{daysRemaining} días restantes</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{position.dailyRewards} $HELL/día</p>
                        <p className="text-gray-400 text-sm">Recompensa diaria</p>
                      </div>
                      <button
                        onClick={() => handleWithdraw(position.id)}
                        disabled={!position.canWithdraw}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        {position.canWithdraw ? 'Retirar' : 'Bloqueado'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
