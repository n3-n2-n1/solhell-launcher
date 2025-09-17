'use client';

import { Flame, Zap, Skull } from 'lucide-react';

export default function View() {
  return (
    <div className="min-h-screen relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Flame className="h-12 w-12 text-red-500 animate-pulse mr-4" />
            <h1 className="text-5xl font-bold hell-gradient-text">Vista Infernal</h1>
            <Flame className="h-12 w-12 text-yellow-500 animate-pulse ml-4" />
          </div>
          <p className="text-xl text-orange-200 mb-8">
            Observa el poder del infierno en acción
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="hell-card p-8 group hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500">
                <Zap className="h-12 w-12 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-orange-300">Poder Infernal</h3>
            <p className="text-red-200 leading-relaxed">
              Observa cómo el fuego eterno consume todo a su paso, transformando la realidad en algo más poderoso.
            </p>
          </div>

          <div className="hell-card p-8 group hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500">
                <Skull className="h-12 w-12 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-orange-300">Misterio Eterno</h3>
            <p className="text-red-200 leading-relaxed">
              Los secretos del infierno se revelan ante aquellos que se atreven a mirar más allá de la superficie.
            </p>
          </div>

          <div className="hell-card p-8 group hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 rounded-full bg-gradient-to-r from-yellow-500 to-red-500">
                <Flame className="h-12 w-12 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-orange-300">Fuego Eterno</h3>
            <p className="text-red-200 leading-relaxed">
              Las llamas que nunca se apagan, el poder que transforma todo lo que toca en oro infernal.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="hell-card p-8 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 hell-gradient-text">¿Listo para Ver Más?</h2>
            <p className="text-red-200 mb-6">
              Explora las profundidades del infierno y descubre todo lo que el fuego eterno tiene para ofrecerte.
            </p>
            <div className="flex items-center justify-center text-yellow-400">
              <Flame className="h-6 w-6 mr-2 animate-pulse" />
              <span className="font-semibold">El infierno te espera...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}