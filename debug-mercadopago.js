// Script para debugar configuração do Mercado Pago
const fs = require('fs');
const path = require('path');

// Ler .env.local manualmente
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

console.log('=== DEBUG MERCADO PAGO ===');
console.log('ACCESS_TOKEN:', envVars.MERCADOPAGO_ACCESS_TOKEN);
console.log('PUBLIC_KEY:', envVars.MERCADOPAGO_PUBLIC_KEY);
console.log('WEBHOOK_SECRET:', envVars.MERCADOPAGO_WEBHOOK_SECRET);

const isTestAccessToken = envVars.MERCADOPAGO_ACCESS_TOKEN?.startsWith('TEST-');
const isTestPublicKey = envVars.MERCADOPAGO_PUBLIC_KEY?.startsWith('TEST-');

console.log('\n=== ANÁLISE ===');
console.log('Access Token é de teste?', isTestAccessToken);
console.log('Public Key é de teste?', isTestPublicKey);
console.log('Ambiente detectado:', isTestAccessToken ? 'TESTE' : 'PRODUÇÃO');

if (isTestAccessToken && isTestPublicKey) {
  console.log('✅ Todas as credenciais são de teste');
} else if (!isTestAccessToken && !isTestPublicKey) {
  console.log('✅ Todas as credenciais são de produção');
} else {
  console.log('❌ MISTURA DE CREDENCIAIS DETECTADA!');
  console.log('- Access Token:', isTestAccessToken ? 'TESTE' : 'PRODUÇÃO');
  console.log('- Public Key:', isTestPublicKey ? 'TESTE' : 'PRODUÇÃO');
}