// app/api/telegram/test/route.js
import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(request) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }
    
    const success = await sendTelegramMessage(message);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Mensagem enviada com sucesso para o Telegram'
      });
    } else {
      return NextResponse.json(
        { error: 'Falha ao enviar mensagem para o Telegram' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro no teste do Telegram:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}