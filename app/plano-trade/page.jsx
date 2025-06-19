'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import { Card, Button, Input } from '@/components/ui';

export default function PlanoTradePage() {
  const [formData, setFormData] = useState({
    capitalDisponivel: '',
    percentualReserva: '20',
    percentualPorOperacao: '25'
  });

  const [calculados, setCalculados] = useState({
    capitalParaTrade: 0,
    valorMensal: 0,
    reserva: 0,
    valorPorOperacao: 0
  });

  // Calcular valores automaticamente quando os dados mudarem
  useEffect(() => {
    const capital = parseFloat(formData.capitalDisponivel) || 0;
    const percentualReserva = parseFloat(formData.percentualReserva) || 0;
    const percentualPorOperacao = parseFloat(formData.percentualPorOperacao) || 25;

    const reserva = (capital * percentualReserva) / 100;
    const capitalParaTrade = capital - reserva;
    const valorMensal = capitalParaTrade / 6;
    const valorPorOperacao = (valorMensal * percentualPorOperacao) / 100;

    setCalculados({
      capitalParaTrade,
      valorMensal,
      reserva,
      valorPorOperacao
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

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Percentual por Operação (%)
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="percentualPorOperacao"
                        value="10"
                        checked={formData.percentualPorOperacao === '10'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-text-primary">10%</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="percentualPorOperacao"
                        value="20"
                        checked={formData.percentualPorOperacao === '20'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-text-primary">20%</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="percentualPorOperacao"
                        value="25"
                        checked={formData.percentualPorOperacao === '25'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-text-primary">25%</span>
                    </label>
                  </div>
                </div>
              </div>
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
                  <span className="text-text-secondary text-sm">Valor Mensal (÷ 6):</span>
                  <span className="text-primary font-bold text-lg">
                    {formatCurrency(calculados.valorMensal)}
                  </span>
                </div>
              </div>

              {/* Valor por Operação Calculado */}
              {calculados.valorPorOperacao > 0 && (
                <div className="p-4 bg-green-100 rounded-lg">
                  <h3 className="font-semibold text-text-primary mb-2">💰 Valor por Operação</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm">Valor calculado ({formData.percentualPorOperacao}% do mensal):</span>
                    <span className="text-green-700 font-bold text-lg">
                      {formatCurrency(calculados.valorPorOperacao)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}