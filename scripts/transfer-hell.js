const {
  Connection,
  Keypair,
  PublicKey,
} = require('@solana/web3.js');
const {
  getOrCreateAssociatedTokenAccount,
  transfer,
} = require('@solana/spl-token');
const fs = require('fs');

// Configuración
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const RPC_URL = NETWORK === 'mainnet' 
  ? 'https://api.mainnet-beta.solana.com'
  : 'https://api.devnet.solana.com';

async function transferHellTokens(recipientAddress, amount) {
  console.log('💸 Iniciando transferencia de tokens HELL...');
  
  // Cargar información del token
  let tokenInfo;
  try {
    tokenInfo = JSON.parse(fs.readFileSync('./hell-token-info.json', 'utf8'));
    console.log('📋 Token HELL cargado:', tokenInfo.mint);
  } catch (error) {
    console.error('❌ Error: No se encontró hell-token-info.json');
    console.log('Ejecuta primero: node create-hell-simple.js');
    process.exit(1);
  }

  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Cargar wallet del creador
  let payer;
  try {
    const secretKey = JSON.parse(fs.readFileSync(process.env.HOME + '/.config/solana/id.json', 'utf8'));
    payer = Keypair.fromSecretKey(new Uint8Array(secretKey));
    console.log('📝 Wallet del creador:', payer.publicKey.toString());
  } catch (error) {
    console.error('❌ Error cargando wallet del creador');
    process.exit(1);
  }

  try {
    const mintPublicKey = new PublicKey(tokenInfo.mint);
    const recipientPublicKey = new PublicKey(recipientAddress);
    
    // Obtener cuenta de tokens del creador
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintPublicKey,
      payer.publicKey
    );

    // Crear/obtener cuenta de tokens del destinatario
    console.log('🔄 Creando cuenta de tokens para el destinatario...');
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer, // El creador paga las fees
      mintPublicKey,
      recipientPublicKey
    );

    // Calcular cantidad en lamports (considerando 6 decimales)
    const transferAmount = amount * Math.pow(10, tokenInfo.decimals);
    
    console.log(`💸 Transfiriendo ${amount.toLocaleString()} HELL...`);
    console.log(`   De: ${fromTokenAccount.address.toString()}`);
    console.log(`   A: ${toTokenAccount.address.toString()}`);
    
    // Realizar la transferencia
    const signature = await transfer(
      connection,
      payer,
      fromTokenAccount.address,
      toTokenAccount.address,
      payer.publicKey,
      transferAmount
    );

    console.log('✅ Transferencia completada!');
    console.log(`   Signature: ${signature}`);
    console.log(`   Destinatario: ${recipientAddress}`);
    console.log(`   Cantidad: ${amount.toLocaleString()} HELL`);
    
    return signature;

  } catch (error) {
    console.error('❌ Error en la transferencia:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const recipientAddress = process.argv[2];
  const amount = parseFloat(process.argv[3]);
  
  if (!recipientAddress || !amount) {
    console.log('Uso: node transfer-hell.js <recipient_address> <amount>');
    console.log('Ejemplo: node transfer-hell.js 4qhqUZNJsPA2U3CkVaahzwepLpUfTEPvTy5EDXtkThDS 10000');
    process.exit(1);
  }
  
  transferHellTokens(recipientAddress, amount).catch(console.error);
}

module.exports = { transferHellTokens };
