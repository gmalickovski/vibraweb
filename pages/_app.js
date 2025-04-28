import '../styles/globals.css';
import { AnaliseProvider } from '../contexts/AnaliseContext';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <AnaliseProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#f8f6ff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </Head>
      <Component {...pageProps} />
    </AnaliseProvider>
  );
}

export default MyApp;