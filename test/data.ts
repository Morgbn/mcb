import { MCB } from '../src/index'

const data = [{
  intent: 'greetings.bye',
  utterances: ['goodbye for now', 'bye bye take care', 'okay see you later', 'bye for now', 'i must go'],
  answers: ['Till next time', 'See you soon!']
}, {
  intent: 'greetings.hello',
  utterances: ['hello', 'hi', 'howdy'],
  answers: ['Hey there!', 'Greetings!']
}]

describe('basic', () => {
  it('say bye', () => {
    const bot = new MCB({ data })
    const res: any = bot.process('see you later')
    expect(data[0].answers.includes(res.answer)).toBeTruthy()
  })
})
