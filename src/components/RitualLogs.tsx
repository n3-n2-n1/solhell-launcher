'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface RitualLogsProps {
  isLoading: boolean;
}

export default function RitualLogs({ isLoading }: RitualLogsProps) {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading) return;

    const ritualMessages = [
      "Initializing hellfire protocols...",
      "Establishing connection to Solana underworld...",
      "Loading sacrificial algorithms...",
      "Preparing token incineration matrix...",
      "Calibrating deflationary mechanisms...",
      "Activating staking inferno...",
      "Connecting to wallet dimensions...",
      "Preparing for eternal rewards...",
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < ritualMessages.length) {
        setLogs(prev => [...prev, ritualMessages[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="max-w-2xl w-full mx-4">
            <motion.div
              className="bg-black/90 border border-red-500/30 rounded-lg p-6 font-mono"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center mb-4 pb-3 border-b border-red-500/20">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                </div>
                <p className="text-red-400 text-sm ml-auto">
                  /root/ritual/init
                </p>
              </div>

              {/* Logs */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="text-green-400 text-sm">$</span>
                    <span className="text-orange-300 text-sm">{log}</span>
                    <motion.span
                      className="text-red-400"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      █
                    </motion.span>
                  </motion.div>
                ))}
              </div>

              {/* Progress indicator */}
              <div className="mt-4 pt-3 border-t border-red-500/20">
                <div className="flex items-center justify-between text-sm text-orange-300">
                  <span>Initializing SolHell...</span>
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {logs.length > 0 ? `${Math.min((logs.length / 8) * 100, 100).toFixed(0)}%` : '0%'}
                  </motion.span>
                </div>
                <div className="mt-2 w-full bg-red-900/30 rounded-full h-1">
                  <motion.div
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-1 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((logs.length / 8) * 100, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
