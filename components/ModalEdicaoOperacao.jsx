'use client';

import { useState, useEffect } from 'react';
import Input from './ui/Input';
import Select from './ui/Select';

export default function ModalEdicaoOperacao({ operacao, onClose, onSave }) {
  const [formData, setFormData] = useState({
    ticker: '',
    tipo: '',
    direcao: '',
    strike: '',
    preco: '',
    quantidade: '',
    dataOperacao: '',
    dataVencimento: '',
    observacoes: '',
    corEstrategia: '',
    nomeEstrategia: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (operacao) {
      setFormData({
        ticker: operacao.ticker || '',
        tipo: operacao.tipo || '',
        direcao: operacao.direcao || '',
        strike: operacao.strike || '',
        preco: operacao.preco || '',
        quantidade: operacao.quantidade || '',
        dataOperacao: operacao.dataOperacao ? new Date(operacao.dataOperacao).toISOString().split('T')[0] : '',
        dataVencimento: operacao.dataVencimento ? new Date(operacao.dataVencimento).toISOString().split('T')[0] : '',
        observacoes: operacao.observacoes || '',
        corEstrategia: operacao.corEstrategia || '',
        nomeEstrategia: operacao.nomeEstrategia || ''
      });
    }
  }, [operacao]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/historico/${operacao._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSave();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao salvar operação');
      }
    } catch (error) {
      setError('Erro ao salvar operação');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const tipoOptions = [
    { value: 'CALL', label: 'CALL' },
    { value: 'PUT', label: 'PUT' }
  ];

  const direcaoOptions = [
    { value: 'COMPRA', label: 'COMPRA' },
    { value: 'VENDA', label: 'VENDA' }
  ];

  const coresEstrategia = [
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Amarelo' },
    { value: '#EF4444', label: 'Vermelho' },
    { value: '#8B5CF6', label: 'Roxo' },
    { value: '#F97316', label: 'Laranja' },
    { value: '#06B6D4', label: 'Ciano' },
    { value: '#EC4899', label: 'Rosa' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Editar Operação</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ticker"
                name="ticker"
                value={formData.ticker}
                onChange={handleChange}
                required
              />

              <Select
                label="Tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                options={tipoOptions}
                required
              />

              <Select
                label="Direção"
                name="direcao"
                value={formData.direcao}
                onChange={handleChange}
                options={direcaoOptions}
                required
              />

              <Input
                label="Strike"
                name="strike"
                type="number"
                step="0.01"
                value={formData.strike}
                onChange={handleChange}
                required
              />

              <Input
                label="Preço"
                name="preco"
                type="number"
                step="0.01"
                value={formData.preco}
                onChange={handleChange}
                required
              />

              <Input
                label="Quantidade"
                name="quantidade"
                type="number"
                value={formData.quantidade}
                onChange={handleChange}
                required
              />

              <Input
                label="Data da Operação"
                name="dataOperacao"
                type="date"
                value={formData.dataOperacao}
                onChange={handleChange}
                required
              />

              <Input
                label="Data de Vencimento"
                name="dataVencimento"
                type="date"
                value={formData.dataVencimento}
                onChange={handleChange}
              />

              <Input
                label="Nome da Estratégia"
                name="nomeEstrategia"
                value={formData.nomeEstrategia}
                onChange={handleChange}
                placeholder="Ex: Iron Condor"
              />

              <Select
                label="Cor da Estratégia"
                name="corEstrategia"
                value={formData.corEstrategia}
                onChange={handleChange}
                options={coresEstrategia}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Observações</label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observações sobre a operação..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}