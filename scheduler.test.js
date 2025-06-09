const assert = require('assert');
const { scheduleJob } = require('./scheduler');

// start on Saturday for 2-day job
assert.deepStrictEqual(
  scheduleJob('2023-04-15', 2),
  ['2023-04-15', '2023-04-17']
);

// start on Monday for 3-day job
assert.deepStrictEqual(
  scheduleJob('2023-04-17', 3),
  ['2023-04-17', '2023-04-18', '2023-04-19']
);

// start on Sunday for 2-day job
assert.deepStrictEqual(
  scheduleJob('2023-04-16', 2),
  ['2023-04-17', '2023-04-18']
);

console.log('All tests passed');
