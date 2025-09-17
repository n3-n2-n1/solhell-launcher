'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navigation from '@/components/Navigation';
import { Gift, Clock, CheckCircle, XCircle, AlertCircle, Coins, Calendar, Users } from 'lucide-react';

// Mock data
const mockAirdrops = [
  {
    id: '1',
    tokenName: 'DeflaMeme Bonus',
    tokenSymbol: 'DMEME',
    amount: 500,
    claimDeadline: new Date('2025-02-15'),
    isClaimed: false,
    requiresActiveStaking: true,
    description: 'Airdrop especial para holders de $HELL con staking activo',
    totalRecipients: 847,
    status: 'active' as const,
  },
  {
    id: '2',
    tokenName: 'Early Adopter Reward',
    tokenSymbol: 'HELL',
    amount: 1000,
    claimDeadline: new Date('2025-01-30'),
    isClaimed: true,
    requiresActiveStaking: false,
    description: 'Recompensa para los primeros usuarios de la plataforma',
    totalRecipients: 234,
    status: 'claimed' as const,
  },
  {
    id: '3',
    tokenName: 'BurnCoin Launch',
    tokenSymbol: 'BURN',
    amount: 250,
    claimDeadline: new Date('2025-01-10'),
    isClaimed: false,
    requiresActiveStaking: true,
    description: 'Airdrop del lanzamiento de BurnCoin para stakers activos',
    totalRecipients: 456,
    status: 'expired' as const,
  },
  {
    id: '4',
    tokenName: 'Community Milestone',
    tokenSymbol: 'HELL',
    amount: 750,
    claimDeadline: new Date('2025-03-01'),
    isClaimed: false,
    requiresActiveStaking: true,
    description: 'Celebrando 1000 usuarios activos en staking',
    totalRecipients: 1000,
    status: 'upcoming' as const,
  },
];

const mockUserStats = {
  totalClaimed: 3,
  totalValue: 2500,
  activeDaysRequired: 7,
  currentActiveDays: 45,
  hasActiveStaking: true,
};

