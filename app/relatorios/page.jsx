'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';
import NavBar from '@/components/NavBar';

export default function RelatoriosPage() {
  // Estados
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodo, setPeriodo] = useState('ultimos3meses');
  const [activeTab, setActiveTab] = useState('desempenho');
  const [mesEspecificoSelecionado, setMesEspecificoSelecionado] = useState('abril');
  const [anoEspecificoSelecionado, setAnoEspecificoSelecionado] = useState(new Date().getFullYear().toString());
  
  // Carregar dados do dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let url = `/api/relatorios?periodo=${periodo}`;
        
        // Se for mês específico, adicionar parâmetros de mês e ano
        if (periodo === 'mesEspecifico') {
          url += `&mes=${mesEspecificoSelecionado}&ano=${anoEspecificoSelecionado}`;
        }
        
        console.log('Buscando dados em:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          let errorMessage = 'Falha ao buscar dados dos relatórios';
          try {
            // Tentar obter detalhes do erro como JSON primeiro
            const errorData = await response.json();
            console.error('Erro detalhado (JSON):', errorData);
            errorMessage = errorData.error || `Erro ${response.status}`;
          } catch (jsonError) {
            // Se falhar, tentar obter como texto
            try {
              const errorText = await response.text();
              console.error('Erro detalhado (texto):', errorText);
              errorMessage = `${errorMessage}: ${response.status} ${errorText.substring(0, 100)}`;
            } catch (textError) {
              // Se tudo falhar, usar mensagem genérica com código de status
              console.error('Não foi possível extrair detalhes do erro');
              errorMessage = `${errorMessage}: Código ${response.status}`;
            }
          }
          throw new Error(errorMessage);
        }
        
        let data;
        try {
          data = await response.json();
          console.log("Dados recebidos da API:", data);
          
          // Garantir que os dados estejam no formato esperado
          const processedData = {
            ...data,
            // Garantir que lucroAcumulado seja sempre um array
            lucroAcumulado: Array.isArray(data.lucroAcumulado) ? data.lucroAcumulado : [],
            // Garantir que resultadoPorMes seja sempre um array
            resultadoPorMes: Array.isArray(data.resultadoPorMes) ? data.resultadoPorMes : [],
            // Garantir que operacoesPorMes seja sempre um array
            operacoesPorMes: Array.isArray(data.operacoesPorMes) ? data.operacoesPorMes : [],
            // Garantir que detalhesPorMes seja sempre um objeto
            detalhesPorMes: typeof data.detalhesPorMes === 'object' ? data.detalhesPorMes : {},
            // Garantir que melhoresOperacoes seja sempre um array
            melhoresOperacoes: Array.isArray(data.melhoresOperacoes) ? data.melhoresOperacoes : [],
            // Garantir que pioresOperacoes seja sempre um array
            pioresOperacoes: Array.isArray(data.pioresOperacoes) ? data.pioresOperacoes : [],
            // Garantir que distribuicaoTipo seja sempre um array
            distribuicaoTipo: Array.isArray(data.distribuicaoTipo) ? data.distribuicaoTipo : [],
            // Garantir que distribuicaoDirecao seja sempre um array
            distribuicaoDirecao: Array.isArray(data.distribuicaoDirecao) ? data.distribuicaoDirecao : []
          };
          
          setDashboardData(processedData);
          console.log("Dados processados:", processedData);
        } catch (jsonError) {
          console.error('Erro ao parsear JSON da resposta:', jsonError);
          throw new Error('Formato de resposta inválido. A API retornou dados em um formato inesperado.');
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError(`Não foi possível carregar os relatórios: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [periodo, mesEspecificoSelecionado, anoEspecificoSelecionado]);
  
  // Cores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];
  
  // Cores para gráficos adicionais se necessário
  
  // Formatador de data
  const formatarData = (dataString) => {
    if (!dataString) return '—';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };
  
  // Funções de detalhes por mês foram removidas
  
  // Função para formatar valores monetários
  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined) return '—';
    
    try {
      // Converter para número e arredondar para 2 casas decimais
      const valorNumerico = Number(valor);
      const valorArredondado = Math.round(valorNumerico * 100) / 100;
      
      // Formatar manualmente para ter controle total sobre o resultado
      const parteInteira = Math.floor(Math.abs(valorArredondado)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      const parteDecimal = Math.abs(valorArredondado).toFixed(2).split('.')[1];
      
      // Montar a string final no formato brasileiro (R$ 1.234,56)
      return `R$ ${valorArredondado < 0 ? '-' : ''}${parteInteira},${parteDecimal}`;
    } catch (e) {
      console.error("Erro ao formatar moeda:", e);
      return '—';
    }
  };
  
  // Função para formatar valores com "k" para milhares
  const formatarValorAbreviado = (valor) => {
    if (valor === null || valor === undefined) return '—';
    
    try {
      const valorNumerico = Number(valor);
      
      // Se o valor for maior que mil, usar formato "k"
      if (Math.abs(valorNumerico) >= 1000) {
        const valorEmK = valorNumerico / 1000;
        // Arredondar para 1 casa decimal se necessário
        const valorFormatado = valorEmK.toFixed(Math.abs(valorEmK) % 1 > 0.1 ? 1 : 0);
        return `R$ ${valorNumerico < 0 ? '-' : ''}${valorFormatado}k`;
      } else {
        // Para valores menores, usar formato normal com até 1 casa decimal
        const valorFormatado = valorNumerico.toFixed(Math.abs(valorNumerico) % 1 > 0.1 ? 1 : 0);
        return `R$ ${valorNumerico < 0 ? '-' : ''}${valorFormatado}`;
      }
    } catch (e) {
      console.error("Erro ao formatar valor abreviado:", e);
      return '—';
    }
  };
  
  // Componente para exibir valores monetários
  // Importante: Usar o fragmento vazio <> </> para evitar renderização do valor original
  const MoneyValue = ({ value, className }) => {
    const formattedValue = formatarMoeda(value);
    
    return (
      <>{/* Usando fragmento vazio para não renderizar o valor numérico original */}
        <span className={className}>{formattedValue}</span>
      </>
    );
  };
  
  // Componente para exibir valores monetários com formato abreviado (k para milhares)
  const MoneyValueK = ({ value, className }) => {
    const formattedValue = formatarValorAbreviado(value);
    
    return (
      <>{/* Usando fragmento vazio para não renderizar o valor numérico original */}
        <span className={className}>{formattedValue}</span>
      </>
    );
  };
  
  // Componente de card para métricas
  const MetricCard = ({ title, value, description, color, isMoney = false, useK = false }) => {
    return (
      <div className="bg-[var(--surface-card)] rounded-lg shadow p-4">
        <h3 className="text-[var(--text-tertiary)] text-sm">{title}</h3>
        <div className="flex items-end mt-1">
          {isMoney ? (
            useK ? (
              // MoneyValueK para mostrar valor abreviado em "k"
              <MoneyValueK value={value} className={`text-2xl font-bold ${color}`} />
            ) : (
              // MoneyValue envolve o conteúdo em um fragmento para não renderizar o valor original
              <MoneyValue value={value} className={`text-2xl font-bold ${color}`} />
            )
          ) : (
            <span className={`text-2xl font-bold ${color}`}>{value}</span>
          )}
          {/* Removida a exibição de tendência */}
        </div>
        {description && <p className="text-xs text-[var(--text-tertiary)] mt-1">{description}</p>}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--primary)]">Relatórios & Análises</h1>
            <p className="text-[var(--text-secondary)]">Acompanhe seu desempenho e métricas</p>
          </div>
        </div>
      
      {/* Filtros de Período */}
      <div className="mb-6">
        {periodo === 'mesEspecifico' && (
          <div className="mb-4 flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Selecione o mês:</label>
            <div className="flex space-x-2">
              <select 
                value={mesEspecificoSelecionado} 
                onChange={(e) => setMesEspecificoSelecionado(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="janeiro">Janeiro</option>
                <option value="fevereiro">Fevereiro</option>
                <option value="marco">Março</option>
                <option value="abril">Abril</option>
                <option value="maio">Maio</option>
                <option value="junho">Junho</option>
                <option value="julho">Julho</option>
                <option value="agosto">Agosto</option>
                <option value="setembro">Setembro</option>
                <option value="outubro">Outubro</option>
                <option value="novembro">Novembro</option>
                <option value="dezembro">Dezembro</option>
              </select>
              <select 
                value={anoEspecificoSelecionado} 
                onChange={(e) => setAnoEspecificoSelecionado(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const years = [];
                  // Show up to 3 years back and 5 years ahead
                  for (let year = currentYear - 3; year <= currentYear + 5; year++) {
                    years.push(year);
                  }
                  return years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ));
                })()}
              </select>
              <button
                onClick={() => setPeriodo(prevPeriodo => {
                  // Se já estamos em mesEspecifico, apenas recarregamos os dados
                  // forçando uma atualização ao mudar o estado
                  if (prevPeriodo === 'mesEspecifico') {
                    // Forçar nova busca
                    setPeriodo('mesEspecifico_update');
                    setTimeout(() => setPeriodo('mesEspecifico'), 10);
                  } else {
                    // Mudar para mesEspecifico
                    return 'mesEspecifico';
                  }
                })}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
        <div className="inline-flex shadow-sm rounded-md">
          <button
            type="button"
            onClick={() => setPeriodo('ultimoMes')}
            className={`px-4 py-2 text-sm font-medium ${
              periodo === 'ultimoMes' 
                ? 'bg-[var(--primary)] text-white' 
                : 'bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
            } rounded-l-md`}
          >
            Último Mês
          </button>
          <button
            type="button"
            onClick={() => setPeriodo('ultimos3meses')}
            className={`px-4 py-2 text-sm font-medium ${
              periodo === 'ultimos3meses' 
                ? 'bg-[var(--primary)] text-white' 
                : 'bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
            }`}
          >
            Últimos 3 Meses
          </button>
          <button
            type="button"
            onClick={() => setPeriodo('ultimos6meses')}
            className={`px-4 py-2 text-sm font-medium ${
              periodo === 'ultimos6meses' 
                ? 'bg-[var(--primary)] text-white' 
                : 'bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
            }`}
          >
            Últimos 6 Meses
          </button>
          <button
            type="button"
            onClick={() => setPeriodo('mesEspecifico')}
            className={`px-4 py-2 text-sm font-medium ${
              periodo === 'mesEspecifico' 
                ? 'bg-[var(--primary)] text-white' 
                : 'bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
            }`}
          >
            Mês Específico
          </button>
          <button
            type="button"
            onClick={() => setPeriodo('todos')}
            className={`px-4 py-2 text-sm font-medium ${
              periodo === 'todos' 
                ? 'bg-[var(--primary)] text-white' 
                : 'bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
            } rounded-r-md`}
          >
            Todos
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-[var(--surface-border)]">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('desempenho')}
              className={`py-2 px-1 border-b-2 ${
                activeTab === 'desempenho'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary-light)]'
              } font-medium text-sm`}
            >
              Desempenho
            </button>
            <button
              onClick={() => setActiveTab('distribuicao')}
              className={`py-2 px-1 border-b-2 ${
                activeTab === 'distribuicao'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary-light)]'
              } font-medium text-sm`}
            >
              Distribuição
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`py-2 px-1 border-b-2 ${
                activeTab === 'ranking'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary-light)]'
              } font-medium text-sm`}
            >
              Ranking
            </button>
          </nav>
        </div>
      </div>
      
      {/* Estado de carregamento */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Carregando relatórios...</p>
        </div>
      )}
      
      {/* Mensagem de erro */}
      {error && (
        <div className="bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Conteúdo do Dashboard */}
      {!isLoading && !error && dashboardData && (
        <>
          {/* Cards de Métricas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard 
              title="Operações Totais" 
              value={dashboardData.totalOperacoes} 
              description="Total de operações no período"
            />
            <MetricCard 
              title="Resultado Total" 
              value={dashboardData.resultadoTotal}
              color={dashboardData.resultadoTotal >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}
              description="Soma dos resultados no período"
              isMoney={true}
              useK={true}
            />
            <MetricCard 
              title="Taxa de Acerto" 
              value={`${dashboardData.taxaAcerto}%`}
              description="Operações lucrativas"
              color="text-[var(--primary)]"
            />
            <MetricCard 
              title="Média por Operação" 
              value={dashboardData.mediaResultado}
              description="Resultado médio por operação"
              color={dashboardData.mediaResultado >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}
              isMoney={true}
              useK={false}
            />
          </div>
          
          {/* Conteúdo específico de cada tab */}
          {activeTab === 'desempenho' && (
            <div className="grid grid-cols-1 gap-6">
              {/* Gráfico de Lucro Acumulado */}
              <div className="bg-[var(--surface-card)] p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Lucro Acumulado</h3>
                <div className="h-80">
                  {dashboardData.lucroAcumulado && Array.isArray(dashboardData.lucroAcumulado) && dashboardData.lucroAcumulado.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={dashboardData.lucroAcumulado}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                        <XAxis
                          dataKey="data"
                          tick={{fontSize: 10, fill: 'var(--text-secondary)'}}
                          interval="preserveEnd"
                          tickFormatter={(value) => {
                            if (!value || typeof value !== 'string') return '';
                            const parts = value.split('/');
                            return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : value;
                          }}
                          stroke="var(--text-tertiary)"
                        />
                        <YAxis
                          tickFormatter={(value) => {
                            if (typeof value !== 'number') return value;
                            if (Math.abs(value) >= 1000) {
                              return `${(value / 1000).toFixed(1)}k`;
                            }
                            return value;
                          }}
                          stroke="var(--text-tertiary)"
                          tick={{fill: 'var(--text-secondary)'}}
                        />
                        <Tooltip
                          formatter={(value, name, props) => {
                            // Formatar o valor monetário
                            const formattedValue = formatarMoeda(value);

                            // Retornar um array com o valor formatado e o nome da série
                            return [formattedValue, 'Lucro Acumulado'];
                          }}
                          labelFormatter={(label) => {
                            // Extrair informações adicionais do ponto de dados
                            const dataPoint = dashboardData.lucroAcumulado.find(item => item.data === label);
                            if (dataPoint) {
                              return [
                                `Data: ${label}`,
                                `Operação: ${dataPoint.operacao || 'N/A'}`,
                                dataPoint.idVisual ? `ID: ${dataPoint.idVisual}` : ''
                              ].filter(Boolean).join('\n');
                            }
                            return `Data: ${label}`;
                          }}
                          contentStyle={{
                            backgroundColor: 'var(--surface-card)',
                            border: '1px solid var(--surface-border)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)'
                          }}
                        />
                        <Legend wrapperStyle={{color: 'var(--text-primary)'}} />
                        <Line
                          type="monotone"
                          dataKey="saldo"
                          stroke="var(--primary)"
                          name="Lucro Acumulado"
                          strokeWidth={2}
                          dot={{r: 2, fill: 'var(--primary)'}}
                          activeDot={{r: 5, fill: 'var(--primary)'}}
                          isAnimationActive={false}
                        />
                        {/* Linha de referência no zero */}
                        <ReferenceLine y={0} stroke="var(--text-tertiary)" strokeDasharray="3 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-[var(--text-secondary)] text-center">
                        Não há dados de lucro acumulado para exibir neste período.<br />
                        Feche algumas operações para visualizar o gráfico.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Desempenho por mês (placeholder) */}
              <div className="bg-[var(--surface-card)] p-4 rounded-lg shadow">
                <div className="text-center p-6">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Visualização de Gráficos Mensais</h3>
                  <p className="text-[var(--text-secondary)]">
                    Esta funcionalidade está temporariamente indisponível enquanto trabalhamos em melhorias.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'distribuicao' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribuição por Tipo (CALL/PUT) */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição por Tipo</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.distribuicaoTipo}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="valor"
                        nameKey="nome"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        isAnimationActive={false}
                      >
                        {dashboardData.distribuicaoTipo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Distribuição por Direção (COMPRA/VENDA) */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição por Direção</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.distribuicaoDirecao}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="valor"
                        nameKey="nome"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        isAnimationActive={false}
                      >
                        {dashboardData.distribuicaoDirecao.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          
          {/* NOVA SEÇÃO: Tab de Operações por Mês */}
          {activeTab === 'detalhes-mes' && (
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Operações Fechadas por Mês</h3>
                <p className="text-gray-500 mb-4">
                  Selecione um mês no gráfico de resultados para ver todas as operações fechadas nesse período.
                </p>
              </div>
            </div>
          )}
          
          {activeTab === 'ranking' && (
            <div className="grid grid-cols-1 gap-6">
              {/* Melhores Operações */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Melhores Operações</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticker</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direção</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData.melhoresOperacoes.map((op, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-medium">
                            {op.ticker}
                            {op.idVisual && <div className="text-xs text-gray-500">{op.idVisual}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                              op.tipo === 'CALL' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                            }`}>
                              {op.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                              op.direcao === 'COMPRA' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }`}>
                              {op.direcao}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                            <MoneyValue value={op.resultado} className="font-semibold text-green-600" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                            {op.roi}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Piores Operações */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Piores Operações</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticker</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direção</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData.pioresOperacoes.map((op, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-medium">
                            {op.ticker}
                            {op.idVisual && <div className="text-xs text-gray-500">{op.idVisual}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                              op.tipo === 'CALL' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                            }`}>
                              {op.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                              op.direcao === 'COMPRA' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }`}>
                              {op.direcao}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-red-600">
                            <MoneyValue value={op.resultado} className="font-semibold text-red-600" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-red-600">
                            {op.roi}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Modal de Detalhes do Mês removido */}
      </div>
    </div>
  );
}