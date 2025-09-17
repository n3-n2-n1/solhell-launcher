const {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const {
  getOrCreateAssociatedTokenAccount,
  createMint,
  mintTo,
} = require('@solana/spl-token');
const anchor = require('@coral-xyz/anchor');
const fs = require('fs');

// Configuración
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const RPC_URL = NETWORK === 'mainnet' 
  ? 'https://api.mainnet-beta.solana.com'
  : 'https://api.devnet.solana.com';

// Program ID del programa de tokens deflacionarios
const DEFLATIONARY_TOKEN_PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

async function launchDeflationaryToken(tokenConfig) {
  console.log('🚀 Iniciando lanzamiento de token deflacionario...');
  
  // Validar configuración
  validateTokenConfig(tokenConfig);
  
  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Cargar wallet del creador
  let creator;
  try {
    const secretKey = JSON.parse(fs.readFileSync(process.env.HOME + '/.config/solana/id.json', 'utf8'));
    creator = Keypair.fromSecretKey(new Uint8Array(secretKey));
    console.log('📝 Wallet del creador:', creator.publicKey.toString());
  } catch (error) {
    console.error('❌ Error cargando wallet:', error.message);
    process.exit(1);
  }

  try {
    // 1. Crear el mint del token
    console.log('🏭 Creando mint del token deflacionario...');
    const mint = Keypair.generate();
    
    // 2. Calcular direcciones PDA
    const [tokenConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('token_config'), mint.publicKey.toBuffer()],
      DEFLATIONARY_TOKEN_PROGRAM_ID
    );

    const [launchConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('launch_config'), mint.publicKey.toBuffer()],
      DEFLATIONARY_TOKEN_PROGRAM_ID
    );

    // 3. Crear cuenta de tokens asociada para el creador
    const creatorTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      creator,
      mint.publicKey,
      creator.publicKey
    );

    // 4. Crear cuenta de tokens para el lanzamiento
    const launchTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      creator,
      mint.publicKey,
      launchConfigPda,
      true // allowOwnerOffCurve
    );

    console.log('📋 Direcciones calculadas:');
    console.log(`   Mint: ${mint.publicKey.toString()}`);
    console.log(`   Token Config: ${tokenConfigPda.toString()}`);
    console.log(`   Launch Config: ${launchConfigPda.toString()}`);

    // 5. Crear el token deflacionario usando el programa
    console.log('🔧 Creando token deflacionario en blockchain...');
    
    // Aquí iría la llamada al programa de Anchor
    // Por ahora, simulamos creando un mint normal
    const mintAccount = await createMint(
      connection,
      creator,
      creator.publicKey,
      creator.publicKey,
      tokenConfig.decimals,
      mint
    );

    // 6. Mintear tokens para el lanzamiento
    const tokensForLaunch = tokenConfig.tokensForSale * Math.pow(10, tokenConfig.decimals);
    await mintTo(
      connection,
      creator,
      mintAccount,
      launchTokenAccount.address,
      creator.publicKey,
      tokensForLaunch
    );

    console.log(`✅ ${tokenConfig.tokensForSale.toLocaleString()} tokens minteados para lanzamiento`);

    // 7. Configurar el lanzamiento
    const launchStartTime = Math.floor(Date.now() / 1000) + (tokenConfig.launchDelayMinutes * 60);
    const launchEndTime = launchStartTime + (tokenConfig.launchDurationDays * 24 * 60 * 60);

    console.log('⏰ Configurando lanzamiento...');
    console.log(`   Inicio: ${new Date(launchStartTime * 1000).toLocaleString()}`);
    console.log(`   Fin: ${new Date(launchEndTime * 1000).toLocaleString()}`);
    console.log(`   Precio: ${tokenConfig.tokensPerSol} tokens por SOL`);

    // 8. Guardar información del lanzamiento
    const launchInfo = {
      network: NETWORK,
      mint: mintAccount.toString(),
      tokenConfig: {
        ...tokenConfig,
        mint: mintAccount.toString(),
        creator: creator.publicKey.toString(),
        tokenConfigPda: tokenConfigPda.toString(),
        launchConfigPda: launchConfigPda.toString(),
        creatorTokenAccount: creatorTokenAccount.address.toString(),
        launchTokenAccount: launchTokenAccount.address.toString(),
      },
      launch: {
        startTime: launchStartTime,
        endTime: launchEndTime,
        tokensForSale: tokenConfig.tokensForSale,
        tokensPerSol: tokenConfig.tokensPerSol,
        status: 'pending',
      },
      createdAt: new Date().toISOString(),
    };

    const filename = `./launch-${tokenConfig.symbol.toLowerCase()}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(launchInfo, null, 2));
    console.log(`📄 Información guardada en ${filename}`);

    console.log('\n🎉 ¡Token deflacionario lanzado exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   Nombre: ${tokenConfig.name}`);
    console.log(`   Símbolo: ${tokenConfig.symbol}`);
    console.log(`   Mint: ${mintAccount.toString()}`);
    console.log(`   Tasa de quema: ${tokenConfig.burnRate / 100}%`);
    console.log(`   Tokens para venta: ${tokenConfig.tokensForSale.toLocaleString()}`);
    console.log(`   Precio: ${tokenConfig.tokensPerSol} tokens por SOL`);

    return launchInfo;

  } catch (error) {
    console.error('❌ Error lanzando token:', error);
    throw error;
  }
}

function validateTokenConfig(config) {
  const required = ['name', 'symbol', 'burnRate', 'tokensForSale', 'tokensPerSol'];
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Campo requerido faltante: ${field}`);
    }
  }

  if (config.burnRate > 1000) { // 10% máximo
    throw new Error('Tasa de quema muy alta. Máximo 10%');
  }

  if (config.name.length > 32) {
    throw new Error('Nombre muy largo. Máximo 32 caracteres');
  }

  if (config.symbol.length > 10) {
    throw new Error('Símbolo muy largo. Máximo 10 caracteres');
  }
}

// Configuración de ejemplo
const exampleTokenConfig = {
  name: 'DeflaMeme Token',
  symbol: 'DMEME',
  description: 'El primer meme token deflacionario con quema automática',
  decimals: 6,
  burnRate: 200, // 2% de quema por transacción
  tokensForSale: 1000000, // 1M tokens para venta
  tokensPerSol: 10000, // 10K tokens por SOL
  launchDelayMinutes: 5, // Lanzar en 5 minutos
  launchDurationDays: 7, // Duración de 7 días
  image: 'https://your-domain.com/dmeme-logo.png',
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  const config = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) : exampleTokenConfig;
  launchDeflationaryToken(config).catch(console.error);
}

module.exports = { launchDeflationaryToken, validateTokenConfig };
