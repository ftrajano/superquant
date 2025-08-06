import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { connectToDatabase } from '../../../../lib/db/mongodb';
import AuditLog from '../../../../lib/models/AuditLog';

// GET - Listar logs de auditoria (APENAS ADMIN)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // RESTRIÇÃO: Apenas administradores podem acessar logs
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar logs de auditoria.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const category = searchParams.get('category'); // 'subscription', 'user_management', 'system'
    const action = searchParams.get('action');
    const targetUserId = searchParams.get('targetUserId');
    const performedBy = searchParams.get('performedBy');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Construir filtros
    const filters = {};

    if (category && category !== 'all') {
      filters.category = category;
    }

    if (action && action !== 'all') {
      filters.action = action;
    }

    if (targetUserId) {
      filters['targetUser.userId'] = targetUserId;
    }

    if (performedBy) {
      filters['performedBy.userId'] = performedBy;
    }

    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) {
        filters.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // Final do dia
        filters.timestamp.$lte = endDateTime;
      }
    }

    // Consultar logs com paginação
    const skip = (page - 1) * limit;
    
    const [logs, totalCount] = await Promise.all([
      AuditLog.find(filters)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy.userId', 'name email')
        .populate('targetUser.userId', 'name email'),
      
      AuditLog.countDocuments(filters)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}