const op = require('object-path');
const proxy = require('http-proxy-middleware');
const { Enums } = ReactiumBoot;

const actiniumAPIEnabled = process.env.ACTINIUM_API_ENABLED !== 'off';
const actiniumProxyEnabled = process.env.PROXY_ACTINIUM_API !== 'off';
const proxyPath = process.env.PROXY_API_PATH || '/api';
const restAPI = process.env.REST_API_URL || `http://localhost:9000${proxyPath}`;
const actiniumAppId = process.env.ACTINIUM_APP_ID || 'Actinium';
const logLevel = process.env.DEBUG === 'on' ? 'debug' : 'error';

ReactiumBoot.Hook.registerSync(
    'Server.AppGlobals',
    (req, AppGlobals) => {
        AppGlobals.register('actiniumAPIEnabled', {
            name: 'actiniumAPIEnabled',
            value: actiniumAPIEnabled,
        });

        AppGlobals.register('actiniumProxyEnabled', {
            name: 'actiniumProxyEnabled',
            value: actiniumProxyEnabled,
        });

        AppGlobals.register('actiniumAppId', {
            name: 'actiniumAppId',
            value: actiniumAppId,
        });

        AppGlobals.register('restAPI', {
            name: 'restAPI',
            value: actiniumProxyEnabled ? proxyPath : restAPI,
            server: restAPI,
        });
    },
    Enums.priority.highest,
    'REACTIUM-CORE-SDK-API-GLOBALS',
);

if (restAPI && actiniumProxyEnabled && proxyPath) {
    ReactiumBoot.Server.Middleware.register('api', {
        name: 'api',
        use: proxy(proxyPath, {
            target: restAPI,
            changeOrigin: true,
            pathRewrite: {
                [`^${proxyPath}`]: '',
            },
            logLevel,
            ws: true,
        }),
        order: Enums.priority.highest,
    });
}

if (restAPI && actiniumProxyEnabled && proxyPath) {
    ReactiumBoot.Server.Middleware.register('api-socket-io', {
        name: 'api-socket-io',
        use: proxy('/actinium.io', {
            target: restAPI.replace(proxyPath, '') + '/actinium.io',
            changeOrigin: true,
            logLevel,
            ws: true,
        }),
        order: Enums.priority.highest,
    });
}
