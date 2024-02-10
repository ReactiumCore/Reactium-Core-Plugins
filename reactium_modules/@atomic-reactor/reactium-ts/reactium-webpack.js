ReactiumWebpack.Hook.registerSync('before-config', sdk => {
    sdk.addRule(
        'ts-loader',
        {
            test: [/\.tsx?$/],
            use: [
                {
                    loader: 'ts-loader',
                },
            ],
            exclude: /node_modules/,
        },
        10,
    );

    sdk.extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
});
