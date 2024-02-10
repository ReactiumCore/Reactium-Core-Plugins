declare module '@atomic-reactor/reactium-core/sdk' {
    export const useSyncState: (initialState: any) => any;
    export const useRegister: (name: string, value: any) => void;
    export const useHookComponent: (name: string, component: any) => void;
}