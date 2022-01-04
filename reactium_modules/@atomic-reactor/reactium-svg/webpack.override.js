module.exports = config => {
    const newWebpackConfig = Object.assign({}, config);

    newWebpackConfig.module.rules.push({
        test: /\.svg$/i,
        use: ['@svgr/webpack'],
    });

    return newWebpackConfig;
};
