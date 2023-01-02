import Reactium from 'reactium-core/sdk';

Reactium.Hook.register(
    'sdk-init',
    async () => {
        try {
            const { default: API } = await import('./sdk');
            Reactium.API = API;
        } catch (err) {
            console.log(err);
        }
    },
    Reactium.Enums.highest,
    'REACTIUM-CORE-SDK-API',
);
