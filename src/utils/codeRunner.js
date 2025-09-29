// Very simple JS runner for demo purposes only. Executes in the same thread.
// Captures console.log output; returns { output, error }.
export function runJavaScript(code) {
  const logs = []
  const originalLog = console.log
  try {
    console.log = (...args) => { logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')) }
    // eslint-disable-next-line no-new-func
    const fn = new Function(code)
    const result = fn()
    const output = [...logs, result !== undefined ? String(result) : ''].filter(Boolean).join('\n')
    return { output }
  } catch (e) {
    return { error: e?.message || String(e) }
  } finally {
    console.log = originalLog
  }
}