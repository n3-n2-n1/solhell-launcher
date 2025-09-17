'use client';

import TVProChart from "@/components/TVProChart";
import Navigation from "@/components/Navigation";

export default function TestTVPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          Test TradingView Charting Library
        </h1>

        <div className="grid gap-8">
          {/* HELL Token Chart */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">HELL Token</h2>
            <TVProChart 
              symbol="HELL:HELLUSD" 
              interval="5" 
              theme="dark" 
              autosize 
            />
          </div>

          {/* DMEME Token Chart */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">DeflaMeme Token</h2>
            <TVProChart 
              symbol="HELL:DMEMEUSD" 
              interval="15" 
              theme="dark" 
              autosize 
            />
          </div>
        </div>

        <div className="mt-8 bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Instrucciones:</h3>
          <div className="text-gray-300 space-y-2">
            <p>• Los gráficos usan datos simulados generados por los endpoints UDF</p>
            <p>• Los símbolos siguen el formato: HELL:TOKENUSD</p>
            <p>• Los datos se actualizan cada 5 segundos (simulando real-time)</p>
            <p>• Para usar la Charting Library completa, descarga los archivos oficiales de TradingView</p>
          </div>
        </div>
      </div>
    </div>
  );
}
