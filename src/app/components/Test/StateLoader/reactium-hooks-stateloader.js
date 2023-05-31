/**
 * -----------------------------------------------------------------------------
 * Reactium Plugin StateLoader
 * -----------------------------------------------------------------------------
 */
(async () => {
    const { Hook, Enums, Component, State } = await import(
        '@atomic-reactor/reactium-core/sdk'
    );

    State.registerDataLoader({
        eventType: 'state-load-one',
        path: 'data.one',
        callback: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'data one';
        },
        loadAt: {
            route: '/state/one',
        },
    });

    State.registerDataLoader({
        eventType: 'state-load-two',
        path: 'data.two',
        callback: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'data two';
        },
        loadAt: {
            event: 'trigger-two',
        },
    });

    State.registerDataLoader({
        eventType: 'state-load-three',
        path: 'data.three',
        callback: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'data three';
        },
        loadAt: {
            hook: 'trigger-three',
        },
    });

    Hook.register(
        'plugin-init',
        async () => {
            const { StateLoader } = await import('./StateLoader');
            Component.register('StateLoader', StateLoader);
        },
        Enums.priority.normal,
        'plugin-init-StateLoader',
    );
})();
