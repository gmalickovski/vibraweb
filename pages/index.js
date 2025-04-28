import { parse } from 'cookie';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';

export async function getServerSideProps({ req, res }) {
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  if (!cookies.auth_token) {
    // Redireciona para login se não autenticado
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  return { props: {} };
}

export default function Home() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

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
          <div style={styles.logoutContainer}>
            <button 
              onClick={handleLogout}
              className="btn-animated btn-danger"
              style={styles.logoutButton}
            >
              Sair
            </button>
          </div>
        </header>
        <div style={styles.products}>
          <Link 
            href="/analise" 
            style={{...styles.cardLink, ...hoverStyles.cardLink}}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div style={isMobile ? styles.cardMobile : styles.card}>
              {/* Mobile: imagem acima do texto */}
              {isMobile ? (
                <>
                  <div style={styles.cardImageContainerMobile}>
                    <img
                      src="/images/logo-analise-card.png"
                      alt="Análise de Propósito"
                      style={styles.img}
                    />
                  </div>
                  <div style={styles.cardContentMobile}>
                    <h2 style={styles.cardTitle}>Análise de Propósito</h2>
                    <p style={styles.cardDescription}>
                      Descubra o seu potencial por meio da numerologia cabalística.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.cardImageContainer}>
                    <img
                      src="/images/logo-analise-card.png"
                      alt="Análise de Propósito"
                      style={styles.img}
                    />
                  </div>
                  <div style={styles.cardContent}>
                    <h2 style={styles.cardTitle}>Análise de Propósito</h2>
                    <p style={styles.cardDescription}>
                      Descubra o seu potencial por meio da numerologia cabalística.
                    </p>
                  </div>
                </>
              )}
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
    justifyContent: 'flex-end',
    width: '100%',
    padding: '1rem',
    backgroundColor: 'transparent'
  },
  logoutContainer: {
    position: 'absolute',
    top: '1rem',
    right: '1rem'
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  },
  products: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    marginTop: '60px' // Adicionado para afastar o card do topo/botão Sair
  },
  cardLink: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    width: '100%',
    maxWidth: '600px',
    transform: 'translateY(0)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    '@media (max-width: 600px)': {
      width: '95%',
      margin: '0 auto'
    }
  },
  card: {
    background: '#f8f6ff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '20px',
    width: '100%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  cardMobile: {
    background: '#f8f6ff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '15px',
    width: '90%',
    margin: '0 auto',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  cardImageContainer: {
    flex: '0 0 150px',
    height: '150px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  cardImageContainerMobile: {
    width: '80%',
    maxWidth: '180px',
    height: '150px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: '10px'
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    padding: '10px',
    '@media (max-width: 600px)': {
      maxHeight: '180px'
    }
  },
  cardContent: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    textAlign: 'left'
  },
  cardContentMobile: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    textAlign: 'center'
  },
  cardTitle: {
    margin: '0',
    fontSize: '1.8rem',
    color: '#2E1437',
    fontWeight: '600',
    '@media (max-width: 600px)': {
      fontSize: '1.5rem',
      textAlign: 'center',
      width: '100%',
      marginBottom: '5px'
    }
  },
  cardDescription: {
    margin: '0',
    fontSize: '1.1rem',
    color: '#461E47',
    opacity: '0.9',
    lineHeight: '1.4',
    '@media (max-width: 600px)': {
      fontSize: '1rem',
      textAlign: 'center',
      width: '100%'
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