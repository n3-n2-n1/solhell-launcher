'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Coins, Rocket, Gift, BarChart3, TrendingUp, Skull, Plus } from 'lucide-react';
import WalletButton from './WalletButton';
import PumpFunLauncher from './PumpFunLauncher';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Market', href: '/market', icon: TrendingUp },
  { name: 'Staking', href: '/staking', icon: Coins },
  { name: 'Launcher', href: '/launcher', icon: Rocket },
  { name: 'Airdrops', href: '/airdrops', icon: Gift },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black/20 backdrop-blur-md border-b border-red-500/20 relative z-50" style={{ zIndex: 50 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Skull className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold hell-gradient-text">
                SolHell
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-red-500/30 text-white'
                      : 'text-orange-200 hover:text-white hover:bg-red-500/20'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side - Launch Button + Wallet */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Launch Token Button */}
            <button 
              onClick={() => setIsLaunchModalOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              <span>Launch</span>
            </button>
            
            {/* Wallet Button */}
            <WalletButton />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-orange-200 hover:text-white hover:bg-red-500/20 transition-all duration-300"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/30 backdrop-blur-md border-t border-red-500/20">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-red-500/30 text-white'
                      : 'text-orange-200 hover:text-white hover:bg-red-500/20'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {/* Mobile Launch Button */}
            <div className="px-4 py-3">
              <button 
                onClick={() => {
                  setIsLaunchModalOpen(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300"
              >
                <Plus className="h-4 w-4" />
                <span>Launch Token</span>
              </button>
            </div>
            
            {/* Mobile Wallet Button */}
            <div className="px-4 py-2">
              <WalletButton />
            </div>
          </div>
        </div>
      )}

      {/* Launch Modal */}
      <PumpFunLauncher 
        isOpen={isLaunchModalOpen} 
        onClose={() => setIsLaunchModalOpen(false)}
        onSuccess={(result) => {
          console.log('Token launched successfully:', result);
          setIsLaunchModalOpen(false);
        }}
      />
    </nav>
  );
}
