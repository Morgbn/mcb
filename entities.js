export function reEntity (entity, re) {
  return (txt) => {
    let match
    const r = []
    while ((match = re.exec(txt)) !== null) {
      const val = match[0]
      r.push({ entity, val, from: match.index, to: match.index + val.length - 1, dist: 0 })
    }
    return r
  }
}

const findIndex = (str, opts, firstIndex) => {
  const func = firstIndex ? 'indexOf' : 'lastIndexOf'
  const r = { index: -1, text: null }
  for (let i = 0; i < opts.length && r.index === -1; i++) {
    r.text = opts[i]
    r.index = str[func](r.text)
  }
  return r
}

export function btwEntity (entity, fromOpts, toOpts, firstIndex) {
  return (txt) => {
    const { index: from, text } = findIndex(txt, fromOpts, firstIndex)
    if (from === -1) { return [] }
    const endFrom = from + text.length
    const { index: to } = findIndex(txt.slice(endFrom), toOpts, firstIndex)
    if (to === -1) { return [] }
    const val = txt.slice(endFrom, endFrom + to).trim()
    return [{ entity, val, from, to, dist: 0 }]
  }
}
