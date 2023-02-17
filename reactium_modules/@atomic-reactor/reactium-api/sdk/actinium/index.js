import apiConfig from './config';
import Parse from 'parse';

let Actinium = Parse;

if (Actinium) {
    if (apiConfig.actiniumAppId) {
        Actinium.initialize(apiConfig.actiniumAppId);
    } else {
        if (apiConfig.parseAppId) {
            Actinium.initialize(apiConfig.parseAppId);
        }
    }

    Actinium.serverURL = apiConfig.restAPI;

    const { host, protocol } = location;

    // on windows, this compiles incorrectly, so use the distribution version
    const { io } = require('socket.io-client/dist/socket.io.js');

    // proxied through express
    let ioURL = `${protocol}//${host}${restAPI}`;
    Actinium.liveQueryServerURL = `${
        protocol === 'http:' ? 'ws:' : 'wss:'
    }//${host}${restAPI}`;

    // direct connection (not proxied through express)
    if (/^http/.test(apiConfig.restAPI)) {
        const API = new URL(apiConfig.restAPI);
        ioURL = API.toString();
        API.protocol = API.protocol === 'http:' ? 'ws:' : 'wss:';
        Actinium.liveQueryServerURL = API.toString();
    }

    ioURL = ioURL.replace('/api', '');
    Actinium.IO = io(ioURL, {
        path: '/actinium.io',
        autoConnect: false,
        transports: ['polling'],
    });

    Actinium.LiveQuery.on('open', () => {
        console.log('Actinium LiveQuery connection established');
    });
}

export const api = Actinium;
export const config = apiConfig;
