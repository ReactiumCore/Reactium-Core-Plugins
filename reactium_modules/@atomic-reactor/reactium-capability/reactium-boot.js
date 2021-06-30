import Capability from './sdk';
ReactiumBoot.Hook.registerSync(
    'sdk-init',
    SDK => {
        SDK.Capability = Capability;
    },
    ReactiumBoot.Enums.highest,
    'REACTIUM-CORE-SDK-CAPABILITY',
);
