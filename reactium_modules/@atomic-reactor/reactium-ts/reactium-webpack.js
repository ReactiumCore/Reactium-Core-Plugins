const path = require('path');
const { Hook } = require('@atomic-reactor/reactium-sdk-core/core');

const tsLoaderOptionsOverrides = {};

Hook.registerSync('before-config', sdk => {
    Hook.runSync('ts-loader-options', tsLoaderOptionsOverrides);

    sdk.addRule(
        'ts-loader',
        {
            test: [/\.tsx?$/],
            use: [
                {
                    loader: 'ts-loader',
                    options: {
                        configFile: path.resolve(__dirname, 'tsconfig.json'),
                        ...tsLoaderOptionsOverrides,
                    },
                },
            ],
            exclude: /node_modules/,
        },
        10,
    );

    sdk.extensions = ['.ts', '.tsx'];
});
