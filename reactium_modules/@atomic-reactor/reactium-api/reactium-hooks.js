import Reactium from 'reactium-core/sdk';

Reactium.Hook.register(
    'sdk-init',
    async SDK => {
        const { default: API } = await import('./sdk');
        Reactium.API = API;
    },
    Reactium.Enums.highest,
    'REACTIUM-CORE-SDK-API',
);
