'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navigation from '@/components/Navigation';
import { Rocket, TrendingUp, Users, Clock, Target, Flame, AlertTriangle, Plus } from 'lucide-react';
import CreateTokenForm from '@/components/CreateTokenForm';
import PumpFunLauncher from '@/components/PumpFunLauncher';

// Mock data
const mockProjects = [
  {
    id: '1',
    name: 'DeflaMeme',
    symbol: 'DMEME',
    description: 'El primer meme token deflacionario con quema automática del 2% en cada transacción',
    totalSupply: 1000000,
    initialPrice: 0.001,
    deflationRate: 2,
    launchDate: new Date('2025-01-20'),
    status: 'live' as const,
    raised: 15000,
    goal: 50000,
    participants: 234,
  },
  {
    id: '2',
    name: 'BurnCoin',
    symbol: 'BURN',
    description: 'Token deflacionario con mecánicas de juego y recompensas por holdear',
    totalSupply: 500000,
    initialPrice: 0.002,
    deflationRate: 1.5,
    launchDate: new Date('2025-01-25'),
    status: 'upcoming' as const,
    raised: 0,
    goal: 75000,
    participants: 0,
  },
];

export default function LauncherPage() {
  const { connected } = useWallet();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPumpFunLauncher, setShowPumpFunLauncher] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [investAmount, setInvestAmount] = useState('');

  const handleInvest = (projectId: string) => {
    if (!connected) return;
    alert(`Invirtiendo ${investAmount} SOL en el proyecto ${projectId}`);
    setInvestAmount('');
    setSelectedProject(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'upcoming': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'ended': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Token Launcher</h1>
              <p className="text-gray-400">
                Lanza y descubre tokens deflacionarios innovadores en Solana
              </p>
            </div>
            {connected && (
              <button
                onClick={() => setShowPumpFunLauncher(true)}
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Rocket className="h-5 w-5" />
                Lanzar Token
              </button>
            )}
          </div>
        </div>

        {!connected ? (
          <div className="text-center py-20">
            <Rocket className="h-16 w-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Conecta tu Wallet</h2>
            <p className="text-gray-400">Necesitas conectar tu wallet para participar en el launcher</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3">
                  <Rocket className="h-8 w-8 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">12</p>
                    <p className="text-gray-400 text-sm">Proyectos activos</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">$2.4M</p>
                    <p className="text-gray-400 text-sm">Total recaudado</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-purple-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">1.2K</p>
                    <p className="text-gray-400 text-sm">Inversores únicos</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3">
                  <Flame className="h-8 w-8 text-red-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">45M</p>
                    <p className="text-gray-400 text-sm">Tokens quemados</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockProjects.map((project) => {
                const progressPercentage = (project.raised / project.goal) * 100;
                const daysUntilLaunch = Math.ceil((project.launchDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={project.id} className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{project.name}</h3>
                        <p className="text-purple-400 font-medium">${project.symbol}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {project.status === 'live' ? 'En vivo' : project.status === 'upcoming' ? 'Próximo' : 'Finalizado'}
                      </span>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-400">Supply Total</p>
                        <p className="text-white font-semibold">{project.totalSupply.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Precio Inicial</p>
                        <p className="text-white font-semibold">${project.initialPrice}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Deflación</p>
                        <p className="text-red-400 font-semibold flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {project.deflationRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Participantes</p>
                        <p className="text-white font-semibold">{project.participants}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progreso</span>
                        <span className="text-white">${project.raised.toLocaleString()} / ${project.goal.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{progressPercentage.toFixed(1)}% completado</p>
                    </div>

                    {/* Launch Date */}
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-400">
                        {project.status === 'upcoming' 
                          ? `Lanza en ${daysUntilLaunch} días` 
                          : `Lanzado ${project.launchDate.toLocaleDateString()}`
                        }
                      </span>
                    </div>

                    {/* Action Button */}
                    {project.status === 'live' && (
                      <div className="space-y-3">
                        {selectedProject === project.id ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              value={investAmount}
                              onChange={(e) => setInvestAmount(e.target.value)}
                              placeholder="Cantidad en SOL"
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleInvest(project.id)}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                              >
                                Invertir
                              </button>
                              <button
                                onClick={() => setSelectedProject(null)}
                                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedProject(project.id)}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <Target className="h-4 w-4" />
                            Participar
                          </button>
                        )}
                      </div>
                    )}

                    {project.status === 'upcoming' && (
                      <button
                        disabled
                        className="w-full bg-gray-600 text-gray-400 py-3 px-4 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        Próximamente
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Warning */}
            <div className="mt-8 bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-300">
                  <p className="font-medium mb-1">Aviso de Riesgo:</p>
                  <p className="text-yellow-200">
                    Los tokens deflacionarios son experimentales y de alto riesgo. Solo invierte lo que puedas permitirte perder. 
                    Los tokens pueden perder valor rápidamente debido a las mecánicas deflacionarias.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Unified Token Launcher */}
      <PumpFunLauncher
        isOpen={showPumpFunLauncher}
        onClose={() => setShowPumpFunLauncher(false)}
        onSuccess={(result) => {
          console.log('Token lanzado:', result);
          setShowPumpFunLauncher(false);
          // Redirect to token page if trading is available
          if (result.tokenMint && result.tradingAvailable) {
            window.location.href = `/trade/${result.tokenMint}`;
          } else if (result.tokenMint) {
            // Show success message if launch period is active
            alert(`¡Token ${result.tokenMint.slice(0, 8)}... lanzado! Trading disponible después del período de lanzamiento.`);
          }
        }}
      />
    </div>
  );
}
