import { useSyncState } from '@atomic-reactor/reactium-core/sdk';
import React, { FC } from 'react';

export type Counter = { count: number };

export const TsTest: FC<Counter> = (props = { count: 0 }) => {
    const state = useSyncState<Counter>(props);

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
