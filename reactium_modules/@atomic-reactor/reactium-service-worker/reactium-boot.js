ReactiumBoot.Hook.registerSync('Server.AppGlobals', (req, AppGlobals) => {
    AppGlobals.register('loadServiceWorker', {
        name: 'loadServiceWorker',
        value:
            process.env.NODE_ENV !== 'development' ||
            process.env.LOAD_SERVICE_WORKER === 'true',
    });
});
