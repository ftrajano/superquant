'use client';

export default function YearSelector({ currentYear, onYearChange }) {
  // Função para mudar o ano (próximo ou anterior)
  const changeYear = (step) => {
    const newYear = parseInt(currentYear) + step;
    onYearChange(newYear.toString());
  };

  return (
    <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-2">
      <button
        onClick={() => changeYear(-1)}
        className="px-2 py-1 hover:text-blue-600 focus:outline-none"
        aria-label="Ano anterior"
      >
        ← anterior
      </button>
      
      <span className="font-medium text-gray-800 px-2">
        {currentYear}
      </span>
      
      <button
        onClick={() => changeYear(1)}
        className="px-2 py-1 hover:text-blue-600 focus:outline-none"
        aria-label="Próximo ano"
      >
        próximo →
      </button>
    </div>
  );
}