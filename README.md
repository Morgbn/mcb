# MCB: Mini Chat Bot 🤖💬

[![size](https://img.shields.io/bundlephobia/min/mcb?style=for-the-badge)](https://bundlephobia.com/result?p=mcb)
[![beta](https://img.shields.io/badge/BETA-test-red?style=for-the-badge)](#)
[![usejs](https://img.shields.io/badge/USES-JS-yellow?style=for-the-badge)](#)

---

MCB is a text processor for nodejs/browser chatbot. The goal is to be lightweight and in theory usable with any language.

## Install

```
$ npm i mcb
```

## Usage

```js
import { MCB } from 'mcb'

// "Training" data
const data = [{
  intent: 'greetings.bye',
  utterances: ['goodbye for now', 'bye bye take care', 'okay see you later', 'bye for now', 'i must go'],
  answers: ['Till next time', 'See you soon!']
}, {
  intent: 'greetings.hello',
  utterances: ['hello', 'hi', 'howdy'],
  answers: ['Hey there!', 'Greetings!']
}]

const bot = new MCB({ data })
console.log(bot.process('goodbye for now').answer)
// => "Till next time" or "See you soon!"
```

### Slot filling

Example code for slot filling:

```js
import { MCB } from 'mcb'

const data = [{
  intent: 'travel.start',
  utterances: ['I want to travel'],
  answers: ['Where do you want to go?']
}, {
  intent: 'travelTo',
  utterances: ['to @city'],
  answers: ['From where you are traveling?'],
  cond: d => d.lastStep === 'travel.start'
}, {
  intent: 'travelFrom',
  utterances: ['from @city'],
  answers: ['When do you want to travel?'],
  cond: d => d.lastStep === 'travelTo'
}, {
  intent: 'travelDate',
  utterances: ['tomorrow', 'the @date'],
  answers: [d => endAnswerTravel(d.history.travelTo.city_val, d.history.travelFrom.city_val, d.date_val)],
  cond: d => d.lastStep === 'travelFrom'
}, {
  intent: 'travalOneShot',
  utterances: ['I want to travel from @fromCity to @toCity at @date', 'I want to travel to @toCity from @fromCity at @date'],
  answers: [d => endAnswerTravel(d.fromCity_val, d.toCity_val, d.date_val)]
}]

const entities = {
  date: /(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/gi,
  city: /(?:[\p{Letter}\p{Mark}]+(?:. |-| |'))*[\p{Letter}\p{Mark}]+/gu,
  fromCity: btwEntity('fromCity', ['from'], [' to ', ' the ', ' at ']),
  toCity: btwEntity('toCity', ['to'], [' from ', ' the ', ' at '])
}

const bot = new MCB({ data, entities })
console.log(bot.process('I want to travel').answer)
// => Where do you want to go?
console.log(bot.process('London').answer)
// => From where you are traveling?
console.log(bot.process('Paris').answer)
// => When do you want to travel?
console.log(bot.process('2022-12-15').answer)
// => You want to travel from London to Barcelona the 12/15/2022

console.log(bot.process('I want to travel from London to Barcelona the 12/15/2022').answer)
// => You want to travel from London to Barcelona the 12/15/2022'
console.log(bot.process('I want to travel to Barcelona from London the 12/15/2022').answer)
// => You want to travel from London to Barcelona the 12/15/2022
```