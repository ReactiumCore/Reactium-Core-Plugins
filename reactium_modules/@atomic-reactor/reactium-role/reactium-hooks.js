import Reactium from 'reactium-core/sdk';

Reactium.Hook.register(
    'sdk-init',
    async SDK => {
        const { default: Role } = await import('./sdk');
        Reactium.Role = Role;

        // backwards compatibility
        Reactium.Roles = Role;
    },
    Reactium.Enums.highest,
    'REACTIUM-CORE-SDK-ROLE',
);
