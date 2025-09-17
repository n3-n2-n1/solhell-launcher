'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import Navigation from '@/components/Navigation';
import { useState } from 'react';
import Stats from '@/components/Stats';
import CommunityGrid from '@/components/CommunityGrid';
import SearchNavbar from '@/components/Search';

export default function Home() {
  const { connected } = useWallet();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('marketCap');
  const [filterBy, setFilterBy] = useState('all');



  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 relative z-10">

        {/* Platform Stats */}

        {/* Search */}
        <SearchNavbar  searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterBy={filterBy} setFilterBy={setFilterBy} sortBy={sortBy} setSortBy={setSortBy} />

        {/* Community Tokens Grid */}
        <CommunityGrid searchTerm={searchTerm} filterBy={filterBy} sortBy={sortBy} />


        {/* Call to Action */}
        {!connected && (
          <div className="mt-16 text-center">
            <div className="hell-card p-8 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4 hell-gradient-text">Ready to Join Hell?</h2>
              <p className="text-red-200 mb-6">
                Connect your wallet to start trading, creating, and burning tokens in the inferno
              </p>
              <div className="flex items-center justify-center text-yellow-400">
                <span className="font-semibold">The fire awaits...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}