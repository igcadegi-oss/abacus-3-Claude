// ext/core/generator.js
export function generateExamples(count = 10) {
  const examples = [];
  let current = 0;
  for (let i = 0; i < count; i++) {
    const delta = randomDelta();
    const sign = delta > 0 ? "+" : "";
    examples.push(`${sign}${delta}`);
    current += delta;
  }
  return examples;
}

function randomDelta() {
  const vals = [-4, -3, -2, -1, 1, 2, 3, 4];
  return vals[Math.floor(Math.random() * vals.length)];
}