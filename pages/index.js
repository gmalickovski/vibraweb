import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = localStorage.getItem('isAuthenticated');
        const authCookie = document.cookie.includes('isAuthenticated=true');
        
        if (!isAuth && !authCookie) {
          router.replace('/login');
          return;
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.replace('/login');
      }
    };

    checkAuth();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    document.cookie = 'isAuthenticated=false; path=/';
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

  const hoverStyles = isHovered ? {
    cardLink: {
      transform: 'translateY(-8px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
    },
    card: {
      background: '#f0ebff',
      borderColor: '#D4AF37',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }
  } : {};

  return (
    <>
      <Head>
        <title>Dashboard - vibr@web</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div style={styles.container}>
        <header style={styles.header}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Sair
          </button>
        </header>
        <div style={styles.products}>
          <Link 
            href="/analise" 
            style={{...styles.cardLink, ...hoverStyles.cardLink}}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div style={{...styles.card, ...hoverStyles.card}}>
              <div style={{
                ...styles.cardImageContainer,
                ...(isMobile ? mobileStyles.cardImageContainer : {})
              }}>
                <img
                  src="/images/logo-analise-card.png"
                  alt="Análise de Propósito"
                  style={styles.img}
                />
              </div>
              <div style={{
                ...styles.cardContent,
                ...(isMobile ? mobileStyles.cardContent : {})
              }}>
                <h2 style={{
                  ...styles.cardTitle,
                  ...(isMobile ? mobileStyles.cardTitle : {})
                }}>Análise de Propósito</h2>
                <p style={{
                  ...styles.cardDescription,
                  ...(isMobile ? mobileStyles.cardDescription : {})
                }}>Descubra o seu potencial por meio da numerologia cabalística.</p>
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
    transform: 'translateY(0)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer'
  },
  card: {
    background: '#f8f6ff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '15px',
    width: '100%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  cardImageContainer: {
    flex: '0 0 200px',
    height: '200px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
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
    gap: '10px',
    textAlign: 'left'
  },
  cardTitle: {
    margin: '0',
    fontSize: '1.8rem',
    color: '#2E1437',
    fontWeight: '600',
    '@media screen and (max-width: 600px)': {
      fontSize: '1.5rem',
      textAlign: 'center'
    }
  },
  cardDescription: {
    margin: '0',
    fontSize: '1.1rem',
    color: '#461E47',
    opacity: '0.9',
    lineHeight: '1.4',
    '@media screen and (max-width: 600px)': {
      fontSize: '1rem',
      textAlign: 'center'
    }
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

const mobileStyles = {
  card: {
    flexDirection: 'column',
    padding: '15px',
    gap: '15px'
  },
  cardImageContainer: {
    width: '100%',
    maxWidth: '250px',
    marginBottom: '10px'
  },
  cardContent: {
    width: '100%',
    alignItems: 'center',
    textAlign: 'center'
  },
  cardTitle: {
    fontSize: '1.5rem',
    textAlign: 'center'
  },
  cardDescription: {
    fontSize: '1rem',
    textAlign: 'center'
  }
};