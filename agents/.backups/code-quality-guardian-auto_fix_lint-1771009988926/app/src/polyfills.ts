// Minimal polyfills to keep Metro/node-side requires from crashing when
// libraries expect `localStorage` (web) to exist during bundling.
// This is intentionally lightweight and only used during development/bundling.
declare const globalThis: any;

if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
    const _store = new Map<string, string>();
    globalThis.localStorage = {
        getItem: (key: string) => {
            return _store.has(key) ? _store.get(key) ?? null : null;
        },
        setItem: (key: string, value: string) => {
            _store.set(key, String(value));
        },
        removeItem: (key: string) => {
            _store.delete(key);
        },
        clear: () => {
            _store.clear();
        },
    } as any;
}

export {};
