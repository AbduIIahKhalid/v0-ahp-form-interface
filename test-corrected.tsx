import React from 'react';

// Test the corrected calculation
const testCorrectedCalculation = () => {
  // Correct RI values
  const RI_VALUES = [0, 0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];

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

  // Corrected calculation method (from AHP Expert Form)
  const calculateConsistency = (matrix: number[][], priorities: number[]) => {
    const n = matrix.length
    const weightedSum = Array(n).fill(0)

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        weightedSum[i] += matrix[i][j] * priorities[j]
      }
    }

    const lambdaMax = weightedSum.reduce((sum, val, i) => sum + val / priorities[i], 0) / n
    const CI = (lambdaMax - n) / (n - 1)
    const RI = n < RI_VALUES.length ? RI_VALUES[n] : 1.59
    const CR = CI / RI

    return { lambdaMax, CI, CR, weightedSum }
  }

  // Test with the problematic case: all 3s
  console.log("=== Testing corrected calculation method ===");

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

  const result = calculateConsistency(testMatrix, testPriorities);

  console.log("Corrected method results:");
  console.log(`  Lambda Max: ${result.lambdaMax.toFixed(6)}`);
  console.log(`  CI: ${result.CI.toFixed(6)}`);
  console.log(`  CR: ${result.CR.toFixed(6)}`);
  console.log(`  Status: ${result.CR <= 0.10 ? 'ACCEPTED' : 'NOT ACCEPTED'}`);

  // Also test with identity matrix (should be CR = 0)
  console.log("\n=== Testing with identity matrix (should be CR = 0) ===");
  const identityMatrix = buildFullMatrix({
    "0-1": 1,
    "0-2": 1,
    "1-2": 1,
  }, 3);

  const identityPriorities = calculatePriorityVector(identityMatrix);
  const identityResult = calculateConsistency(identityMatrix, identityPriorities);

  console.log("Identity matrix results:");
  console.log(`  CR: ${identityResult.CR.toFixed(6)}`);
  console.log(`  Status: ${identityResult.CR <= 0.10 ? 'ACCEPTED' : 'NOT ACCEPTED'}`);

  // Test the RI values are correct
  console.log("\n=== Verifying RI values ===");
  for (let n = 1; n <= 10; n++) {
    if (n < RI_VALUES.length) {
      console.log(`  n=${n}: RI = ${RI_VALUES[n]}`);
    }
  }
};

testCorrectedCalculation();

export default function TestCorrected() {
  return (
    <div>
      <h1>Corrected Calculation Test</h1>
      <p>Check console for test results</p>
    </div>
  );
}