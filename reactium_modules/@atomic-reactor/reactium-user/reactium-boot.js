import User from './sdk';
ReactiumBoot.Hook.registerSync(
    'sdk-init',
    SDK => {
        SDK.User = User;
    },
    ReactiumBoot.Enums.highest,
    'REACTIUM-CORE-SDK-USER',
);
