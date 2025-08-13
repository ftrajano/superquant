// Biblioteca para integração com Telegram
import fs from 'fs';
import path from 'path';

// Ler credenciais do arquivo de ambiente (.env em produção, .env.local em desenvolvimento)
function getTelegramConfig() {
  // Primeiro tentar das variáveis de ambiente direto
  let botToken = process.env.TELEGRAM_BOT_TOKEN;
  let chatId = process.env.TELEGRAM_CHAT_ID;
  
  // Se não existir, tentar ler dos arquivos de ambiente
  if (!botToken || !chatId) {
    try {
      // Tentar .env primeiro (produção), depois .env.local (desenvolvimento)
      const envFiles = ['.env', '.env.local'];
      
      for (const envFile of envFiles) {
        const envPath = path.join(process.cwd(), envFile);
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          
          const botTokenMatch = envContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
          const chatIdMatch = envContent.match(/TELEGRAM_CHAT_ID=(.+)/);
          
          botToken = botToken || (botTokenMatch ? botTokenMatch[1].trim() : null);
          chatId = chatId || (chatIdMatch ? chatIdMatch[1].trim() : null);
          
          // Se encontrou ambos, não precisa verificar o próximo arquivo
          if (botToken && chatId) break;
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao ler arquivo de ambiente:', error.message);
    }
  }
  
  return {
    botToken: botToken,
    chatId: chatId
  };
}

// Função para enviar mensagem via Telegram
async function sendTelegramMessage(message) {
  const { botToken, chatId } = getTelegramConfig();
  
  if (!botToken || !chatId) {
    console.warn('⚠️ Credenciais do Telegram não configuradas');
    return false;
  }
  
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro ao enviar mensagem Telegram:', errorData);
      return false;
    }
    
    console.log('✅ Mensagem enviada para Telegram');
    return true;
    
  } catch (error) {
    console.error('❌ Erro na comunicação com Telegram:', error);
    return false;
  }
}

// Função para formatar mensagem de abertura de operação
function formatOperacaoAbertura(operacao) {
  const direcaoIcon = operacao.direcao === 'COMPRA' ? '⬆️' : '⬇️';
  const valorTotal = operacao.valorTotal || (operacao.preco * (operacao.quantidade || 1));
  
  return `🟢 <b>ABERTURA DE OPERAÇÃO ${operacao.idVisual}</b>

<b>Ativo:</b> ${operacao.ticker}
<b>Tipo:</b> ${operacao.tipo}
<b>Direção:</b> ${direcaoIcon} ${operacao.direcao}
<b>Strike:</b> ${formatMoney(operacao.strike)}
<b>Preço:</b> ${formatMoney(operacao.preco)}
<b>Quantidade:</b> ${operacao.quantidade || 1}
<b>Valor Total:</b> ${formatMoney(valorTotal)}

${operacao.observacoes ? `<b>Obs:</b> ${operacao.observacoes}` : `<b>Obs:</b> Abertura de operação ${operacao.idVisual}`}

⚠️ <i>Atenção: Conteúdo Educacional. Não é recomendação. Operar envolve riscos.</i>`;
}

// Função para formatar mensagem de fechamento de operação
function formatOperacaoFechamento(operacao) {
  const resultadoIcon = operacao.resultadoTotal > 0 ? '🟢' : operacao.resultadoTotal < 0 ? '🔴' : '⚪';
  const direcaoIcon = operacao.direcao === 'COMPRA' ? '⬆️' : '⬇️';
  
  return `${resultadoIcon} <b>FECHAMENTO DE OPERAÇÃO ${operacao.idVisual}</b>

<b>Ativo:</b> ${operacao.ticker}
<b>Tipo:</b> ${operacao.tipo}
<b>Direção:</b> ${direcaoIcon} ${operacao.direcao}
<b>Strike:</b> ${formatMoney(operacao.strike)}
<b>Preço Abertura:</b> ${formatMoney(operacao.preco)}
<b>Preço Fechamento:</b> ${formatMoney(operacao.precoFechamento)}
<b>Quantidade:</b> ${operacao.quantidade || 1}
<b>Resultado:</b> ${formatMoney(operacao.resultadoTotal)}

${operacao.observacoes ? `<b>Obs:</b> ${operacao.observacoes}` : `<b>Obs:</b> Fechamento de operação ${operacao.idVisual}`}

⚠️ <i>Atenção: Conteúdo Educacional. Não é recomendação. Operar envolve riscos.</i>`;
}

// Função auxiliar para formatar valores monetários
function formatMoney(value) {
  if (value === null || value === undefined) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Função para enviar notificação de abertura de operação
async function notifyOperacaoAbertura(operacao) {
  const message = formatOperacaoAbertura(operacao);
  return await sendTelegramMessage(message);
}

// Função para enviar notificação de fechamento de operação
async function notifyOperacaoFechamento(operacao) {
  const message = formatOperacaoFechamento(operacao);
  return await sendTelegramMessage(message);
}

export {
  sendTelegramMessage,
  notifyOperacaoAbertura,
  notifyOperacaoFechamento,
  formatOperacaoAbertura,
  formatOperacaoFechamento
};