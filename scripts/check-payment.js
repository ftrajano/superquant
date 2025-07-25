// scripts/check-payment.js
const fs = require('fs');
const path = require('path');

// Ler .env.local manualmente
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Configurar ambiente
Object.keys(envVars).forEach(key => {
  process.env[key] = envVars[key];
});

const https = require('https');

function checkPayment(paymentId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.mercadopago.com',
      port: 443,
      path: `/v1/payments/${paymentId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const payment = JSON.parse(data);
          resolve(payment);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const paymentId = process.argv[2] || '119379388915';
  
  console.log('🔍 Verificando pagamento:', paymentId);
  
  try {
    const payment = await checkPayment(paymentId);
    
    console.log('\n💳 DADOS DO PAGAMENTO:');
    console.log('ID:', payment.id);
    console.log('Status:', payment.status);
    console.log('Status Detail:', payment.status_detail);
    console.log('Método:', payment.payment_method_id);
    console.log('Tipo:', payment.payment_type_id);
    console.log('Valor:', payment.transaction_amount);
    console.log('Email:', payment.payer?.email);
    console.log('Criado:', payment.date_created);
    console.log('Aprovado:', payment.date_approved);
    console.log('External Ref:', payment.external_reference);
    
    if (payment.status === 'approved') {
      console.log('\n✅ PAGAMENTO APROVADO! Pode ativar assinatura.');
    } else {
      console.log('\n⏳ PAGAMENTO AINDA PENDENTE.');
    }
    
  } catch (error) {
    console.error('💥 Erro:', error.message);
  }
}

main();