'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { data: session, status } = useSession();
  const router = useRouter();

  // Carregar dados salvos
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      carregarPlanoTrading();
    }
  }, [status, router]);

  const carregarPlanoTrading = async () => {
    try {
      const response = await fetch('/api/plano-trading');
      if (response.ok) {
        const data = await response.json();
        setFormData({
          capitalDisponivel: data.capitalDisponivel?.toString() || '',
          percentualReserva: data.percentualReserva?.toString() || '20',
          percentualPorOperacao: data.percentualPorOperacao?.toString() || '25'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar plano de trading:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarPlanoTrading = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/plano-trading', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capitalDisponivel: parseFloat(formData.capitalDisponivel) || 0,
          percentualReserva: parseFloat(formData.percentualReserva) || 20,
          percentualPorOperacao: parseFloat(formData.percentualPorOperacao) || 25
        }),
      });

      if (response.ok) {
        setMessage('Plano de trading salvo com sucesso!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Erro ao salvar');
      }
    } catch (error) {
      setMessage('Erro ao salvar plano de trading');
      console.error('Erro:', error);
    } finally {
      setSaving(false);
    }
  };

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


  if (loading) {
    return (
      <div className="min-h-screen bg-theme-background">
        <NavBar />
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-text-secondary">Carregando plano de trading...</p>
          </div>
        </div>
      </div>
    );
  }

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

              {/* Botão Salvar */}
              <div className="pt-4 border-t">
                <Button
                  onClick={salvarPlanoTrading}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? 'Salvando...' : 'Salvar Plano de Trading'}
                </Button>
              </div>

              {/* Mensagem de feedback */}
              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.includes('sucesso') 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-red-100 text-red-700 border border-red-300'
                }`}>
                  {message}
                </div>
              )}
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