import '../styles/globals.css';
import { AnaliseProvider } from '../contexts/AnaliseContext';

function MyApp({ Component, pageProps }) {
  return (
    <AnaliseProvider>
      <Component {...pageProps} />
    </AnaliseProvider>
  );
}

export default MyApp;