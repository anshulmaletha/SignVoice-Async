export function createEventBus() {
  const listeners = new Set()
  function subscribe(callback) {
    listeners.add(callback)
    return () => listeners.delete(callback)
  }
  function emit(payload) {
    for (const callback of listeners) callback(payload)
  }
  return { subscribe, emit }
}
