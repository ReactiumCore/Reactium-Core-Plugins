import { useSyncState } from '@atomic-reactor/reactium-core/sdk';
import React from 'react';

export const TsTest = () => {
    const state = useSyncState<{ count: number }>({
        count: 0,
    });

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
