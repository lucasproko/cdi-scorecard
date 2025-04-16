import type { AppProps } from 'next/app';

import '../styles/globals.css'; // Path relative to src/pages

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
