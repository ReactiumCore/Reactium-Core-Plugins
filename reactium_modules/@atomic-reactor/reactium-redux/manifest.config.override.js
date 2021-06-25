const op = require('object-path');

module.exports = manifestConfig => {
    // provide redux externals
    op.set(manifestConfig, 'pluginExternals.redux', {
        externalName: 'redux',
        requirePath: 'redux',
    });

    op.set(manifestConfig, 'pluginExternals.redux-super-thunk', {
        externalName: 'redux-super-thunk',
        requirePath: 'redux-super-thunk',
    });

    manifestConfig.patterns.push({
        name: 'allActions',
        type: 'actions',
        pattern: /actions.jsx?$/,
        ignore: /\.cli/,
    });

    manifestConfig.patterns.push({
        name: 'allActionTypes',
        type: 'actionTypes',
        pattern: /actionTypes.jsx?$/,
    });

    manifestConfig.patterns.push({
        name: 'allReducers',
        type: 'reducers',
        pattern: /reducers.jsx?$/,
    });

    manifestConfig.patterns.push({
        name: 'allInitialStates',
        type: 'state',
        pattern: /state.jsx?$/,
    });

    manifestConfig.patterns.push({
        name: 'allMiddleware',
        type: 'middleware',
        pattern: /middleware.jsx?$/,
        ignore: /server\/middleware/,
    });

    manifestConfig.patterns.push({
        name: 'allEnhancers',
        type: 'enhancer',
        pattern: /enhancer.jsx?$/,
    });

    return manifestConfig;
};
