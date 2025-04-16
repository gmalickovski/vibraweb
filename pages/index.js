import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Executa verificação imediatamente
    checkAuth();
  }, []);

  const checkAuth = () => {
    // Verifica se está no cliente
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('isAuthenticated');
      if (!isAuth) {
        router.replace('/login');
        return;
      }
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '1.2rem'
      }}>
        Carregando...
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - Vibr@web</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1>Vibr@web</h1>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Sair
          </button>
        </header>
        <div style={styles.products}>
          <Link href="/analise" style={styles.cardLink}>
            <div style={styles.card}>
              <div style={styles.cardImageContainer}>
                <img
                  src="/images/logo-analise-card.png"
                  alt="Análise de Propósito"
                  style={styles.img}
                />
              </div>
              <div style={styles.cardContent}>
                <h2 style={styles.cardTitle}>Análise de Propósito</h2>
                <p style={styles.cardDescription}>Descubra o seu potencial por meio da numerologia cabalística.</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '10px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '10px',
    '@media (max-width: 600px)': {
      flexDirection: 'column',
      gap: '10px'
    }
  },
  products: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap'
  },
  cardLink: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    width: '100%',
    maxWidth: '600px',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '@media (max-width: 600px)': {
      maxWidth: '100%'
    }
  },
  card: {
    background: '#f8f6ff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '15px',
    width: '100%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    '@media (max-width: 600px)': {
      flexDirection: 'column',
      padding: '10px',
      gap: '10px'
    }
  },
  cardImageContainer: {
    flex: '0 0 200px',
    height: '200px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    '@media (max-width: 600px)': {
      flex: '0 0 150px',
      height: '150px',
      width: '100%'
    }
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    padding: '10px'
  },
  cardContent: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  cardTitle: {
    margin: '0',
    fontSize: '1.8rem',
    color: '#2E1437', // Roxo escuro para o título
    fontWeight: '600'
  },
  cardDescription: {
    margin: '0',
    fontSize: '1.1rem',
    color: '#461E47', // Roxo escuro mais claro para o texto
    opacity: '0.9',
    lineHeight: '1.4'
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};