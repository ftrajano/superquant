// Script para testar o Resend
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

// Ler URI diretamente do .env.local
function getResendKey() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const keyMatch = envContent.match(/RESEND_API_KEY=(.+)/);
  return keyMatch ? keyMatch[1].trim() : null;
}

async function testResend() {
  const apiKey = getResendKey();
  
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY não encontrada');
    return;
  }
  
  console.log('🔑 API Key encontrada:', apiKey.substring(0, 10) + '...');
  
  const resend = new Resend(apiKey);
  
  try {
    console.log('📧 Testando envio de email...');
    
    const { data, error } = await resend.emails.send({
      from: 'SuperQuant <contato@noreply.superquant.com.br>',
      to: ['your-test-email@example.com'], // Substitua pelo seu email
      subject: 'Teste Resend - SuperQuant',
      html: `
        <h2>Teste de Email</h2>
        <p>Este é um teste para verificar se o Resend está funcionando.</p>
        <p>Enviado em: ${new Date().toLocaleString('pt-BR')}</p>
      `
    });
    
    if (error) {
      console.error('❌ Erro ao enviar:', error);
    } else {
      console.log('✅ Email enviado com sucesso!');
      console.log('📊 Dados:', data);
    }
    
  } catch (error) {
    console.error('💥 Erro na requisição:', error.message);
  }
}

testResend();