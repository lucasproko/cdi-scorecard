import type { AppProps } from 'next/app';
import Head from 'next/head';

import '../styles/globals.css'; // Path relative to src/pages

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel='icon' href='/favicon.svg' type='image/svg+xml' />
        <link rel='manifest' href='/favicon/site.webmanifest' />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
