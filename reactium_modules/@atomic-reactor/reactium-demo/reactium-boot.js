ReactiumBoot.Hook.register(
    'Server.AppStyleSheets',
    async (req, AppStyleSheets) => {
        AppStyleSheets.register('demo-site-styles', {
            path: '/assets/style/demo-site.css',
        });
    },
);
