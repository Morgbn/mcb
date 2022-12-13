import { MCB } from '../src/index'

const data = [{
  intent: 'bye',
  utterances: ['goodbye', 'bye bye take care', 'okay see you later', 'bye for now', 'i must go'],
  answers: ['Till next time', 'See you soon!'],
  cond: d => d.lastStep === 'hello'
}, {
  intent: 'hello',
  utterances: ['hello', 'hi', 'howdy'],
  answers: ['Hey there!', 'Greetings!']
}]

describe('cond', () => {
  it('prevent match if the condition is false', () => {
    const bot = new MCB({ data })
    const res: any = bot.process('see you later')
    expect(res.answer).toBe(null)
  })

  it('works if the condition is true', () => {
    const bot = new MCB({ data })
    bot.process('hi')
    const res: any = bot.process('see you later')
    expect(res.intent).toBe('bye')
  })
})
