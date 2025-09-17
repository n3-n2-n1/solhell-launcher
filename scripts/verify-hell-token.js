const {
  Connection,
  PublicKey,
} = require('@solana/web3.js');
const {
  getMint,
  getAssociatedTokenAddress,
  getAccount,
} = require('@solana/spl-token');
const fs = require('fs');

async function verifyHellToken() {
  console.log('🔍 Verificando token HELL...');
  
  // Cargar información del token
  let tokenInfo;
  try {
    tokenInfo = JSON.parse(fs.readFileSync('./hell-token-info.json', 'utf8'));
  } catch (error) {
    console.error('❌ Error: No se encontró hell-token-info.json');
    process.exit(1);
  }

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const mintPublicKey = new PublicKey(tokenInfo.mint);
  const creatorPublicKey = new PublicKey(tokenInfo.creator);

  try {
    // 1. Verificar que el mint existe
    console.log('1️⃣ Verificando mint...');
    const mintInfo = await getMint(connection, mintPublicKey);
    console.log('✅ Mint verificado:');
    console.log(`   Address: ${mintPublicKey.toString()}`);
    console.log(`   Decimals: ${mintInfo.decimals}`);
    console.log(`   Supply: ${Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)}`);

    // 2. Verificar cuenta de tokens del creador
    console.log('\n2️⃣ Verificando cuenta del creador...');
    const creatorTokenAddress = await getAssociatedTokenAddress(mintPublicKey, creatorPublicKey);
    const creatorTokenAccount = await getAccount(connection, creatorTokenAddress);
    const creatorBalance = Number(creatorTokenAccount.amount) / Math.pow(10, mintInfo.decimals);
    
    console.log('✅ Cuenta del creador verificada:');
    console.log(`   Address: ${creatorTokenAddress.toString()}`);
    console.log(`   Balance: ${creatorBalance.toLocaleString()} HELL`);

    // 3. Verificar información del token
    console.log('\n3️⃣ Información del token:');
    console.log(`   Nombre: ${tokenInfo.name}`);
    console.log(`   Símbolo: ${tokenInfo.symbol}`);
    console.log(`   Red: ${tokenInfo.network}`);
    console.log(`   Creado: ${new Date(tokenInfo.createdAt).toLocaleString()}`);

    console.log('\n🎉 ¡Token HELL verificado exitosamente!');
    console.log('\n📝 Para usar en el frontend:');
    console.log(`NEXT_PUBLIC_HELL_MINT_ADDRESS=${mintPublicKey.toString()}`);
    console.log(`NEXT_PUBLIC_SOLANA_NETWORK=devnet`);

    return {
      mint: mintPublicKey.toString(),
      verified: true,
      supply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
      creatorBalance,
    };

  } catch (error) {
    console.error('❌ Error verificando token:', error);
    return { verified: false, error: error.message };
  }
}

if (require.main === module) {
  verifyHellToken().catch(console.error);
}

module.exports = { verifyHellToken };
