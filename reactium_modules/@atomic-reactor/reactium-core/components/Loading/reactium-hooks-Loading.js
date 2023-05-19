/**
 * -----------------------------------------------------------------------------
 * Reactium Plugin Loading
 * -----------------------------------------------------------------------------
 */

import { Loading } from './index';
import Reactium from '@atomic-reactor/reactium-core/sdk';

(async () => {
    Reactium.Component.register('Loading', Loading);
})();
