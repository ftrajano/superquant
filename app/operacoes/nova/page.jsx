'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function NovaOperacaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const anoAtivo = searchParams.get('ano') || new Date().getFullYear().toString();
  
  const [formData, setFormData] = useState({
    nome: '',
    mesReferencia: 'abril', // Valor padrão
    anoReferencia: anoAtivo,
    tipo: 'CALL',
    direcao: 'COMPRA',
    strike: '',
    preco: '',
    observacoes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Meses disponíveis
  const meses = [
    'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  
  // Gerar anos para seleção (2 anos passados até 5 anos futuros)
  const currentYear = new Date().getFullYear();
  const anos = [];
  for (let ano = currentYear - 2; ano <= currentYear + 5; ano++) {
    anos.push(ano.toString());
  }
  
  // Atualizar o estado do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Enviar o formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Validar dados antes de enviar
      if (!formData.nome.trim()) {
        throw new Error('Nome é obrigatório');
      }
      
      if (!formData.mesReferencia) {
        throw new Error('Mês de referência é obrigatório');
      }
      
      if (!formData.strike || isNaN(parseFloat(formData.strike))) {
        throw new Error('Strike é obrigatório e deve ser um número válido');
      }
      
      if (!formData.preco || isNaN(parseFloat(formData.preco))) {
        throw new Error('Preço é obrigatório e deve ser um número válido');
      }
      
      const response = await fetch('/api/operacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ticker: formData.nome, // Usar nome como ticker
          anoReferencia: parseInt(formData.anoReferencia),
          strike: parseFloat(formData.strike),
          preco: parseFloat(formData.preco),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar operação');
      }
      
      const data = await response.json();
      
      // Redirecionar para a página de detalhes da nova operação
      router.push(`/operacoes/${data._id}`);
    } catch (err) {
      console.error('Erro:', err);
      setError(err.message || 'Ocorreu um erro ao criar a operação. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Link 
          href="/operacoes" 
          className="text-blue-600 hover:text-blue-800 mr-2"
        >
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-blue-800">Nova Operação</h1>
      </div>
      
      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Formulário */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nome">
              Ticker
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Ex: PETR4"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mesReferencia">
                Mês de Referência
              </label>
              <select
                id="mesReferencia"
                name="mesReferencia"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.mesReferencia}
                onChange={handleChange}
                required
              >
                {meses.map(mes => (
                  <option key={mes} value={mes} className="capitalize">
                    {mes.charAt(0).toUpperCase() + mes.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="anoReferencia">
                Ano de Referência
              </label>
              <select
                id="anoReferencia"
                name="anoReferencia"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.anoReferencia}
                onChange={handleChange}
                required
              >
                {anos.map(ano => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tipo">
                Tipo
              </label>
              <select
                id="tipo"
                name="tipo"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.tipo}
                onChange={handleChange}
                required
              >
                <option value="CALL">CALL</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="direcao">
                Direção
              </label>
              <select
                id="direcao"
                name="direcao"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.direcao}
                onChange={handleChange}
                required
              >
                <option value="COMPRA">COMPRA</option>
                <option value="VENDA">VENDA</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="strike">
                Strike
              </label>
              <input
                id="strike"
                name="strike"
                type="number"
                step="0.01"
                min="0"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Ex: 35.50"
                value={formData.strike}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="preco">
                Preço
              </label>
              <input
                id="preco"
                name="preco"
                type="number"
                step="0.01"
                min="0"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Ex: 1.25"
                value={formData.preco}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="observacoes">
              Observações (opcional)
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
              placeholder="Informações adicionais sobre a operação..."
              value={formData.observacoes}
              onChange={handleChange}
            ></textarea>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Criar Operação'}
            </button>
            <Link 
              href="/operacoes" 
              className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}