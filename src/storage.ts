export interface Storage {
    readonly getItem: (key: string) => string | null;
    readonly setItem: (key: string, value: string) => void;
    readonly removeItem: (key: string) => void;
}

export const storage = (() => {
    try {
        const key = `__storage__test`;
        window.localStorage.setItem(key, "");
        window.localStorage.removeItem(key);
        window.localStorage.getItem(key);
        return window.localStorage;
    } catch (e) {
        const store = new Map<string, string>();
        console.warn("localStorage is not available :(");
        return {
            getItem: (key: string) => {
                return store.get(key) || null;
            },
            setItem: (key: string, value: string) => {
                store.set(key, value);
            },
            removeItem: (key: string) => {
                store.delete(key);
            },
        };
    }
})();
