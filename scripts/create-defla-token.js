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
const {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as METADATA_PROGRAM_ID,
} = require('@metaplex-foundation/mpl-token-metadata');
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
  image: 'https://your-domain.com/hell-logo.png', // Cambiar por URL real
};

async function createDeflaToken() {
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
    process.exit(1);
  }

  try {
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

    // 4. Crear metadata del token
    console.log('📋 Creando metadata del token...');
    const metadataAddress = await createTokenMetadata(
      connection,
      payer,
      mint,
      TOKEN_CONFIG
    );
    console.log('✅ Metadata creada:', metadataAddress.toString());

    // 5. Opcional: Renunciar a la autoridad de mint (hacer supply fijo)
    // Descomenta las siguientes líneas si quieres hacer el supply fijo
    /*
    console.log('🔒 Renunciando a autoridad de mint...');
    await createSetAuthorityInstruction(
      mint,
      payer.publicKey,
      AuthorityType.MintTokens,
      null
    );
    console.log('✅ Autoridad de mint renunciada - Supply ahora es fijo');
    */

    // 6. Guardar información del token
    const tokenInfo = {
      network: NETWORK,
      mint: mint.toString(),
      decimals: TOKEN_CONFIG.decimals,
      initialSupply: TOKEN_CONFIG.initialSupply,
      createdAt: new Date().toISOString(),
      creator: payer.publicKey.toString(),
      tokenAccount: tokenAccount.address.toString(),
      metadataAccount: metadataAddress.toString(),
    };

    fs.writeFileSync('./hell-token-info.json', JSON.stringify(tokenInfo, null, 2));
    console.log('📄 Información guardada en hell-token-info.json');

    console.log('\n🎉 ¡Token HELL creado exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   Mint: ${mint.toString()}`);
    console.log(`   Supply: ${TOKEN_CONFIG.initialSupply.toLocaleString()} ${TOKEN_CONFIG.symbol}`);
    console.log(`   Red: ${NETWORK}`);
    console.log(`   Decimales: ${TOKEN_CONFIG.decimals}`);

    return tokenInfo;

  } catch (error) {
    console.error('❌ Error creando token:', error);
    process.exit(1);
  }
}

async function createTokenMetadata(connection, payer, mint, config) {
  // Calcular dirección de metadata
  const [metadataAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );

  // Datos de metadata
  const metadataData = {
    name: config.name,
    symbol: config.symbol,
    uri: '', // Puedes agregar un JSON con más metadata
    sellerFeeBasisPoints: 0,
    creators: [{
      address: payer.publicKey,
      verified: true,
      share: 100,
    }],
    collection: null,
    uses: null,
  };

  // Crear instrucción de metadata
  const instruction = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAddress,
      mint: mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: metadataData,
        isMutable: true,
        collectionDetails: null,
      },
    }
  );

  // Enviar transacción
  const transaction = new Transaction().add(instruction);
  await sendAndConfirmTransaction(connection, transaction, [payer]);

  return metadataAddress;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createDeflaToken().catch(console.error);
}

module.exports = { createDeflaToken };
