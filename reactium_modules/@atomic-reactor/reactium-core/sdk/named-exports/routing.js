import uuid from 'uuid/v4';
import { useEffect } from 'react';
import Routing from '../routing';
import { useSyncState } from '@atomic-reactor/reactium-sdk-core';
import _ from 'underscore';

export const useRouting = () => {
    const routing = useSyncState({
        current: Routing.currentRoute,
        previous: Routing.previousRoute,
        active: Routing.currentRoute,
        transitionState: Routing.transitionState || 'READY',
        transitionStates: Routing.transitionStates || [],
        changes: Routing.changes || {},
    });

    const handler = (updates, forceRefresh = true) => {
        routing.set(updates, undefined, forceRefresh);
    };

    const refreshFromRouting = () => {
        const {
            active: activeLabel = 'current',
            currentRoute,
            previousRoute,
            transitionState = 'READY',
            transitionStates = [],
            changes,
        } = Routing;

        const active =
            activeLabel === 'previous' ? previousRoute : currentRoute;

        handler(
            {
                current: currentRoute,
                previous: previousRoute,
                active,
                transitionState,
                transitionStates,
                changes,
            },
            false,
        );
    };

    useEffect(() => {
        const id = uuid();
        Routing.routeListeners.register(id, { handler });
        refreshFromRouting();

        return () => {
            Routing.routeListeners.unregister(id);
        };
    }, []);

    return routing;
};

/**
 * @api {ReactHook} useDoesMatchPath(pattern) useDoesMatchPath
 * @apiName useDoesMatchPath
 * @apiGroup ReactHook
 * @apiDescription Hook to get true or false value based on a pattern if the current path matches the current React route. Useful when the component your are using
 * this hook in is a deep child or sibling of the routed component.
 * @apiParam  {Mixed} pattern regex, string constructor argument of RegExp, or function getting current routed matched path, and returning boolean
 * @apiParam  {Array} [where] array object-path from useRouting() to the active path, defaults to `['active', 'match', 'match', 'path']`
 */
export const useDoesMatchPath = (
    pattern,
    where = ['active', 'match', 'match', 'path'],
) => {
    const routing = useRouting();
    const path = [..._.compact(_.flatten([where]))];

    const what = routing.get(path);

    if (_.isRegExp(pattern)) {
        return pattern.test(what);
    } else if (_.isString(pattern)) {
        return new RegExp(pattern).test(what);
    } else if (_.isFunction(pattern)) {
        return pattern(what);
    }
};

/**
 * @api {ReactHook} useRouteParams(pattern) useRouteParams
 * @apiName useRouteParams
 * @apiGroup ReactHook
 * @apiDescription Hook to get the current route params, if the current route is a parameterized route.
 */
export const useRouteParams = () => {
    const routing = useRouting();
    return routing.get('active.match.match.params');
};
