'use client';

import { motion } from 'framer-motion';
import { Flame, Zap, Skull } from 'lucide-react';

export default function FloatingFooter() {
  return (
    <motion.div
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.8 }}
    >
      <div className="hell-glass px-6 py-3 rounded-full border border-red-500/30 backdrop-blur-xl">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <Flame className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="text-orange-200 font-semibold">SolHell</span>
          </div>
          
          <div className="w-px h-4 bg-red-500/30" />
          
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-orange-200">Active</span>
          </div>
          
          <div className="w-px h-4 bg-red-500/30" />
          
          <div className="flex items-center space-x-2">
            <Skull className="h-4 w-4 text-red-500" />
            <span className="text-orange-200">Inferno Mode</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
