import Role from './sdk';
ReactiumBoot.Hook.registerSync(
    'sdk-init',
    SDK => {
        SDK.Role = Role;

        // backwards compatibility
        SDK.Roles = Role;
    },
    ReactiumBoot.Enums.highest,
    'REACTIUM-CORE-SDK-ROLE',
);
