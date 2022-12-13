import { MCB, btwEntity } from '../src/index'

describe('entities', () => {
  it('works with models', () => {
    const entities = {
      hero: {
        spiderman: ['spiderman', 'spider-man'],
        ironman: ['ironman', 'iron-man'],
        thor: ['thor']
      },
      food: {
        burguer: ['Burguer'],
        pizza: ['Pizza'],
        pasta: ['Spaghetti', 'Pasta']
      }
    }
    const data = [{
      intent: 'sawhero',
      utterances: [
        'I saw @hero eating @food',
        'I have seen @hero, he was eating @food'
      ],
      answers: [d => `You saw ${d.hero} eating ${d.food}`]
    }, {
      intent: 'wanteat',
      utterances: ['I want to eat @food'],
      answers: [d => `You want ${d.food_val}`]
    }]
    const bot = new MCB({ data, entities })
    const res: any = bot.process('I saw spider-man eating spaghetti today !')
    expect(res.answer).toBe('You saw spiderman eating pasta')
  })

  it('works with regex like "/\\d+/gi"', () => {
    const entities = { number: /\d+/gi }
    const data = [{
      intent: 'add',
      utterances: ['@number + @number'],
      answers: [d => `= ${parseInt(d.number0_val) + parseInt(d.number1_val)}`]
    }]
    const bot = new MCB({ data, entities })
    const res: any = bot.process('10 + 12')
    expect(res.answer).toBe('= 22')
  })

  it('works with regex like email regex', () => {
    const entities = { number: /\d+/gi, email: /(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})/gi }
    const data = [{
      intent: 'getEmail',
      utterances: ['My email is @email', 'This is my email: @email', '@email is my email address'],
      answers: [d => `Your email is ${d.email_val}`]
    }]
    const bot = new MCB({ data, entities })
    const res: any = bot.process('My email address is test@test.com')
    expect(res.answer).toBe('Your email is test@test.com')
  })

  it('works with btwEntity (slot filling)', () => {
    const entities = {
      city: /(?:[\p{Letter}\p{Mark}]+(?:. |-| |'))*[\p{Letter}\p{Mark}]+/gu,
      fromCity: btwEntity('fromCity', ['from'], [' to ', ' the ', '']),
      toCity: btwEntity('toCity', ['to'], [' from ', ' the ', ''])
    }
    const data = [{
      intent: 'travel info',
      utterances: ['I want to travel'],
      answers: [d => 'Nice !']
    }, {
      intent: 'travel full',
      utterances: ['I want to travel from @fromCity to @toCity', 'I want to travel to @toCity from @fromCity'],
      answers: [d => `🛫[${d.fromCity_val}] - 🛬[${d.toCity_val}]`]
    }]
    const bot = new MCB({ data, entities })
    const res: any = bot.process('I want to travel to London from Paris')
    expect(res.answer).toBe('🛫[Paris] - 🛬[London]')
  })
})
