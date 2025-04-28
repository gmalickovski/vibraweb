import '../styles/globals.css';
import { AnaliseProvider } from '../contexts/AnaliseContext';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <AnaliseProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Component {...pageProps} />
    </AnaliseProvider>
  );
}

export default MyApp;