import Reactium from 'reactium-core/sdk';

Reactium.Hook.register(
    'sdk-init',
    async SDK => {
        const { default: Setting } = await import('./sdk');
        Reactium.Setting = Setting;
    },
    Reactium.Enums.highest,
    'REACTIUM-CORE-SDK-SETTING',
);
