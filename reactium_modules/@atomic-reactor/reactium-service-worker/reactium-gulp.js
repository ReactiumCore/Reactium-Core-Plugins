const workbox = require('workbox-build');
const fs = require('fs-extra');

const serviceWorker = config => () => {
    let method = 'generateSW';
    let swConfig = {
        ...config.sw,
    };

    if (!fs.existsSync(config.umd.defaultWorker)) {
        console.log('Skipping service worker generation.');
        return Promise.resolve();
    }

    method = 'injectManifest';
    swConfig.swSrc = config.umd.defaultWorker;
    delete swConfig.clientsClaim;
    delete swConfig.skipWaiting;

    return workbox[method](swConfig)
        .then(({ warnings }) => {
            // In case there are any warnings from workbox-build, log them.
            for (const warning of warnings) {
                console.warn(warning);
            }
            console.log('Service worker generation completed.');
        })
        .catch(error => {
            console.warn('Service worker generation failed:', error);
        });
};

(() => {
    ReactiumGulp.Hook.registerSync('tasks', (GulpRegistry, config) => {
        const task = serviceWorker(config);

        GulpRegistry.register('serviceWorker', {
            task,
        });
    });
})();
