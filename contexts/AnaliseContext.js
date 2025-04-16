import { createContext, useContext, useState, useEffect } from 'react';

const AnaliseContext = createContext();

export function AnaliseProvider({ children }) {
  const [analisesGuardadas, setAnalisesGuardadas] = useState([]);

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('analisesGuardadas');
      if (saved) {
        setAnalisesGuardadas(JSON.parse(saved));
      }
    }
  }, []);

  // Salvar dados no localStorage quando houver mudanças
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analisesGuardadas', JSON.stringify(analisesGuardadas));
    }
  }, [analisesGuardadas]);

  const salvarAnalise = (analise) => {
    setAnalisesGuardadas(prev => [...prev, analise]);
  };

  const removerAnalise = (index) => {
    if (window.confirm('Tem certeza que deseja excluir esta análise?')) {
      setAnalisesGuardadas(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <AnaliseContext.Provider value={{ analisesGuardadas, salvarAnalise, removerAnalise }}>
      {children}
    </AnaliseContext.Provider>
  );
}

export function useAnalise() {
  const context = useContext(AnaliseContext);
  if (!context) {
    throw new Error('useAnalise must be used within an AnaliseProvider');
  }
  return context;
}
