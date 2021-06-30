import Setting from './sdk';
ReactiumBoot.Hook.registerSync(
    'sdk-init',
    SDK => {
        SDK.Setting = Setting;
    },
    ReactiumBoot.Enums.highest,
    'REACTIUM-CORE-SDK-SETTING',
);
