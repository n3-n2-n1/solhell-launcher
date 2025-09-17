# Flujo del Sistema SolHell Defla

## Diagrama de Arquitectura

```mermaid
graph TB
    %% User Interface Layer
    subgraph "🎨 UI Components"
        A[PumpFunLauncher] --> B[TradingPanel]
        B --> C[TradingViewChart]
        C --> D[Navigation]
        D --> E[WalletButton]
    end

    %% Context Layer
    subgraph "🔄 React Contexts"
        F[WalletContextProvider]
        F --> G[Solana Connection]
        F --> H[Wallet Adapters]
    end

    %% Hooks Layer
    subgraph "🎣 Custom Hooks"
        I[useUnifiedLauncher] --> J[useTrading]
        J --> K[useMarketData]
        K --> L[usePumpFunLauncher]
        L --> M[useTokenLauncher]
        M --> N[useStaking]
    end

    %% Services Layer
    subgraph "⚙️ Services"
        O[UnifiedLauncher] --> P[PumpFunLauncher]
        P --> Q[JupiterService]
        Q --> R[TokenRegistryService]
    end

    %% Blockchain Layer
    subgraph "⛓️ Solana Blockchain"
        S[Token Mint Creation]
        T[Smart Contract Deploy]
        U[Liquidity Pool Setup]
        V[Token Trading]
    end

    %% External APIs
    subgraph "🌐 External APIs"
        W[Jupiter API]
        X[Solana RPC]
        Y[TradingView API]
    end

    %% Data Flow
    A --> I
    B --> J
    C --> K
    I --> O
    J --> Q
    K --> R
    O --> S
    O --> T
    O --> U
    Q --> W
    F --> X
    C --> Y

    %% Styling
    classDef uiClass fill:#1e40af,stroke:#3b82f6,color:#fff
    classDef contextClass fill:#059669,stroke:#10b981,color:#fff
    classDef hookClass fill:#7c3aed,stroke:#8b5cf6,color:#fff
    classDef serviceClass fill:#dc2626,stroke:#ef4444,color:#fff
    classDef blockchainClass fill:#ea580c,stroke:#f97316,color:#fff
    classDef apiClass fill:#0891b2,stroke:#06b6d4,color:#fff

    class A,B,C,D,E uiClass
    class F,G,H contextClass
    class I,J,K,L,M,N hookClass
    class O,P,Q,R serviceClass
    class S,T,U,V blockchainClass
    class W,X,Y apiClass
```

## Flujo Detallado del Sistema

### 1. **Capa de Interfaz de Usuario (Components)**
- **PumpFunLauncher**: Modal para lanzar tokens nuevos
- **TradingPanel**: Panel de trading con órdenes de compra/venta
- **TradingViewChart**: Gráficos de precios y volumen
- **Navigation**: Navegación principal de la app
- **WalletButton**: Conectar/desconectar wallet

### 2. **Capa de Contexto (Contexts)**
- **WalletContextProvider**: Provee conexión a Solana y wallets
- **Solana Connection**: Conexión a la red Solana (devnet)
- **Wallet Adapters**: Soporte para Phantom, Solflare, etc.

### 3. **Capa de Hooks (Custom Hooks)**
- **useUnifiedLauncher**: Hook principal para lanzar tokens
- **useTrading**: Maneja operaciones de trading
- **useMarketData**: Obtiene datos del mercado
- **usePumpFunLauncher**: Hook específico para PumpFun
- **useTokenLauncher**: Hook para lanzamiento de tokens
- **useStaking**: Maneja operaciones de staking

### 4. **Capa de Servicios (Services)**
- **UnifiedLauncher**: Servicio principal que combina PumpFun + Smart Contracts
- **PumpFunLauncher**: Servicio específico para lanzamiento estilo PumpFun
- **JupiterService**: Integración con Jupiter para swaps
- **TokenRegistryService**: Registro y gestión de tokens

### 5. **Capa de Blockchain (Solana)**
- **Token Mint Creation**: Creación del token mint
- **Smart Contract Deploy**: Despliegue de contratos inteligentes
- **Liquidity Pool Setup**: Configuración de pools de liquidez
- **Token Trading**: Trading de tokens

### 6. **APIs Externas**
- **Jupiter API**: Para obtener cotizaciones y ejecutar swaps
- **Solana RPC**: Conexión a la red Solana
- **TradingView API**: Para datos de gráficos (opcional)

## Flujo de Lanzamiento de Token

```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as PumpFunLauncher
    participant H as useUnifiedLauncher
    participant S as UnifiedLauncher
    participant B as Solana Blockchain
    participant R as TokenRegistry

    U->>UI: Completa formulario
    UI->>H: launchToken(config)
    H->>S: launchToken(config, wallet, publicKey)
    
    S->>B: 1. Crear Token Mint
    B-->>S: Mint creado
    
    S->>B: 2. Mintear Supply Total
    B-->>S: Supply minteado
    
    S->>B: 3. Configurar Liquidez
    B-->>S: Pool configurado
    
    S->>B: 4. Deploy Smart Contract (si es deflacionario)
    B-->>S: Contrato desplegado
    
    S->>R: 5. Registrar en Marketplace
    R-->>S: Token registrado
    
    S-->>H: Resultado exitoso
    H-->>UI: Token lanzado
    UI-->>U: ¡Token creado exitosamente!
```

## Flujo de Trading

```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as TradingPanel
    participant H as useTrading
    participant J as JupiterService
    participant B as Solana Blockchain

    U->>UI: Ingresa cantidad a comprar/vender
    UI->>H: getQuote(order)
    H->>J: getQuote(inputMint, outputMint, amount)
    J-->>H: Cotización recibida
    H-->>UI: Mostrar detalles de la operación
    
    U->>UI: Confirma la operación
    UI->>H: executeTrade(order)
    H->>J: executeSwap(quote, wallet)
    J->>B: Envía transacción firmada
    B-->>J: Transacción confirmada
    J-->>H: Signature de la transacción
    H-->>UI: Operación exitosa
    UI-->>U: ¡Trade completado!
```

## Características Principales

### 🚀 **Lanzamiento Unificado**
- Combina PumpFun + Smart Contracts
- Lanzamiento GRATIS (sin liquidez inicial)
- Bonding curve automática
- Soporte para tokens deflacionarios

### 💱 **Trading Avanzado**
- Integración con Jupiter
- Órdenes de mercado y límite
- Control de slippage
- Gráficos en tiempo real

### 📊 **Marketplace**
- Registro automático de tokens
- Datos de mercado en tiempo real
- Sistema de trending y top gainers
- Order book y historial de trades

### 🔒 **Seguridad**
- Validación de configuraciones
- Manejo de errores robusto
- Confirmación de transacciones
- Verificación de lanzamientos
