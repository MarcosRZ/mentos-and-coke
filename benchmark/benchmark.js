import { MongoClient } from 'mongodb';
import { separateTest } from './favorites/separate.js';
import { aggregateTest } from './favorites/aggregate.js';
const uri = 'mongodb://localhost:27017'
const dbName = 'paysite';
const n = 100;

const benchmark = async ({ name, testFn }) => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const times = [];

    for (let i = 0; i < n; i++) {
      // Beginning of measuring
      const start = performance.now(); 
      await testFn(db);
      const end = performance.now();
      // End of measuring
      times.push(end - start);
    }

    // Average
    const totalTime = times.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / n;

    // Median (most ferquent)
    const sorted = [...times].sort((a, b) => a - b);
    const mid = Math.floor(n / 2);
    const medianTime = n % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    // Std Deviation
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const output = await testFn(db);

    return {
      output,
      metrics: {
        name,
        runs: n,
        totalTime,
        avgTime,
        medianTime,
        stdDev,
        runsPerSecond: 1000 / avgTime,
      }
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

(async () => {
  const tests = [
    { 
      name: 'Separate',
      testFn: separateTest(),
      printOutput: (output) => { console.log(`Length of videos array: ${output[1].length}, TotalCount: ${output[0]}`) } 
    },
    { 
      name: 'Aggregate',
      testFn: aggregateTest(),
      printOutput: (output) => { console.log(`Length of videos array: ${output[0].data.length}, TotalCount: ${output[0].totalCount[0].count}`) }
    },
  ];

  for (const test of tests) {
    const result = await benchmark(test);
    test.result = result;
  }

  const metrics = tests.map(test => test.result.metrics);
  const minAvgTime = Math.min(...metrics.map(r => r.avgTime));

  const metricsOutput = metrics.map(
    ({
      name,
      runs,
      totalTime,
      avgTime,
      medianTime,
      stdDev,
      runsPerSecond,
    }) => {
      const percent = ((avgTime - minAvgTime) / minAvgTime) * 100;
      const betterOrWorse =
        percent === 0
          ? "baseline"
          : percent > 0
          ? `🔻 ${percent.toFixed(2)}% slower`
          : `🔺 ${Math.abs(percent).toFixed(2)}% faster`;

      return {
        Test: name,
        Runs: runs,
        "Total Time (ms)": totalTime.toFixed(2),
        "Avg Time (ms)": avgTime.toFixed(2),
        "Median Time (ms)": medianTime.toFixed(2),
        "Standard Deviation (±ms)": stdDev.toFixed(2),
        "Runs/sec": runsPerSecond.toFixed(2),
        "∆ vs Best": betterOrWorse,
      };
    }
  );

  console.table(metricsOutput);

  tests.forEach(test => {
    if (test.result.output && test.printOutput) {
      console.log(`Output for test (${test.name}):`);
      test.printOutput(test.result.output);
    } else {
      console.log(`No output for ${test.metrics.name}:`);
    }
  });
})();