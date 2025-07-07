import { promisify } from 'util';

const delay = promisify(setTimeout);

delay(0).then(() => {
  console.log('1. Promisified setTimeout'); // Microtask Queue
});

setTimeout(() => {
  console.log('2. setTimeout'); // Task Queue
}, 0);

Promise.resolve().then(() => {
  console.log('3. Pure Promise'); // Microtask Queue
}); 

console.log('4. Synchronous log'); // Synchronous code runs first
