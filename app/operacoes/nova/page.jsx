'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { Card, Button, Input, Select, Badge } from '@/components/ui';

// Componente de carregamento para o Suspense
const LoadingUI = () => (
  <div className="text-center py-8">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
    <p>Carregando...</p>
  </div>
);


// Componente principal que usa useSearchParams
const NovaOperacaoContent = () => {
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
    margemUtilizada: '',
    observacoes: ''
  });
  
  // Estado para os checkboxes de prefixos de ticker
  const [tickerPrefix, setTickerPrefix] = useState('BOVA');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Meses disponíveis
  const meses = [
    'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ].map(mes => ({
    value: mes,
    label: mes.charAt(0).toUpperCase() + mes.slice(1)
  }));
  
  // Gerar anos para seleção (2 anos passados até 5 anos futuros)
  const currentYear = new Date().getFullYear();
  const anos = [];
  for (let ano = currentYear - 2; ano <= currentYear + 5; ano++) {
    anos.push({ value: ano.toString(), label: ano.toString() });
  }
  
  // Opções para tipo e direção
  const tipoOptions = [
    { value: 'CALL', label: 'CALL' },
    { value: 'PUT', label: 'PUT' }
  ];
  
  const direcaoOptions = [
    { value: 'COMPRA', label: 'COMPRA' },
    { value: 'VENDA', label: 'VENDA' }
  ];
  
  // Atualizar o estado do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Atualizar o prefixo do ticker
  const handlePrefixChange = (prefix) => {
    setTickerPrefix(prefix);
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
          // Concatenar o prefixo ao ticker apenas se não for "Outros"
          ticker: tickerPrefix !== 'Outros' ? tickerPrefix + formData.nome : formData.nome,
          anoReferencia: parseInt(formData.anoReferencia),
          strike: parseFloat(formData.strike),
          preco: parseFloat(formData.preco),
          margemUtilizada: formData.margemUtilizada ? parseFloat(formData.margemUtilizada) : undefined,
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
    <div className="min-h-screen bg-theme-background">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button 
            href="/operacoes" 
            variant="outline"
            className="mr-4"
          >
            ← Voltar
          </Button>
          <h1 className="text-2xl font-bold text-text-primary">Nova Operação</h1>
        </div>
        
        {/* Mensagem de erro */}
        {error && (
          <div className="mb-4">
            <Badge variant="error" className="px-4 py-2 text-sm">
              {error}
            </Badge>
          </div>
        )}
        
        {/* Formulário */}
        <Card>
          <form onSubmit={handleSubmit}>
            {/* Seleção de prefixo de ticker */}
            <div className="mb-4">
              <label className="block text-text-secondary font-medium text-sm mb-2">
                Tipo de Opção
              </label>
              <div className="flex space-x-4 items-center">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="prefixBOVA" 
                    name="tickerPrefix" 
                    className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                    checked={tickerPrefix === 'BOVA'}
                    onChange={() => handlePrefixChange('BOVA')}
                  />
                  <label htmlFor="prefixBOVA" className="ml-2 text-sm font-medium text-text-primary cursor-pointer">
                    BOVA
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="prefixSMAL" 
                    name="tickerPrefix" 
                    className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                    checked={tickerPrefix === 'SMAL'}
                    onChange={() => handlePrefixChange('SMAL')}
                  />
                  <label htmlFor="prefixSMAL" className="ml-2 text-sm font-medium text-text-primary cursor-pointer">
                    SMAL
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="prefixOutros" 
                    name="tickerPrefix" 
                    className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                    checked={tickerPrefix === 'Outros'}
                    onChange={() => handlePrefixChange('Outros')}
                  />
                  <label htmlFor="prefixOutros" className="ml-2 text-sm font-medium text-text-primary cursor-pointer">
                    Outros
                  </label>
                </div>
              </div>
            </div>
            
            <Input
              id="nome"
              name="nome"
              type="text"
              label={`Ticker ${tickerPrefix !== 'Outros' ? `(será prefixado com ${tickerPrefix})` : ''}`}
              placeholder={tickerPrefix !== 'Outros' ? "Ex: A123" : "Ex: PETR4"}
              value={formData.nome}
              onChange={handleChange}
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Select
                id="mesReferencia"
                name="mesReferencia"
                label="Mês de Referência"
                value={formData.mesReferencia}
                onChange={handleChange}
                options={meses}
                required
              />
              
              <Select
                id="anoReferencia"
                name="anoReferencia"
                label="Ano de Referência"
                value={formData.anoReferencia}
                onChange={handleChange}
                options={anos}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Select
                id="tipo"
                name="tipo"
                label="Tipo"
                value={formData.tipo}
                onChange={handleChange}
                options={tipoOptions}
                required
              />
              
              <Select
                id="direcao"
                name="direcao"
                label="Direção"
                value={formData.direcao}
                onChange={handleChange}
                options={direcaoOptions}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input
                id="strike"
                name="strike"
                type="number"
                label="Strike"
                placeholder="Ex: 35.50"
                value={formData.strike}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
              />

              <Input
                id="preco"
                name="preco"
                type="number"
                label="Preço"
                placeholder="Ex: 1.25"
                value={formData.preco}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
              />

              <Input
                id="margemUtilizada"
                name="margemUtilizada"
                type="number"
                label="Margem (opcional)"
                placeholder="Ex: 500"
                value={formData.margemUtilizada}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="observacoes" className="block text-text-secondary font-medium text-sm mb-1">
                Observações (opcional)
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                className="w-full px-3 py-2 rounded-md bg-surface-bg border border-surface-border text-text-primary
                          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                          transition duration-200"
                rows="3"
                placeholder="Informações adicionais sobre a operação..."
                value={formData.observacoes}
                onChange={handleChange}
              ></textarea>
            </div>
            
            <div className="flex items-center justify-between">
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                isLoading={isLoading}
              >
                Criar Operação
              </Button>
              
              <Button 
                href="/operacoes" 
                variant="secondary"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

// Componente wrapper com Suspense
export default function NovaOperacaoPage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <NovaOperacaoContent />
    </Suspense>
  );
}