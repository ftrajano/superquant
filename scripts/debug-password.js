// Script para debugar problema de senha
// Execute: node scripts/debug-password.js

const bcrypt = require('bcryptjs');

async function testPasswordHashing() {
  console.log('🔍 Testando diferentes métodos de hash de senha...');
  
  const testPassword = 'teste123';
  
  // Método 1: Como no register (direto)
  const hash1 = await bcrypt.hash(testPassword, 10);
  console.log('\n1️⃣ Método Register (direto):');
  console.log('Hash:', hash1);
  console.log('Verificação:', await bcrypt.compare(testPassword, hash1));
  
  // Método 2: Como no change-password (com salt explícito) 
  const salt2 = await bcrypt.genSalt(10);
  const hash2 = await bcrypt.hash(testPassword, salt2);
  console.log('\n2️⃣ Método Change-Password (salt explícito):');
  console.log('Salt:', salt2);
  console.log('Hash:', hash2);
  console.log('Verificação:', await bcrypt.compare(testPassword, hash2));
  
  // Teste cruzado
  console.log('\n🔄 Teste cruzado:');
  console.log('Hash1 vs Hash2:', hash1 === hash2);
  console.log('Password vs Hash1:', await bcrypt.compare(testPassword, hash1));
  console.log('Password vs Hash2:', await bcrypt.compare(testPassword, hash2));
  
  console.log('\n✅ Ambos os métodos deveriam funcionar. Se o login não funciona,');
  console.log('o problema pode ser na sessão ou nos dados salvos no banco.');
}

testPasswordHashing().catch(console.error);