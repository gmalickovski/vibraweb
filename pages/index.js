import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    router.push('/login');
  };

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
          <div style={styles.card}>
            <img
              src="/images/analise-proposito.jpg"
              alt="Análise de Propósito"
              style={styles.img}
            />
            <h2>Análise de Propósito</h2>
            <p>Descubra o seu potencial por meio da numerologia cabalística.</p>
            <Link href="/analise">
              <button style={styles.btn}>Iniciar Análise</button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  products: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap'
  },
  card: {
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    width: '100%',
    maxWidth: '350px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  img: {
    width: '100%',
    height: 'auto',
    borderRadius: '4px',
    objectFit: 'cover'
  },
  btn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#D4AF37',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
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