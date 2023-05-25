import _ from 'underscore';
import op from 'object-path';
import { ComponentEvent } from '@atomic-reactor/reactium-sdk-core';
import { State } from './state';
import cc from 'camelcase';
import { useEffect } from 'react';

export const useDispatcher = ({ props = {}, state = State }) => (type, obj) => {
    obj = _.isObject(obj) ? obj : {};

    const evt = new ComponentEvent(type, obj);
    const cb = op.get(props, cc(`on-${type}`));

    if (_.isFunction(cb)) state.addEventListener(type, cb);
    state.dispatchEvent(evt);
    if (_.isFunction(cb)) state.removeEventListener(type, cb);
};

export const useStateEffect = (handlers = {}, deps) => {
    const unsubs = [];

    // sanitize handlers
    Object.entries(handlers).forEach(([type, cb]) => {
        if (
            typeof cb === 'function' &&
            !Object.values(op.get(State, ['listeners', type], {})).find(
                f => f === cb,
            )
        ) {
            unsubs.push(State.addEventListener(type, cb));
        }
    });

    useEffect(() => {
        return () => {
            unsubs.forEach(unsub => unsub());
        };
    }, deps);
};
