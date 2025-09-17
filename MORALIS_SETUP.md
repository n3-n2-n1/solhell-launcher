# Moralis Integration Setup

Este proyecto ahora incluye integración con Moralis para obtener datos reales de tokens pump.fun en Solana.

## 🚀 Configuración Rápida

### 1. Obtener API Key de Moralis

1. Ve a [moralis.io](https://moralis.io)
2. Crea una cuenta gratuita
3. Ve a tu dashboard y crea un nuevo proyecto
4. Copia tu API Key

### 2. Configurar Variables de Entorno

1. Copia el archivo de ejemplo:
   ```bash
   cp env.example .env.local
   ```

2. Edita `.env.local` y agrega tu API key:
   ```env
   NEXT_PUBLIC_MORALIS_API_KEY=tu_api_key_aqui
   ```

### 3. Reiniciar el Servidor

```bash
npm run dev
```

## 📊 APIs de Moralis Utilizadas

### 1. **Token Metadata**
- **Endpoint**: `/token/{address}/metadata`
- **Uso**: Obtener nombre, símbolo, logo, decimales del token
- **Ejemplo**: `moralisService.getTokenMetadata(tokenAddress)`

### 2. **OHLCV Data (Velas)**
- **Endpoint**: `/token/{pairAddress}/ohlcv`
- **Uso**: Obtener datos de velas (Open, High, Low, Close, Volume)
- **Timeframes**: 1h, 4h, 1d
- **Ejemplo**: `moralisService.getOHLCVData(pairAddress, 'solana', '1h')`

### 3. **Token Pairs**
- **Endpoint**: `/token/{address}/pairs`
- **Uso**: Obtener todos los pares de trading del token
- **Incluye**: Liquidez, volumen, market cap
- **Ejemplo**: `moralisService.getTokenPairs(tokenAddress)`

### 4. **Token Swaps**
- **Endpoint**: `/token/{address}/swaps`
- **Uso**: Obtener historial de swaps del token
- **Incluye**: Transacciones, precios, volúmenes
- **Ejemplo**: `moralisService.getTokenSwaps(tokenAddress)`

### 5. **Token Price**
- **Endpoint**: `/token/{address}/price`
- **Uso**: Obtener precio actual en USD y SOL
- **Ejemplo**: `moralisService.getTokenPrice(tokenAddress)`

## 🎯 Características Implementadas

### ✅ **Datos Reales de Pump.fun**
- Tokens lanzados en pump.fun son completamente compatibles
- Datos de liquidez, volumen y precios en tiempo real
- Metadatos completos (logo, nombre, símbolo)

### ✅ **Gráficos de Precios**
- Datos OHLCV reales de Moralis
- Múltiples timeframes (1h, 4h, 1d)
- Precios actualizados en tiempo real

### ✅ **Información de Mercado**
- Market cap calculado
- Liquidez total
- Volumen 24h
- Cambios de precio

### ✅ **Enlaces Externos**
- Solana Explorer
- DexScreener
- Pump.fun directo

## 🔧 Uso en el Código

### Componente MoralisChart

```tsx
import MoralisChart from '@/components/MoralisChart';

// En tu página de trading
<MoralisChart tokenAddress={token.mint} />
```

### Servicio MoralisService

```tsx
import { moralisService } from '@/services/moralisService';

// Obtener metadatos del token
const metadata = await moralisService.getTokenMetadata(tokenAddress);

// Obtener datos OHLCV
const ohlcv = await moralisService.getOHLCVData(pairAddress, 'solana', '1h');

// Obtener pares de trading
const pairs = await moralisService.getTokenPairs(tokenAddress);
```

## 🎨 Personalización

### Colores del Tema Infernal
- **Verde**: Precios que suben, velas alcistas
- **Rojo**: Precios que bajan, velas bajistas
- **Naranja**: Textos secundarios, labels
- **Gris**: Fondos y bordes

### Timeframes Disponibles
- **1h**: Datos por hora
- **4h**: Datos cada 4 horas
- **1d**: Datos diarios

## 🚨 Limitaciones

### Plan Gratuito de Moralis
- **Rate Limits**: 100 requests/minuto
- **Datos Históricos**: Limitados a 30 días
- **Tokens**: Solo tokens con liquidez

### Soluciones
- Implementar cache local
- Usar fallbacks a APIs alternativas
- Optimizar requests

## 🔗 Enlaces Útiles

- [Moralis Dashboard](https://admin.moralis.io/)
- [Documentación Solana API](https://docs.moralis.io/web3-data-api/solana)
- [Widget de Gráficos](https://moralis.com/widgets/price-chart)
- [Pump.fun](https://pump.fun)

## 🐛 Troubleshooting

### Error: "Moralis API error: 401"
- Verifica que tu API key esté correcta
- Asegúrate de que esté en `.env.local`

### Error: "No trading pairs found"
- El token puede no tener liquidez
- Verifica que el token esté en pump.fun

### Error: "Rate limit exceeded"
- Implementa delay entre requests
- Considera upgrade del plan de Moralis

## 📈 Próximos Pasos

1. **Implementar Cache**: Redis o localStorage
2. **WebSocket**: Datos en tiempo real
3. **Más Timeframes**: 5m, 15m, 30m
4. **Indicadores Técnicos**: RSI, MACD, etc.
5. **Alertas de Precio**: Notificaciones push
