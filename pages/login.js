import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Aguardar um momento para garantir que o cookie foi definido
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      } else {
        setError(data.error || 'Credenciais inválidas');
      }
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - vibr@web</title>
      </Head>
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <div style={styles.logoContainer}>
            <h1 style={styles.logo}>vibr@web</h1>
          </div>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && <div style={styles.error}>{error}</div>}
            
            <div style={styles.inputGroup}>
              <label htmlFor="username">Usuário</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                required
                disabled={isLoading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              style={styles.button}
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#faf7f2'
  },
  loginBox: {
    width: '100%',
    maxWidth: '400px',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  logo: {
    fontSize: '2.5rem',
    color: '#2D1B4E',
    margin: 0
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
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    transition: 'border-color 0.3s ease',
    '&:focus': {
      borderColor: '#2D1B4E',
      outline: 'none'
    }
  },
  button: {
    padding: '0.75rem',
    backgroundColor: '#E67E22',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: '#d35400'
    },
    '&:disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    }
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    padding: '0.5rem',
    backgroundColor: '#fde8e8',
    borderRadius: '4px'
  }
};

// Marca esta página como pública
Login.public = true;
