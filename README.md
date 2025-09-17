# SolHell HELL - Token Deflacionario Launcher

Una plataforma completa para lanzar tokens deflacionarios y hacer staking de $HELL en Solana.

## 🚀 Características

- **Staking $HELL**: Gana 0.75% diario con interés compuesto
- **Token Launcher**: Lanza tokens deflacionarios con mecánicas innovadoras
- **Airdrops**: Recompensas exclusivas para usuarios con staking activo
- **Wallet Integration**: Soporte para Phantom, Solflare y Backpack
- **Dashboard**: Estadísticas completas de tu portfolio

## 📋 Requisitos

- Node.js 18+ (recomendado 20+)
- Rust y Solana CLI (para desarrollo de smart contracts)
- Una wallet de Solana (Phantom, Solflare, etc.)

## 🛠️ Instalación y Setup

### Requisitos Previos
- Node.js 18+ (recomendado 20+)
- Rust y Cargo
- Solana CLI
- Anchor Framework

### Setup Rápido
```bash
# 1. Clonar el repositorio
git clone <tu-repo>
cd solhell-defla

# 2. Setup automático (instala dependencias y configura devnet)
make quick-setup

# 3. Iniciar servidor de desarrollo
make dev
```

### Setup Manual

1. **Instalar dependencias**
   ```bash
   npm install
   cd scripts && npm install && cd ..
   ```

2. **Configurar Solana CLI para devnet**
   ```bash
   solana config set --url devnet
   solana airdrop 2
   ```

3. **Construir programas de Solana**
   ```bash
   cd solana-program
   anchor build
   cd ..
   ```

4. **Desplegar en devnet**
   ```bash
   ./scripts/deploy.sh devnet
   ```

5. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

## 🏗️ Arquitectura

### Frontend (Next.js)
- **Framework**: Next.js 14 con App Router
- **Styling**: Tailwind CSS
- **Wallet Integration**: Solana Wallet Adapter
- **Icons**: Lucide React

### Smart Contracts (Solana)
- **Lenguaje**: Rust con Anchor Framework
- **Red**: Devnet (desarrollo) / Mainnet (producción)
- **Funcionalidades**:
  - Staking de tokens $HELL
  - Cálculo automático de recompensas
  - Sistema de airdrops
  - Lanzamiento de tokens deflacionarios

## 💰 Lógica de Staking

### Parámetros
- **Token**: Solo $HELL
- **Monto mínimo**: 10,000 $HELL
- **Período de bloqueo**: 7-120 días (seleccionable)
- **APR**: 0.75% diario (interés compuesto)

### Fórmula de Recompensas
```
recompensa_diaria = saldo_stakeado * 0.0075
recompensa_total = recompensa_diaria * días_período
```

### Condiciones
- ✅ Retiro después del período mínimo: conserva recompensas + acceso a airdrops
- ❌ Retiro antes del período mínimo: conserva recompensas pero pierde airdrops

## 🎁 Sistema de Airdrops

### Requisitos para Airdrops
1. Tener staking activo de $HELL
2. Mantener el staking durante el período mínimo
3. No retirar fondos antes de tiempo

### Tipos de Airdrops
- **Tokens de nuevos proyectos** lanzados en la plataforma
- **Bonos en $HELL** por participación activa
- **Acceso anticipado** a funcionalidades premium

## 🚀 Token Launcher

### Características de Tokens Deflacionarios
- **Quema automática**: Porcentaje fijo en cada transacción (0.1% - 10%)
- **Supply decreciente**: El supply total disminuye con el tiempo
- **Mecánicas gamificadas**: Recompensas por holdear
- **Metadata completa**: Nombre, símbolo, descripción e imagen

### Lanzar un Token Deflacionario

#### Método 1: Interfaz Web
1. Conecta tu wallet a la aplicación
2. Ve a la sección "Launcher"
3. Haz clic en "Lanzar Token"
4. Completa el formulario con la información del token
5. Confirma la transacción

#### Método 2: Scripts (Avanzado)
```bash
# 1. Crear configuración del token
cp scripts/example-token-config.json mi-token-config.json
# Edita mi-token-config.json con tu información

# 2. Lanzar el token
make launch-custom-token CONFIG=mi-token-config.json
```

#### Ejemplo de Configuración
```json
{
  "name": "Mi Token Deflacionario",
  "symbol": "MTD",
  "description": "Descripción de mi token",
  "burnRate": 200,  // 2% de quema
  "tokensForSale": 1000000,
  "tokensPerSol": 10000,
  "launchDurationDays": 7
}
```

## 📱 Páginas de la Aplicación

### Dashboard (`/`)
- Estadísticas generales del usuario
- Actividad reciente
- Acciones rápidas

### Staking (`/staking`)
- Interfaz para hacer staking de $HELL
- Gestión de posiciones activas
- Calculadora de recompensas

### Launcher (`/launcher`)
- Explorar proyectos de tokens deflacionarios
- Participar en lanzamientos
- Crear nuevos proyectos

### Airdrops (`/airdrops`)
- Ver airdrops disponibles
- Reclamar recompensas
- Historial de airdrops

## 🔧 Desarrollo

### Estructura del Proyecto
```
src/
├── app/                 # Páginas de Next.js
├── components/          # Componentes React
├── contexts/           # Contextos (Wallet, etc.)
├── hooks/              # Custom hooks
├── types/              # Definiciones TypeScript
└── utils/              # Utilidades
```

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run lint         # Linter ESLint
```

### Variables de Entorno
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_DEFLA_MINT_ADDRESS=<mint_address>
NEXT_PUBLIC_STAKING_PROGRAM_ID=<program_id>
```

## 🔐 Seguridad

- Todas las transacciones requieren confirmación del usuario
- Los smart contracts están auditados (en producción)
- Las claves privadas nunca salen de la wallet del usuario
- Validaciones tanto en frontend como en blockchain

## 🚦 Estado del Proyecto

### ✅ Completado
- [x] Configuración inicial de Next.js
- [x] Integración con wallets de Solana
- [x] UI completa para staking
- [x] Sistema de airdrops
- [x] Token launcher interface
- [x] Dashboard con estadísticas

### 🔄 En Desarrollo
- [ ] Smart contracts de Solana
- [ ] Sistema de recompensas automáticas
- [ ] Integración con blockchain real

### 📋 Por Hacer
- [ ] Testing exhaustivo
- [ ] Auditoría de seguridad
- [ ] Deploy a mainnet
- [ ] Documentación técnica completa

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## ⚠️ Disclaimer

Este es un proyecto experimental. Los tokens deflacionarios son de alto riesgo y pueden perder valor rápidamente. Solo invierte lo que puedas permitirte perder. Este proyecto es solo para fines educativos y de demostración.

## 📞 Contacto

- **Proyecto**: SolHell HELL
- **Red**: Solana
- **Tipo**: DeFi / Token Launcher

---

**¡Construyendo el futuro de los tokens deflacionarios en Solana! 🚀**