'use client';

import { useTheme } from './ThemeProvider';

export default function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="border-t border-surface-border mt-auto" style={{ backgroundColor: 'var(--surface-card)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>AVISO LEGAL</h3>
          
          <div className="text-sm space-y-4 max-w-6xl mx-auto text-justify leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <p>
              <strong>Investir no mercado financeiro envolve riscos significativos, incluindo a perda de capital.</strong> Antes de tomar qualquer decisão de investimento, é essencial entender os riscos envolvidos e tomar precauções. Informe-se sobre os diferentes tipos de investimentos, seus riscos e retornos esperados. Leia materiais educativos, participe de seminários e siga fontes confiáveis de informação financeira.
            </p>
            
            <p>
              Diversifique seus investimentos para reduzir o risco, evitando concentrar todo seu capital em um único ativo ou setor. Realize sua própria análise e não se baseie apenas em recomendações de terceiros. Utilize ferramentas de rastreamento e análise, como o SuperQuant, para obter insights, mas sempre avalie se as oportunidades são adequadas ao seu perfil de investidor.
            </p>
            
            <p>
              Conheça seu perfil de investidor e invista conforme sua tolerância ao risco, considerando fatores como idade, objetivos financeiros, horizonte de investimento e necessidade de liquidez. Considere consultar um consultor financeiro ou gestor de investimentos para orientações personalizadas e para ajudar a estruturar um portfólio que atenda às suas necessidades e objetivos.
            </p>
            
            <p>
              O mercado financeiro é dinâmico e sujeito a mudanças rápidas, por isso mantenha-se atualizado com notícias econômicas e financeiras, revisando periodicamente suas estratégias e portfólio. Estabeleça limites claros para perdas e ganhos, utilizando estratégias como stop-loss e take-profit, e monitore regularmente seus investimentos, ajustando conforme necessário.
            </p>
            
            <p className="font-medium">
              <strong>As operações geradas pelo bot não são recomendações de investimento.</strong> As informações fornecidas pelo SuperQuant são baseadas em análises de dados e leitura de mercado, mas não garantem resultados específicos. Toda decisão de investimento deve ser tomada com cautela e responsabilidade. O desempenho passado não é indicativo de resultados futuros.
            </p>
            
            <p className="font-medium" style={{ color: 'var(--primary)' }}>
              Invista de maneira consciente e responsável. O SuperQuant está aqui para ajudar a identificar oportunidades, mas o controle final e a responsabilidade sobre os investimentos são sempre seus.
            </p>
          </div>
          
          <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--surface-border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              © 2025 SuperQuant. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}