import 'fake-indexeddb/auto'

if (typeof globalThis.sessionStorage === 'undefined') {
  const store = new Map<string, string>()
  const storage: Storage = {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      store.set(key, String(value))
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    }
  }
  ;(globalThis as unknown as { sessionStorage: Storage }).sessionStorage = storage
}
