import Reactium from 'reactium-core/sdk';

Reactium.Hook.register(
    'sdk-init',
    async SDK => {
        const { default: User } = await import('./sdk');
        Reactium.User = User;
    },
    Reactium.Enums.highest,
    'REACTIUM-CORE-SDK-USER',
);
