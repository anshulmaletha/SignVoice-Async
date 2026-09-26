let counter = 0
export function nextId(prefix = 'msg') {
  counter += 1
  return `${prefix}_${counter}`
}
export function resetIdGenerator() {
  counter = 0
}
