import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { connectToDatabase } from '../../../../lib/db/mongodb';
import User from '../../../../lib/models/User';
import AuditLog from '../../../../lib/models/AuditLog';
import { SUBSCRIPTION_PLANS } from '../../../../lib/subscription';

// GET - Listar todos os usuários com informações de assinatura
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar se é admin ou modelo
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'modelo')) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores e usuários modelo podem acessar.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    // Buscar todos os usuários com informações de assinatura
    const users = await User.find({}, {
      name: 1,
      email: 1,
      role: 1,
      subscription: 1,
      createdAt: 1
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users: users
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Gerenciar assinatura de usuário
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar se é admin ou modelo
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'modelo')) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores e usuários modelo podem gerenciar assinaturas.' },
        { status: 403 }
      );
    }

    const { userId, action, plan, expirationDate } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'UserId e action são obrigatórios' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Buscar o usuário
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    let updateData = {};
    let logMessage = '';

    switch (action) {
      case 'activate':
        if (!plan || !expirationDate) {
          return NextResponse.json(
            { error: 'Plano e data de expiração são obrigatórios para ativar' },
            { status: 400 }
          );
        }

        if (!SUBSCRIPTION_PLANS[plan]) {
          return NextResponse.json(
            { error: 'Plano inválido' },
            { status: 400 }
          );
        }

        const expDate = new Date(expirationDate);
        if (expDate <= new Date()) {
          return NextResponse.json(
            { error: 'Data de expiração deve ser futura' },
            { status: 400 }
          );
        }

        updateData = {
          'subscription.plan': plan,
          'subscription.status': 'active',
          'subscription.startDate': new Date(),
          'subscription.expirationDate': expDate,
          'subscription.lastPaymentAmount': SUBSCRIPTION_PLANS[plan].price,
          'subscription.lastPaymentDate': new Date(),
          'subscription.manualActivation': {
            activatedBy: session.user.id,
            activatedAt: new Date(),
            reason: 'Ativação manual via painel administrativo'
          }
        };

        logMessage = `Assinatura ${plan} ativada até ${expDate.toLocaleDateString('pt-BR')} por ${session.user.name}`;
        break;

      case 'extend':
        if (!expirationDate) {
          return NextResponse.json(
            { error: 'Nova data de expiração é obrigatória para estender' },
            { status: 400 }
          );
        }

        const newExpDate = new Date(expirationDate);
        if (newExpDate <= new Date()) {
          return NextResponse.json(
            { error: 'Nova data de expiração deve ser futura' },
            { status: 400 }
          );
        }

        updateData = {
          'subscription.expirationDate': newExpDate,
          'subscription.lastExtension': {
            extendedBy: session.user.id,
            extendedAt: new Date(),
            previousExpiration: user.subscription?.expirationDate,
            newExpiration: newExpDate
          }
        };

        logMessage = `Assinatura estendida até ${newExpDate.toLocaleDateString('pt-BR')} por ${session.user.name}`;
        break;

      case 'deactivate':
        updateData = {
          'subscription.status': 'cancelled',
          'subscription.cancelledAt': new Date(),
          'subscription.cancelledBy': session.user.id,
          'subscription.cancellationReason': 'Desativado manualmente via painel administrativo'
        };

        logMessage = `Assinatura desativada por ${session.user.name}`;
        break;

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        );
    }

    // Atualizar usuário
    await User.findByIdAndUpdate(userId, updateData);

    // Salvar log de auditoria detalhado
    try {
      const logData = {
        action,
        category: 'subscription',
        performedBy: {
          userId: session.user.id,
          userName: session.user.name,
          userEmail: session.user.email,
          userRole: session.user.role
        },
        targetUser: {
          userId: user._id,
          userName: user.name,
          userEmail: user.email
        },
        description: logMessage,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      };

      // Adicionar detalhes específicos baseados na ação
      if (action === 'activate') {
        logData.details = {
          subscriptionPlan: plan,
          newStatus: 'active',
          previousStatus: user.subscription?.status || 'inactive',
          newExpirationDate: new Date(expirationDate),
          previousExpirationDate: user.subscription?.expirationDate,
          amount: SUBSCRIPTION_PLANS[plan].price,
          reason: 'Ativação manual via painel administrativo'
        };
      } else if (action === 'extend') {
        logData.details = {
          subscriptionPlan: user.subscription?.plan,
          newExpirationDate: new Date(expirationDate),
          previousExpirationDate: user.subscription?.expirationDate,
          reason: 'Extensão manual via painel administrativo'
        };
      } else if (action === 'deactivate') {
        logData.details = {
          subscriptionPlan: user.subscription?.plan,
          previousStatus: user.subscription?.status || 'active',
          newStatus: 'cancelled',
          previousExpirationDate: user.subscription?.expirationDate,
          reason: 'Desativação manual via painel administrativo'
        };
      }

      await AuditLog.create(logData);
      
      // Log também no console para debug
      console.log(`AUDIT LOG SAVED: ${logMessage} - Usuario: ${user.email} (${user.name}) - Executado por: ${session.user.name}`);
      
    } catch (logError) {
      // Se falhar ao salvar log, ainda continua a operação mas registra o erro
      console.error('Erro ao salvar log de auditoria:', logError);
    }

    return NextResponse.json({
      success: true,
      message: logMessage
    });

  } catch (error) {
    console.error('Erro ao gerenciar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}