import SDK from '@atomic-reactor/reactium-sdk-core';
const { Hook } = SDK;

class ServiceWorker {
    constructor() {
        this.script = '/assets/js/sw/sw.js';
    }

    set script(path) {
        this.scriptPath = path;
    }

    get script() {
        return this.scriptPath;
    }

    set worker(wb) {
        this.wb = wb;
    }

    get worker() {
        return this.wb;
    }

    init = async () => {
        /**
         * @api {Hook} service-worker-init service-worker-init
         * @apiName service-worker-init
         * @apiDescription Called after dependencies-load in Reactium.ServiceWorker to register any webapp
         service worker code for the app. By default, this hook is implemented to
         register the customizable Google Workbox implementation that will be compiled (to /assets/js/sw/sw.js).
         Also, async loads and instantiates a
         a google workbox-window Workbox object on Reactium.ServiceWorker.worker.
         async only - used in front-end webapp only
         * @apiGroup Hooks
         */
        await Hook.run('service-worker-init');
    };

    async version() {
        const worker = this.worker;
        return (
            worker &&
            worker.messageSW &&
            worker.messageSW({
                type: 'GET_VERSION',
            })
        );
    }
}

const swManager = new ServiceWorker();

export default swManager;
