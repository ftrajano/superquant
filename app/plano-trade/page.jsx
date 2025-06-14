'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import { Card, Button, Input } from '@/components/ui';

export default function PlanoTradePage() {
  const [formData, setFormData] = useState({
    capitalDisponivel: '',
    percentualReserva: '20',
    valorPorOperacao: ''
  });

  const [calculados, setCalculados] = useState({
    capitalParaTrade: 0,
    capitalDividido: 0,
    reserva: 0,
    percentualPorOperacao: 0
  });

  // Calcular valores automaticamente quando os dados mudarem
  useEffect(() => {
    const capital = parseFloat(formData.capitalDisponivel) || 0;
    const percentualReserva = parseFloat(formData.percentualReserva) || 0;
    const valorOperacao = parseFloat(formData.valorPorOperacao) || 0;

    const reserva = (capital * percentualReserva) / 100;
    const capitalParaTrade = capital - reserva;
    const capitalDividido = capitalParaTrade / 6;
    const percentualPorOperacao = capital > 0 ? (valorOperacao / capital) * 100 : 0;

    setCalculados({
      capitalParaTrade,
      capitalDividido,
      reserva,
      percentualPorOperacao
    });
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getRiscoMargem = () => {
    if (calculados.percentualPorOperacao <= 5) {
      return { nivel: 'Baixo', cor: 'text-green-600', bg: 'bg-green-100' };
    } else if (calculados.percentualPorOperacao <= 10) {
      return { nivel: 'Moderado', cor: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else if (calculados.percentualPorOperacao <= 20) {
      return { nivel: 'Alto', cor: 'text-orange-600', bg: 'bg-orange-100' };
    } else {
      return { nivel: 'Crítico', cor: 'text-red-600', bg: 'bg-red-100' };
    }
  };

  const risco = getRiscoMargem();

  return (
    <div className="min-h-screen bg-theme-background">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Plano de Trade</h1>
          <p className="text-text-secondary">
            Configure seu capital disponível e gerencie o risco das suas operações
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Configuração */}
          <Card>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Configurações</h2>
            
            <div className="space-y-4">
              <Input
                id="capitalDisponivel"
                name="capitalDisponivel"
                type="number"
                label="Capital Disponível (R$)"
                placeholder="Ex: 100000"
                value={formData.capitalDisponivel}
                onChange={handleChange}
                step="0.01"
                min="0"
              />

              <Input
                id="percentualReserva"
                name="percentualReserva"
                type="number"
                label="Percentual de Reserva (%)"
                placeholder="Ex: 20"
                value={formData.percentualReserva}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="100"
              />

              <Input
                id="valorPorOperacao"
                name="valorPorOperacao"
                type="number"
                label="Valor por Operação (R$)"
                placeholder="Ex: 5000"
                value={formData.valorPorOperacao}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>
          </Card>

          {/* Resultados dos Cálculos */}
          <Card>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Resumo do Plano</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-surface-secondary rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-secondary text-sm">Capital Total:</span>
                  <span className="text-text-primary font-semibold">
                    {formatCurrency(parseFloat(formData.capitalDisponivel) || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-secondary text-sm">Reserva ({formData.percentualReserva}%):</span>
                  <span className="text-text-primary font-semibold">
                    {formatCurrency(calculados.reserva)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-secondary text-sm">Capital para Trade:</span>
                  <span className="text-text-primary font-semibold">
                    {formatCurrency(calculados.capitalParaTrade)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-text-secondary text-sm">Capital ÷ 6 posições:</span>
                  <span className="text-primary font-bold text-lg">
                    {formatCurrency(calculados.capitalDividido)}
                  </span>
                </div>
              </div>

              {/* Análise de Risco */}
              {formData.valorPorOperacao && (
                <div className={`p-4 rounded-lg ${risco.bg}`}>
                  <h3 className="font-semibold text-text-primary mb-2">Análise de Risco por Operação</h3>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-text-secondary text-sm">Valor por Operação:</span>
                    <span className="text-text-primary font-semibold">
                      {formatCurrency(parseFloat(formData.valorPorOperacao))}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-text-secondary text-sm">% do Capital Total:</span>
                    <span className="text-text-primary font-semibold">
                      {calculados.percentualPorOperacao.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm">Nível de Risco:</span>
                    <span className={`font-semibold ${risco.cor}`}>
                      {risco.nivel}
                    </span>
                  </div>
                </div>
              )}

              {/* Recomendações */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-text-primary mb-2">💡 Recomendações</h3>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Mantenha uma reserva de emergência (15-25%)</li>
                  <li>• Diversifique em até 6 posições diferentes</li>
                  <li>• Use no máximo 5-10% do capital por operação</li>
                  <li>• Monitore constantemente sua margem utilizada</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}