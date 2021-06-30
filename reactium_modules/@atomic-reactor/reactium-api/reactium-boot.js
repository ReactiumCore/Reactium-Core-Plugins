import API from './sdk';
ReactiumBoot.Hook.registerSync(
    'sdk-init',
    SDK => {
        SDK.API = API;
    },
    ReactiumBoot.Enums.highest,
    'REACTIUM-CORE-SDK-API',
);
