const op = require('object-path');
module.exports = data => {
    const externals = Object.values(
        op.get(data, 'manifestConfig.pluginExternals', {}),
    ).map(external => {
        const { externalName, requirePath } = external;

        if (/^\/.*\/i?$/.test(externalName))
            return {
                ...external,
                externalName: requirePath,
                requirePath,
            };

        return external;
    });

    const externalAliases = externals.filter(
        ({ defaultAlias }) => defaultAlias,
    );

    return {
        externals,
        externalAliases,
    };
};
