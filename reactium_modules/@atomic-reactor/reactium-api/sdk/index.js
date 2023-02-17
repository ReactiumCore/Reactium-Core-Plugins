import SDK from '@atomic-reactor/reactium-sdk-core';
import op from 'object-path';

class APIRegistry extends SDK.Utils.Registry {
    constructor() {
        super('APIRegistry', 'name', SDK.Utils.Registry.MODES.CLEAN);

        if (actiniumAPIEnabled) {
            const { api, config } = require('./actinium');
            this.register({
                name: 'Actinium',
                api,
                config,
            });
        }
    }

    api(name = 'Actinium') {
        const API = op.get(this.get(name), 'api');
        SDK.Hook.runSync('sdk-get-api', name, API);
        return API;
    }

    config(name = 'Actinium') {
        const Config = op.get(this.get(name), 'config');
        SDK.Hook.runSync('sdk-get-api-config', name, Config);
        return Config;
    }
}

const handler = {
    get(target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop === 'string') {
            const reg = /Config$/;
            const [name] = prop.split(reg);
            return reg.test(prop) ? target.config(name) : target.api(name);
        }
    },

    set(target, prop, value = {}) {
        if (prop in target) target[prop] = value;
        else {
            const val = {
                ...value,
                name: prop,
            };
            target.register(val);
        }

        return target;
    },

    has(target, prop) {
        return !!handler.get(target, prop);
    },

    deleteProperty(target, prop) {
        target.unregister(prop);
    },
};

const proxy = new Proxy(new APIRegistry(), handler);

export default proxy;
