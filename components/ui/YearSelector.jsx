'use client';

/**
 * Componente YearSelector - Controle para navegar entre anos
 * 
 * @param {Object} props
 * @param {string} props.currentYear - Ano atual selecionado
 * @param {function} props.onYearChange - Função chamada ao mudar o ano
 * @param {string} [props.className] - Classes adicionais para o container
 */
export default function YearSelector({ currentYear, onYearChange, className = '' }) {
  // Função para mudar o ano (próximo ou anterior)
  const changeYear = (step) => {
    const newYear = parseInt(currentYear) + step;
    onYearChange(newYear.toString());
  };

  return (
    <div className={`flex items-center justify-center space-x-2 text-sm mb-3 ${className}`}>
      <button
        onClick={() => changeYear(-1)}
        className="px-2 py-1 text-text-secondary hover:text-primary focus:outline-none transition-colors"
        aria-label="Ano anterior"
      >
        ← anterior
      </button>
      
      <span className="font-medium text-text-primary px-2">
        {currentYear}
      </span>
      
      <button
        onClick={() => changeYear(1)}
        className="px-2 py-1 text-text-secondary hover:text-primary focus:outline-none transition-colors"
        aria-label="Próximo ano"
      >
        próximo →
      </button>
    </div>
  );
}