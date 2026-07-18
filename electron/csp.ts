import { session } from 'electron';
import { is } from './env';

/**
 * Applied at the session level rather than a static <meta> tag so it can be strict in packaged
 * builds without breaking Vite's dev-mode HMR (which needs inline scripts / eval / a websocket
 * connection that a locked-down CSP would block). The app never loads remote content, so
 * everything besides 'self' is denied; style-src needs 'unsafe-inline' because the renderer uses
 * React's style={{...}} extensively (those compile to inline style="" attributes).
 */
export function applyContentSecurityPolicy(): void {
  if (is.dev) return;

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none';"
        ]
      }
    });
  });
}
