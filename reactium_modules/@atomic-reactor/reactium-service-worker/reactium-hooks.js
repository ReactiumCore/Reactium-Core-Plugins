import Reactium, { isBrowserWindow } from 'reactium-core/sdk';

Reactium.Hook.register(
    'sdk-init',
    async SDK => {
        const { default: ServiceWorker } = await import('./sdk');
        Reactium.ServiceWorker = ServiceWorker;
    },
    Reactium.Enums.highest,
    'REACTIUM-CORE-SDK-SERVICE-WORKER',
);

Reactium.Hook.register(
    'service-worker-init',
    async () => {
        if (!isBrowserWindow()) return;
        const { Workbox } = await import('workbox-window');
        const sw = new Workbox(Reactium.ServiceWorker.script, { scope: '/' });
        Reactium.ServiceWorker.worker = sw;

        sw.addEventListener('install', event => {
            console.log('Service Worker installed.');
        });

        sw.addEventListener('waiting', event => {
            console.log('Service Worker waiting to update.');
        });

        sw.addEventListener('activated', event => {
            if (!event.isUpdate) {
                console.log('Service Worker activated.');
            } else {
                console.log('Service Worker updated.');
            }
        });

        sw.addEventListener('controlling', event => {
            console.log('Service Worker captured client connections.');
        });

        try {
            await sw.register();
            console.log('SW registered.');
        } catch (error) {
            console.error({ error });
        }
    },
    Reactium.Enums.priority.highest,
    'sw',
);

Reactium.Hook.register(
    'dependencies-load',
    async () => {
        Reactium.ServiceWorker.init();
    },
    Reactium.Enums.priority.highest,
    'service-worker-init',
);
