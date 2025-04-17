import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    // Verifica se já está autenticado
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('isAuthenticated');
      if (isAuth) {
        router.replace('/');
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      localStorage.setItem('isAuthenticated', 'true');
      router.replace('/');
    } else {
      setError('Usuário ou senha inválidos');
    }
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>Login - Vibr@web</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div style={styles.loginBox}>
        <h1 style={styles.title}>vibr@web</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="username">Usuário:</label>
            <input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({...prev, username: e.target.value}))}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password">Senha:</label>
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({...prev, password: e.target.value}))}
              style={styles.input}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'
  },
  loginBox: {
    backgroundColor: 'white',
    padding: '2.5rem',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    margin: '20px'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '2rem',
    fontSize: '2.5rem',
    fontWeight: '700'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  input: {
    padding: '0.75rem',
    border: '2px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    transition: 'border-color 0.3s ease'
  },
  button: {
    padding: '0.75rem',
    backgroundColor: '#D4AF37',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease'
  },
  error: {
    color: '#dc3545',
    textAlign: 'center',
    marginTop: '0.5rem'
  }
};
