import './reactium-hooks';

ReactiumBoot.Hook.registerSync(
    'Server.AppBindings',
    (req, AppBindings) => {
        AppBindings.register('DevTools', {
            component: 'DevTools',
        });
    },
    ReactiumBoot.Enums.priority.highest,
    'SERVER-REDUX-TOOLS-BINDING',
);
