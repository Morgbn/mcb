import { similarity } from '@nlpjs/similarity'

const reD = '\u0007'
const reM = new RegExp(`${reD}([^${reD}]+)${reD}`, 'g')

export default class MBot {
  constructor (opt) {
    this.entities = opt.entities || {}
    this.data = this.getData(opt.data || [])
    this.dataByUtter = this.data.reduce((o, el) => {
      el.utterances.forEach(u => {
        const d = { ...el, ...u }
        delete d.text
        delete d.utterances
        o[u.text] = d
      })
      return o
    }, {})
    this.steps = []
  }

  /**
   * Pre process data
   * @param {Array} data
   * @returns normalized and implicit/derived data
   */
  getData (data) {
    for (let i = 0; i < data.length; i++) {
      const el = data[i]
      const utters = []
      for (let j = 0; j < el.utterances.length; j++) {
        const derivedUtters = this.getAllDerivedUtters(el.utterances[j])
        for (let k = 0; k < derivedUtters.length; k++) {
          derivedUtters[k].text = this.normalize(derivedUtters[k].text)
          utters.push(derivedUtters[k])
        }
      }
      el.utterances = utters
    }
    return data
  }

  /**
   * Create all derived utterance
   * > if utterance contains an entity, replace it by its spellings
   * > if utterance contains regex, replace it by its name
   * @param {String} utter utterance
   * @returns derived utterance
   */
  getAllDerivedUtters (utter) {
    const utters = [{ text: '', models: [] }]
    const tokens = utter.split(' ')
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i]
      const entity = token[0] === '@' ? token.slice(1) : null
      const entities = this.entities[entity]
      const space = i ? ' ' : ''
      const uLen = utters.length
      if (entities instanceof RegExp) { // RegExp
        token = `${reD}${entity}${reD}`
        for (let k = 0; k < uLen; k++) {
          utters[k].text += space + token
          utters[k].models.push({ entity, type: 'regex' })
        }
      } else if (entities) { // Object
        const derived = Object.entries(entities) // get all ways to write an entity
          .reduce((a, [type, vals]) => [...a, ...vals.map(v => ({ type, text: v }))], [])
        const first = derived.shift()
        for (let k = 0; k < uLen; k++) { // append to each utters
          const cpy = JSON.parse(JSON.stringify(utters[k]))
          utters[k].text += space + first.text
          utters[k].models.push({ entity, type: first.type })
          for (let l = 0; l < derived.length; l++) { // and create new utter if many way to write same entity
            const { text, type } = derived[l]
            utters.push({ text: cpy.text + space + text, models: [...cpy.models, { entity, type }] })
          }
        }
      } else {
        for (let k = 0; k < uLen; k++) {
          utters[k].text += space + token // append all utters with next word
        }
      }
    }
    return utters
  }

  /**
   * Process utterance and get answer
   * @param {String} text utterance
   * @returns {String} answer
   */
  process (text) {
    let context = this.getContext()
    const possibleUtters = []
    this.data.forEach((d) => {
      if (!d.cond || d.cond(context)) {
        d.utterances.forEach(u => possibleUtters.push(u.text))
      }
    })
    const { match, models } = this.bestMatch(text, possibleUtters)
    if (!match) { return {} }
    const { answers, intent } = this.dataByUtter[match]
    context = this.getContext({ answers, intent, models })
    this.steps.push(intent)
    const okAnswers = answers.filter(a => !a.cond || a.cond(context))
    const nAnswers = okAnswers.length || 0
    const i = nAnswers > 1 ? Math.floor(Math.random() * nAnswers) : 0
    const txtAnswer = okAnswers[i]
    const answer = typeof txtAnswer === 'string'
      ? txtAnswer
      : typeof txtAnswer === 'function'
        ? txtAnswer(context)
        : typeof txtAnswer.answer === 'function'
          ? txtAnswer.answer(context)
          : txtAnswer.answer
    return { ...context, answer }
  }

  /**
   * Get context for answers
   * @param {Object} o base object
   * @returns {Object} context
   */
  getContext (o = {}) {
    const data = {}
    if (o.models) {
      const iByEntity = {}
      for (let i = 0; i < o.models.length; i++) {
        const { entity, type, val } = o.models[i]
        iByEntity[entity] = (iByEntity[entity] ?? -1) + 1
        if (type !== 'regex') {
        data[entity] = type
        data[`${entity}${iByEntity[entity]}`] = type
        }
        data[`${entity}_val`] = val
        data[`${entity}${iByEntity[entity]}_val`] = val
      }
    }
    return {
      ...o,
      ...data,
      steps: [...this.steps],
      lastStep: this.steps.slice(-1)[0]
    }
  }

  /**
   * Normalize a text
   * @param {String} text
   * @returns normalized text
   */
  normalize (text) {
    return text.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  }

  /**
   * Compare utterances and find the best match
   * @param {String} text utterance
   * @param {Array} utterances utterances recorded in the chatbot
   * @param {Number} min minimum levenshtein distance
   * @returns {Object} match info
   */
  bestMatch (text, utterances, min = 10) {
    text = this.normalize(text)
    let matches = []
    const dataForReUtter = {}
    for (let i = 0; i < utterances.length; i++) {
      let utter = utterances[i]
      if (utter.includes(reD)) { // have regex(es)
        const reNames = utter.match(reM)
        const reExtracted = this.extractRe(text, reNames) // get matches
        if (!reExtracted || reExtracted.length < reNames.length) { continue }
        const old = utter
        // replace regex by match
        for (let i = 0; i < reExtracted.length; i++) {
          const { val, entity } = reExtracted[i]
          utter = utter.replace(`${reD}${entity}${reD}`, val)
        }
        dataForReUtter[utter] = { utter: old, reExtracted }
      }
      const dist = similarity(text, utter)
      if (min > dist) {
        min = dist
        matches = [utter]
      } else if (min === dist) {
        matches.push(utter)
      }
    }
    // console.log(`[min=${min}] bestMatch(es) for [${text}] are :`, matches)
    // check entities
    for (let i = 0; i < matches.length; i++) {
      let match = matches[i]
      let extracted = []
      const { utter, reExtracted } = dataForReUtter[match] || {}
      if (utter) {
        match = utter
        extracted = reExtracted
      }
      const { models } = this.dataByUtter[match]
      if (!models.length) { return { match } }
      const otherModels = models.filter(m => m.type !== 'regex')
      extracted = [...extracted, ...this.extractModels(text, otherModels)]
      extracted = this.correctExtracted(extracted, models)
      if (extracted) {
        return { match, models: extracted }
      }
    }
    return {}
  }

  /**
   * Find models/entities in utterance
   * @param {String} txt utterance
   * @param {Array} models list of models to find
   * @returns {Array} list of models found
   */
  extractModels (txt, models) {
    const maxDist = [0, 0, 0, 0, 1, 1, 2, 2]
    let r = []
    const tokens = txt.split(' ')
    const len = tokens.length
    models = models.map(m => ({ ...m, derived: this.entities[m.entity][m.type] }))
    while (models.length) {
      const { entity, type, derived } = models.shift()
      for (let i = 0; i < len; i++) {
        for (let j = i; j < len; j++) {
          const val = tokens.slice(i, j + 1).join(' ')
          const from = txt.indexOf(val)
          const to = from + val.length
          const matches = []
          const max = maxDist[val.length] ?? 3
          derived.forEach((utter) => {
            const dist = similarity(val, utter)
            if (dist <= max) { matches.push({ entity, type, val, from, to, dist }) }
          })
          r = [...r, ...matches]
        }
      }
    }
    return r
  }

  /**
   * Find regex models/entities in utterance
   * @param {String} txt utterance
   * @param {Array} reNames list of regex names
   * @returns {Array} list of models found
   */
  extractRe (txt, reNames) {
    let r = []
    let match
    reNames = [...new Set(reNames)]
    for (let i = 0; i < reNames.length; i++) {
      const entity = reNames[i].slice(1, -1)
      const re = this.entities[entity]
      re.lastIndex = 0 // reset lastIndex
      if (!re) { return null }
      const r2 = []
      while ((match = re.exec(txt)) !== null) {
        const val = match[0]
        r2.push({ entity, type: 'regex', val, from: match.index, to: match.index + val.length - 1, dist: 0 })
      }
      if (!r2.length) { return null }
      r = [...r, ...r2]
    }
    return r.sort((a, b) => a.from - b.from)
  }

  /**
   * Check and correct the order of the models found
   * @param {Array} extracted list of models found
   * @param {Array} models list of models to find
   * @returns {Array} ordered list
   */
  correctExtracted (extracted, models) {
    const r = []
    const mo = [...models]
    let ex = [...extracted]
    let oldEx = null
    let prev = null
    while (mo.length) {
      const m = mo.shift()
      // find best match dist for model
      const match = this.findBestModel(m, ex)
      if (match) {
        r.push(match)
        ex = ex.filter(e => e.from >= match.to)
      } else {
        // if not find, reverse last step, rm prev match
        const last = r.pop()
        if (!last) { return null }
        mo.unshift(m)
        mo.unshift(prev)
        const strLast = JSON.stringify(last) // rm prev match
        ex = oldEx.filter(e => JSON.stringify(e) !== strLast)
      }
      oldEx = [...ex]
      prev = m
    }
    return r
  }

  /**
   * Find first matching model
   * @param {Object} model
   * @param {String} model.entity
   * @param {String} model.type
   * @param {Array} extracted list of models found
   * @returns {Object} model found
   */
  findBestModel ({ entity, type }, extracted) {
    let min = Infinity
    let match = null
    for (let i = 0; i < extracted.length; i++) {
      const el = extracted[i]
      if (el.dist < min && el.type === type && el.entity === entity) {
        min = el.dist
        match = el
      } // no ==, 1st = best
    }
    return match
  }
}