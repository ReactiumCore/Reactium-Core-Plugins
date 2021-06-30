import Reactium from 'reactium-core/sdk';
import op from 'object-path';

Reactium.Hook.register(
    'sdk-init',
    async SDK => {
        const { default: Capability } = await import('./sdk');
        Reactium.Capability = Capability;
    },
    Reactium.Enums.highest,
    'REACTIUM-CORE-SDK-CAPABILITY',
);

Reactium.Hook.register(
    'capability-check',
    async (capabilities = [], strict = true, context) => {
        const permitted = await Reactium.Capability.check(capabilities, strict);
        op.set(context, 'permitted', permitted);
    },
    Reactium.Enums.priority.highest,
);
