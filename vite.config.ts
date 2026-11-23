import { defineConfig, loadEnv, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Adds a Content-Security-Policy to the production page. GitHub Pages can't send custom
 * headers, so it goes in a <meta> tag. Scripts may only come from the site itself, network calls
 * only to the site, localhost (server mode testing) and any VITE_GAME_SERVERS origins.
 * The single-file build inlines its script, so it keeps no script-src restriction beyond that.
 */
function csp(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const servers = (env.VITE_GAME_SERVERS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
    .map(s => new URL(s).origin);
  const single = mode === 'single';
  const policy = [
    "default-src 'none'",
    single ? "script-src 'unsafe-inline'" : "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    ['connect-src', "'self'", 'http://localhost:*', 'http://127.0.0.1:*', ...servers].join(' '),
    "base-uri 'none'",
    "form-action 'none'",
    "object-src 'none'",
  ].join('; ');
  return {
    name: 'lantern-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: () => [
        { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' },
        { tag: 'meta', attrs: { name: 'referrer', content: 'no-referrer' }, injectTo: 'head-prepend' },
      ],
    },
  };
}

// `npm run build` -> dist/ (normal static site, also the Capacitor web dir)
// `npm run build:single` -> dist-single/index.html (one self-contained file for easy sharing)
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [csp(mode), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist', target: 'es2020' },
}));
