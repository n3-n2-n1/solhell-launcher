const {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} = require('@solana/web3.js');
const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  createSetAuthorityInstruction,
  AuthorityType,
} = require('@solana/spl-token');
const fs = require('fs');

// Configuración
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const RPC_URL = NETWORK === 'mainnet' 
  ? 'https://api.mainnet-beta.solana.com'
  : 'https://api.devnet.solana.com';

// Configuración del token HELL
const TOKEN_CONFIG = {
  name: 'HELL Token',
  symbol: 'HELL',
  description: 'Token nativo de la plataforma SolHell HELL para staking y rewards',
  decimals: 6,
  initialSupply: 100_000_000, // 100 millones de tokens iniciales
};

async function createHellToken() {
  console.log('🚀 Iniciando creación del token HELL...');
  
  // Conectar a Solana
  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Cargar wallet del creador (debe existir ~/.config/solana/id.json)
  let payer;
  try {
    const secretKey = JSON.parse(fs.readFileSync(process.env.HOME + '/.config/solana/id.json', 'utf8'));
    payer = Keypair.fromSecretKey(new Uint8Array(secretKey));
    console.log('📝 Wallet cargada:', payer.publicKey.toString());
  } catch (error) {
    console.error('❌ Error cargando wallet. Asegúrate de tener configurada tu wallet de Solana.');
    console.error('Ejecuta: solana-keygen new --no-bip39-passphrase');
    process.exit(1);
  }

  try {
    // Verificar balance
    const balance = await connection.getBalance(payer.publicKey);
    console.log('💰 Balance:', balance / 1e9, 'SOL');
    
    if (balance < 1e9) { // Menos de 1 SOL
      console.error('❌ Balance insuficiente. Necesitas al menos 1 SOL');
      console.log('Ejecuta: solana airdrop 2');
      process.exit(1);
    }

    // 1. Crear el mint del token
    console.log('🏭 Creando mint del token...');
    const mint = await createMint(
      connection,
      payer,
      payer.publicKey, // mint authority
      payer.publicKey, // freeze authority
      TOKEN_CONFIG.decimals
    );
    console.log('✅ Mint creado:', mint.toString());

    // 2. Crear cuenta de tokens asociada para el creador
    console.log('💼 Creando cuenta de tokens asociada...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );
    console.log('✅ Cuenta de tokens creada:', tokenAccount.address.toString());

    // 3. Mintear supply inicial
    console.log('💰 Minteando supply inicial...');
    const mintAmount = TOKEN_CONFIG.initialSupply * Math.pow(10, TOKEN_CONFIG.decimals);
    await mintTo(
      connection,
      payer,
      mint,
      tokenAccount.address,
      payer.publicKey,
      mintAmount
    );
    console.log(`✅ ${TOKEN_CONFIG.initialSupply.toLocaleString()} tokens minteados`);

    // 4. Guardar información del token
    const tokenInfo = {
      network: NETWORK,
      mint: mint.toString(),
      decimals: TOKEN_CONFIG.decimals,
      initialSupply: TOKEN_CONFIG.initialSupply,
      createdAt: new Date().toISOString(),
      creator: payer.publicKey.toString(),
      tokenAccount: tokenAccount.address.toString(),
      name: TOKEN_CONFIG.name,
      symbol: TOKEN_CONFIG.symbol,
      description: TOKEN_CONFIG.description,
    };

    fs.writeFileSync('./hell-token-info.json', JSON.stringify(tokenInfo, null, 2));
    console.log('📄 Información guardada en hell-token-info.json');

    console.log('\n🎉 ¡Token HELL creado exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   Mint: ${mint.toString()}`);
    console.log(`   Supply: ${TOKEN_CONFIG.initialSupply.toLocaleString()} ${TOKEN_CONFIG.symbol}`);
    console.log(`   Red: ${NETWORK}`);
    console.log(`   Decimales: ${TOKEN_CONFIG.decimals}`);
    console.log(`   Creador: ${payer.publicKey.toString()}`);

    console.log('\n📝 Para usar en el frontend, actualiza:');
    console.log(`NEXT_PUBLIC_HELL_MINT_ADDRESS=${mint.toString()}`);

    return tokenInfo;

  } catch (error) {
    console.error('❌ Error creando token:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createHellToken().catch(console.error);
}

module.exports = { createHellToken };
