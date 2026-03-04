/**
 * Angular dev-server proxy configuration (JS format required for onProxyRes).
 *
 * /api  → api.toprec.gov.ng  (standard API calls)
 * /uploads → api.toprec.gov.ng  (static profile images)
 *
 * The backend sends `Cross-Origin-Resource-Policy: same-origin` on ALL
 * responses. When the browser fetches an image directly from
 * api.toprec.gov.ng (a different origin), it blocks the load with
 * ERR_BLOCKED_BY_RESPONSE.NotSameOrigin even on a 200 response.
 *
 * Routing /uploads through this proxy makes the response appear to come
 * from localhost (same-origin), so the CORP policy is satisfied. We also
 * explicitly delete the header so there is no ambiguity.
 *
 * Production note: configure nginx with:
 *   location /uploads {
 *       proxy_pass https://api.toprec.gov.ng;
 *       proxy_set_header Host api.toprec.gov.ng;
 *       proxy_hide_header Cross-Origin-Resource-Policy;
 *       add_header Cross-Origin-Resource-Policy cross-origin always;
 *   }
 */
module.exports = {
    '/api': {
        target: 'https://api.toprec.gov.ng',
        secure: false,
        changeOrigin: true,
        logLevel: 'debug'
    },
    '/uploads': {
        target: 'https://api.toprec.gov.ng',
        secure: false,
        changeOrigin: true,
        logLevel: 'debug',
        onProxyRes: function (proxyRes) {
            // Remove the server-side CORP header so the browser does not
            // block the image when loaded through the same-origin proxy.
            delete proxyRes.headers['cross-origin-resource-policy'];
        }
    }
};
