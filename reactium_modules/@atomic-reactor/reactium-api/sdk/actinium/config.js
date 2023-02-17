export default {
    // [browser]: actinium app id provided by window
    // since 3.2.6
    actiniumAppId: window.actiniumAppId || 'Actinium',

    // [browser]: parse app id provided by window
    // deprecated 3.2.6
    parseAppId: window.parseAppId || 'Actinium',

    // [browser]: REST API base url provided by window
    // if /api default, proxies to REST_API_URL
    restAPI: window.restAPI || '/api',
};
