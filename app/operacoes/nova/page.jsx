'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NovaOperacaoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: '',
    mesReferencia: 'abril', // Valor padrão
    observacoes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Meses disponíveis
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  
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
      const response = await fetch('/api/operacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
              Nome da Operação
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Ex: Trava de Alta PETR4"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
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