import React from 'react';

// Compare the two different calculation methods
const RI_VALUES: Record<number, number> = {
  1: 0.0,
  2: 0.0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
  11: 1.51,
  12: 1.53,
  13: 1.56,
  14: 1.58,
  15: 1.59,
};

// Helper function to build a full matrix from an upper triangular representation
const buildFullMatrix = (upperTriangular: Record<string, number>, size: number): number[][] => {
  const m = Array(size)
    .fill(0)
    .map(() => Array(size).fill(0))
  for (let i = 0; i < size; i++) m[i][i] = 1
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      const key = `${i}-${j}`
      const value = upperTriangular[key] || 1
      m[i][j] = value
      m[j][i] = 1 / value
    }
  }
  return m
}

// Function to calculate the priority vector from a matrix using geometric mean
const calculatePriorityVector = (matrix: number[][]): number[] => {
  const n = matrix.length
  const geometricMeans = matrix.map((row) => {
    const product = row.reduce((acc, val) => acc * val, 1)
    return Math.pow(product, 1 / n)
  })
  const sum = geometricMeans.reduce((a, b) => a + b, 0)
  const priorities = geometricMeans.map((gm) => gm / sum)
  return priorities
}

// Original method from AHP Expert Form
const calculateConsistencyOriginal = (matrix: number[][], priorities: number[]) => {
  const n = matrix.length
  const weightedSum = Array(n).fill(0)

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      weightedSum[i] += matrix[i][j] * priorities[j]
    }
  }

  const lambdaMax = weightedSum.reduce((sum, val, i) => sum + val / priorities[i], 0) / n
  const CI = (lambdaMax - n) / (n - 1)
  const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49][n]  // Using array index
  const CR = CI / RI

  return { lambdaMax, CI, CR, weightedSum }
}

// New method from Admin Dashboard
const calculateConsistencyNew = (matrix: number[][], priorities: number[]) => {
  const n = matrix.length
  const weightedSum = matrix.map((row) => row.reduce((sum, val, j) => sum + val * priorities[j], 0))
  const lambdaValues = weightedSum.map((ws, i) => ws / priorities[i])
  const lambdaMax = lambdaValues.reduce((a, b) => a + b, 0) / n
  const CI = (lambdaMax - n) / (n - 1)
  const RI = RI_VALUES[n] || 1.59  // Using object lookup
  const CR = CI / RI
  return { lambdaMax, CI, CR, RI, weightedSum, lambdaValues }
}

// Test with the problematic case: all 3s
console.log("=== Comparing calculation methods ===");

const testMatrix = buildFullMatrix({
  "0-1": 3,
  "0-2": 3,
  "1-2": 3,
}, 3);

console.log("Test matrix:");
testMatrix.forEach((row, i) => {
  console.log(`  [${row.map(val => val.toFixed(4)).join(', ')}]`);
});

const testPriorities = calculatePriorityVector(testMatrix);
console.log(`Priorities: [${testPriorities.map(p => p.toFixed(6)).join(', ')}]`);

const originalResult = calculateConsistencyOriginal(testMatrix, testPriorities);
const newResult = calculateConsistencyNew(testMatrix, testPriorities);

console.log("Original method results:");
console.log(`  Lambda Max: ${originalResult.lambdaMax.toFixed(6)}`);
console.log(`  CI: ${originalResult.CI.toFixed(6)}`);
console.log(`  CR: ${originalResult.CR.toFixed(6)}`);

console.log("New method results:");
console.log(`  Lambda Max: ${newResult.lambdaMax.toFixed(6)}`);
console.log(`  CI: ${newResult.CI.toFixed(6)}`);
console.log(`  CR: ${newResult.CR.toFixed(6)}`);

console.log(`Results match: ${Math.abs(originalResult.CR - newResult.CR) < 1e-10 ? 'YES' : 'NO'}`);

// Also test with identity matrix
console.log("\n=== Testing with identity matrix ===");
const identityMatrix = buildFullMatrix({
  "0-1": 1,
  "0-2": 1,
  "1-2": 1,
}, 3);

const identityPriorities = calculatePriorityVector(identityMatrix);

const originalIdentity = calculateConsistencyOriginal(identityMatrix, identityPriorities);
const newIdentity = calculateConsistencyNew(identityMatrix, identityPriorities);

console.log("Original method (identity):");
console.log(`  CR: ${originalIdentity.CR.toFixed(6)}`);

console.log("New method (identity):");
console.log(`  CR: ${newIdentity.CR.toFixed(6)}`);

console.log(`Identity results match: ${Math.abs(originalIdentity.CR - newIdentity.CR) < 1e-10 ? 'YES' : 'NO'}`);

// The key difference might be in the RI array vs object lookup
console.log("\n=== Checking RI lookup difference ===");
console.log(`Original array lookup [3]: ${[0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49][3]}`);
console.log(`New object lookup [3]: ${RI_VALUES[3]}`);

export default function TestComparison() {
  return (
    <div>
      <h1>Method Comparison Test</h1>
      <p>Check console for test results</p>
    </div>
  );
}