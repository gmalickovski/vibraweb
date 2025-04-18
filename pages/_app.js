import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { AnaliseProvider } from '../contexts/AnaliseContext';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return; // Verifica se está no lado do cliente
      if (router.pathname === '/login') return;

      try {
        const isAuth = localStorage.getItem('isAuthenticated');
        const authCookie = document.cookie.includes('isAuthenticated=true');

        if (!isAuth && !authCookie) {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router.pathname]);

  return (
    <AnaliseProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#f8f6ff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </Head>
      <Component {...pageProps} />
    </AnaliseProvider>
  );
}

export default MyApp;