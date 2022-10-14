import bench from 'nanobench'
import Bot from './index.js'
import { btwEntity } from './entities.js'

const endAnswerTravel = (cityA, cityB, d) => { // helper from intent travel4 and travel5
  const cap = c => c.charAt(0).toUpperCase() + c.slice(1)
  const date = new Date(d).toLocaleDateString('en-US')
  return `You want to travel from ${cap(cityA)} to ${cap(cityB)} the ${date}`
}

const data = [{
  intent: 'travel1',
  utterances: ['I want to travel'],
  answers: ['Where do you want to go?']
}, {
  intent: 'travel2',
  utterances: ['to @city'],
  answers: ['From where you are traveling?'],
  cond: d => d.lastStep === 'travel1'
}, {
  intent: 'travel3',
  utterances: ['from @city'],
  answers: ['When do you want to travel?'],
  cond: d => d.lastStep === 'travel2'
}, {
  intent: 'travel4',
  utterances: ['tomorrow', 'the @date'],
  answers: [d => endAnswerTravel(d.history.travel2.city_val, d.history.travel3.city_val, d.date_val)],
  cond: d => d.lastStep === 'travel3'
}, {
  intent: 'travel5',
  utterances: ['I want to travel from @fromCity to @toCity at @date', 'I want to travel to @toCity from @fromCity at @date'],
  answers: [d => endAnswerTravel(d.fromCity_val, d.toCity_val, d.date_val)]
}, {
  intent: 'test1',
  utterances: ['My fav one is @model with @model'],
  answers: [d => `> ${d.model0_val} + ${d.model1_val}`]
}, {
  intent: 'test2',
  utterances: ['My fav one is @model with @test'],
  answers: [d => `${d.model_val} + ${d.test_val}`]
}, {
  intent: 'test3',
  utterances: ['The email of @model is @email wow', '@email is for @model'],
  answers: [d => `Email[${d.model}]=${d.email_val}`]
}, {
  intent: 'test4',
  utterances: ['@email + @email = @email'],
  answers: [d => `> ${d.email0_val} (+) ${d.email1_val} (=) ${d.email2_val}`]
}, {
  intent: 'test5',
  utterances: ['My email is @email'],
  answers: [d => `Your email is -> ${d.email_val}`]
}, {
  intent: 'test6',
  utterances: ['My fav @test is the number @number'],
  answers: [d => `Let's do "${d.test}" n°${d.number0_val}`]
}, {
  intent: 'test7',
  utterances: ['A @test and a @test'],
  answers: [d => `${d.test0} + ${d.test1}`]
}, {
  intent: 'test8',
  utterances: ['I want to create a @model'],
  answers: [d => `creating ${d.model}...`]
}, {
  intent: 'test9',
  utterances: ['@number + @number'],
  answers: [d => `= ${parseInt(d.number0_val) + parseInt(d.number1_val)}`]
}]

const entities = {
  model: {
    spiderman: ['spiderman', 'spider-man'],
    ironman: ['ironman', 'iron-man'],
    thor: ['thor']
  },
  test: {
    testA: ['test a', 'test 1'],
    testB: ['test b', 'test 2']
  },
  email: /(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})/gi,
  number: /\d+/gi,
  date: /(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/gi,
  city: /(?:[\p{Letter}\p{Mark}]+(?:. |-| |'))*[\p{Letter}\p{Mark}]+/gu,
  fromCity: btwEntity('fromCity', ['from'], [' to ', ' the ', ' at ']),
  toCity: btwEntity('toCity', ['to'], [' from ', ' the ', ' at '])
}

const tests = [
  { utter: 'a test 1 and a test 2 !', r: 'testA + testB' },
  { utter: 'My fav one is thor with test 1', r: 'thor + test 1' },
  { utter: 'My fav one is iro man with thor', r: '> iro man + thor' },
  { utter: 'The email of iron-man is test@test.com wow !', r: 'Email[ironman]=test@test.com' },
  { utter: 'ok@gmail.com is for thor', r: 'Email[thor]=ok@gmail.com' },
  { utter: 'ok@gmail.com + no@gmail.com = what@yahoo.com', r: '> ok@gmail.com (+) no@gmail.com (=) what@yahoo.com' },
  { utter: 'My fav test A is the number 46', r: 'Let\'s do "testA" n°46' },
  { utter: 'My fav test 1 is the number 123456789', r: 'Let\'s do "testA" n°123456789' },
  { utter: 'I want to create a iro man', r: 'creating ironman...' },
  { utter: 'My is my email: test@test.com', r: 'Your email is -> test@test.com' },
  { utter: '42+10', r: '= 52' },
  { utter: '42+a', r: null },
  { utter: 'I want to create a tester', r: null },
  { utter: 'I want to create a dinosaur', r: null },
  { utter: 'I want to travel', r: 'Where do you want to go?' },
  { utter: 'London', r: 'From where you are traveling?' },
  { utter: 'Barcelona', r: 'When do you want to travel?' },
  { utter: '2022-12-15', r: 'You want to travel from London to Barcelona the 12/15/2022' },
  { utter: 'I want to travel from London to Barcelona the 12/15/2022', r: 'You want to travel from London to Barcelona the 12/15/2022' },
  { utter: 'I want to travel to Barcelona from London the 12/15/2022', r: 'You want to travel from London to Barcelona the 12/15/2022' }
]
const fullCopy = d => d.map(v => ({ intent: v.intent, utterances: [...v.utterances], answers: [...v.answers], cond: v.cond }))

bench('test', (b) => {
  b.start()
  const bot = new Bot({ data: fullCopy(data), entities })
  tests.forEach(({ utter, r }) => {
    const { answer } = bot.process(utter)
    const status = answer !== r ? '❌' : '✅'
    console.log(`${status} "${utter}" => "${answer}"`)
  })
  b.end()
})

// bench('test 20.000 times', (b) => {
//   b.start()
//   for (let i = 0; i < 20000; i++) {
//     const bot = new Bot({ data: fullCopy(data), entities })
//     tests.forEach(({ utter }) => bot.process(utter))
//   }
//   b.end()
// })
