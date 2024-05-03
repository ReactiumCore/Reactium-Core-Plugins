import { useSyncState } from '@atomic-reactor/reactium-core/sdk';
import React, { FC } from 'react';
import { Counter } from './Counter';

export const TsTest: FC<Counter> = ({ count = 0 }) => {
    const state = useSyncState<Counter>({ count });

    return (
        <div>
            <h1>TS Test</h1>
            <p>Count: {state.get<number>('count', 0)}</p>
            <button
                onClick={() => {
                    state.set<number>('count', state.get<number>('count') + 1);
                }}>
                Increment
            </button>
        </div>
    );
};
