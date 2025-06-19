// lib/resend.js
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY não encontrada nas variáveis de ambiente');
  console.error('Variáveis disponíveis:', Object.keys(process.env).filter(key => key.includes('RESEND')));
  throw new Error('RESEND_API_KEY não encontrada nas variáveis de ambiente');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmailConfirmation = async (email, name, token) => {
  console.log('🟡 RESEND: Função sendEmailConfirmation chamada');
  console.log('🟡 Email destino:', email);
  console.log('🟡 Nome:', name);
  console.log('🟡 Token:', token);
  
  const confirmUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/confirm-email?token=${token}`;
  console.log('🟡 URL de confirmação:', confirmUrl);
  
  try {
    console.log('🟡 RESEND_API_KEY disponível:', !!process.env.RESEND_API_KEY);
    console.log('🟡 RESEND_API_KEY valor:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
    console.log('🟡 Enviando email de:', 'SuperQuant <contato@noreply.superquant.com.br>');
    console.log('🟡 Para:', email);
    
    console.log('🟡 Chamando resend.emails.send...');
    
    const { data, error } = await resend.emails.send({
      from: 'SuperQuant <contato@noreply.superquant.com.br>',
      to: [email],
      subject: 'Confirme seu email - SuperQuant',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0a6d3a;">Bem-vindo ao SuperQuant!</h2>
          <p>Olá <strong>${name}</strong>,</p>
          <p>Obrigado por se cadastrar no SuperQuant. Para completar seu cadastro, confirme seu email clicando no botão abaixo:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" 
               style="background-color: #0a6d3a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Confirmar Email
            </a>
          </div>
          
          <p>Ou copie e cole o link abaixo no seu navegador:</p>
          <p style="word-break: break-all; color: #666;">${confirmUrl}</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Este link expira em 24 horas. Se você não solicitou este cadastro, ignore este email.
          </p>
        </div>
      `,
    });

    console.log('🟡 Resposta da API recebida');
    console.log('🟡 Data:', data);
    console.log('🟡 Error:', error);

    if (error) {
      console.error('❌ Erro detalhado do Resend:', JSON.stringify(error, null, 2));
      throw new Error(`Falha ao enviar email: ${error.message || JSON.stringify(error)}`);
    }

    console.log('✅ Email enviado com sucesso pelo Resend');
    return data;
  } catch (error) {
    console.error('Erro no Resend:', error);
    throw error;
  }
};

export const sendPasswordReset = async (email, name, token) => {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'SuperQuant <contato@noreply.superquant.com.br>',
      to: [email],
      subject: 'Reset de senha - SuperQuant',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0a6d3a;">Reset de Senha - SuperQuant</h2>
          <p>Olá <strong>${name}</strong>,</p>
          <p>Você solicitou um reset de senha para sua conta no SuperQuant. Clique no botão abaixo para criar uma nova senha:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #0a6d3a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Redefinir Senha
            </a>
          </div>
          
          <p>Ou copie e cole o link abaixo no seu navegador:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Este link expira em 1 hora. Se você não solicitou este reset, ignore este email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Erro ao enviar email de reset:', error);
      throw new Error('Falha ao enviar email de reset');
    }

    return data;
  } catch (error) {
    console.error('Erro no Resend:', error);
    throw error;
  }
};