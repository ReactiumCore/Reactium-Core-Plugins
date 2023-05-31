import {
    useSyncState,
    useStateEffect,
    State,
    useRouteParams,
    Hook,
} from '@atomic-reactor/reactium-core/sdk';
import React from 'react';

/**
 * -----------------------------------------------------------------------------
 * Component: StateLoader
 * -----------------------------------------------------------------------------
 */
export const StateLoader = ({ className }) => {
    const { type } = useRouteParams();
    const state = useSyncState({ content: 'StateLoader' });

    useStateEffect({
        'state-load-one': () => state.set('event', 'one'),
        'state-load-two': () => state.set('event', 'two'),
        'state-load-three': () => state.set('event', 'three'),
    });

    console.log({ type });
    return (
        <div className={className}>
            {state.get('event') && (
                <div className='event-loaded'>
                    Event state-load-{state.get('event')}
                </div>
            )}

            <div className='event-loaded'>
                Data data.{type}: {State.get(['data', type])}
            </div>

            {type === 'two' && (
                <button onClick={() => State.dispatch('trigger-two')}>
                    Trigger 2
                </button>
            )}

            {type === 'three' && (
                <button onClick={() => Hook.run('trigger-three')}>
                    Trigger 3
                </button>
            )}
        </div>
    );
};

StateLoader.defaultProps = {
    className: 'stateloader',
};

export default StateLoader;