export default function AirdropsPage() {
  const { connected } = useWallet();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (airdropId: string) => {
    if (!connected) return;
    
    setClaimingId(airdropId);
    
    // Simular claim
    setTimeout(() => {
      alert('¡Airdrop reclamado exitosamente!');
      setClaimingId(null);
    }, 2000);
  };

  const getStatusInfo = (airdrop: typeof mockAirdrops[0]) => {
    const now = new Date();
    const isExpired = airdrop.claimDeadline < now;
    
    if (airdrop.isClaimed) {
      return {
        status: 'claimed',
        label: 'Reclamado',
        color: 'text-green-400 bg-green-400/10 border-green-400/20',
        icon: CheckCircle,
      };
    }
    
    if (isExpired) {
      return {
        status: 'expired',
        label: 'Expirado',
        color: 'text-red-400 bg-red-400/10 border-red-400/20',
        icon: XCircle,
      };
    }
    
    if (airdrop.status === 'upcoming') {
      return {
        status: 'upcoming',
        label: 'Próximo',
        color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        icon: Clock,
      };
    }
    
    return {
      status: 'active',
      label: 'Disponible',
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      icon: Gift,
    };
  };

  const canClaim = (airdrop: typeof mockAirdrops[0]) => {
    const statusInfo = getStatusInfo(airdrop);
    return statusInfo.status === 'active' && 
           (!airdrop.requiresActiveStaking || mockUserStats.hasActiveStaking) &&
           mockUserStats.currentActiveDays >= mockUserStats.activeDaysRequired;
  };

  const getDaysUntilDeadline = (deadline: Date) => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <Gift className="h-16 w-16 text-purple-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Conecta tu Wallet</h1>
            <p className="text-gray-400">Necesitas conectar tu wallet para ver tus airdrops</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Airdrops</h1>
          <p className="text-gray-400">
            Reclama tokens gratis por participar activamente en la plataforma
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{mockUserStats.totalClaimed}</p>
                <p className="text-purple-300 text-sm">Airdrops reclamados</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-600/20 to-green-800/20 backdrop-blur-sm p-6 rounded-xl border border-green-500/20">
            <div className="flex items-center gap-3">
              <Coins className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{mockUserStats.totalValue.toLocaleString()}</p>
                <p className="text-green-300 text-sm">Valor total reclamado</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{mockUserStats.currentActiveDays}</p>
                <p className="text-blue-300 text-sm">Días activo</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-pink-600/20 to-pink-800/20 backdrop-blur-sm p-6 rounded-xl border border-pink-500/20">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-pink-400" />
              <div>
                <p className="text-2xl font-bold text-white">{mockUserStats.hasActiveStaking ? 'Activo' : 'Inactivo'}</p>
                <p className="text-pink-300 text-sm">Estado de staking</p>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements Info */}
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4 mb-8">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">Requisitos para Airdrops:</p>
              <ul className="space-y-1 text-blue-200">
                <li>• Tener staking activo de $HELL (para airdrops especiales)</li>
                <li>• Mantener el staking durante el período mínimo requerido</li>
                <li>• Participar activamente en la plataforma</li>
                <li>• No retirar fondos antes del período mínimo</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Airdrops List */}
        <div className="space-y-6">
          {mockAirdrops.map((airdrop) => {
            const statusInfo = getStatusInfo(airdrop);
            const StatusIcon = statusInfo.icon;
            const daysLeft = getDaysUntilDeadline(airdrop.claimDeadline);
            const canClaimAirdrop = canClaim(airdrop);
            
            return (
              <div 
                key={airdrop.id} 
                className={`bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border transition-all duration-200 ${
                  canClaimAirdrop ? 'border-purple-500/50 hover:border-purple-500' : 'border-gray-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{airdrop.tokenName}</h3>
                        <p className="text-purple-400 font-medium">${airdrop.tokenSymbol}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 mb-4">{airdrop.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Cantidad</p>
                        <p className="text-white font-semibold">{airdrop.amount.toLocaleString()} ${airdrop.tokenSymbol}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Fecha límite</p>
                        <p className="text-white font-semibold">{airdrop.claimDeadline.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Tiempo restante</p>
                        <p className={`font-semibold ${daysLeft > 7 ? 'text-green-400' : daysLeft > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {daysLeft > 0 ? `${daysLeft} días` : 'Expirado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Recipientes</p>
                        <p className="text-white font-semibold">{airdrop.totalRecipients.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {airdrop.requiresActiveStaking && (
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <Coins className="h-4 w-4 text-purple-400" />
                        <span className="text-purple-300">Requiere staking activo</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="lg:w-48">
                    {canClaimAirdrop ? (
                      <button
                        onClick={() => handleClaim(airdrop.id)}
                        disabled={claimingId === airdrop.id}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                      >
                        {claimingId === airdrop.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Reclamando...
                          </>
                        ) : (
                          <>
                            <Gift className="h-4 w-4" />
                            Reclamar
                          </>
                        )}
                      </button>
                    ) : statusInfo.status === 'claimed' ? (
                      <div className="w-full bg-green-600/20 border border-green-500/20 text-green-400 py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Reclamado
                      </div>
                    ) : statusInfo.status === 'expired' ? (
                      <div className="w-full bg-red-600/20 border border-red-500/20 text-red-400 py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Expirado
                      </div>
                    ) : statusInfo.status === 'upcoming' ? (
                      <div className="w-full bg-blue-600/20 border border-blue-500/20 text-blue-400 py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4" />
                        Próximamente
                      </div>
                    ) : !mockUserStats.hasActiveStaking ? (
                      <div className="w-full bg-gray-600/20 border border-gray-500/20 text-gray-400 py-3 px-4 rounded-lg text-center">
                        <p className="text-sm">Requiere staking activo</p>
                      </div>
                    ) : (
                      <div className="w-full bg-gray-600/20 border border-gray-500/20 text-gray-400 py-3 px-4 rounded-lg text-center">
                        <p className="text-sm">No elegible</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Airdrops Available */}
        {mockAirdrops.length === 0 && (
          <div className="text-center py-20">
            <Gift className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">No hay airdrops disponibles</h2>
            <p className="text-gray-400">Mantén tu staking activo para recibir airdrops futuros</p>
          </div>
        )}
      </div>
    </div>
  );
}
