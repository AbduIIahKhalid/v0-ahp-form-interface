import React from 'react';

// Final test to confirm both methods give the same results
const testFinalConsistency = () => {
  // Method 1: From AHP Expert Form (corrected)
  const calculateConsistencyForm = (matrix: number[][], priorities: number[]) => {
    const n = matrix.length
    const weightedSum = Array(n).fill(0)

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        weightedSum[i] += matrix[i][j] * priorities[j]
      }
    }

    const lambdaMax = weightedSum.reduce((sum, val, i) => sum + val / priorities[i], 0) / n
    const CI = (lambdaMax - n) / (n - 1)
    const RI_VALUES = [0, 0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49]
    const RI = n < RI_VALUES.length ? RI_VALUES[n] : 1.59
    const CR = CI / RI

    return { lambdaMax, CI, CR, weightedSum }
  }

  // Method 2: From Admin Dashboard (corrected)
  const calculateConsistencyDashboard = (matrix: number[][], priorities: number[]) => {
    const n = matrix.length
    const weightedSum = matrix.map((row) => row.reduce((sum, val, j) => sum + val * priorities[j], 0))
    const lambdaValues = weightedSum.map((ws, i) => ws / priorities[i])
    const lambdaMax = lambdaValues.reduce((a, b) => a + b, 0) / n
    const CI = (lambdaMax - n) / (n - 1)
    const RI_VALUES = [0, 0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49]
    const RI = n < RI_VALUES.length ? RI_VALUES[n] : 1.59
    const CR = CI / RI
    return { lambdaMax, CI, CR, RI }
  }

  // Helper function to build a full matrix
  const buildFullMatrix = (upperTriangular: Record<string, number>, size: number): number[][] => {
    const m = Array(size).fill(0).map(() => Array(size).fill(0))
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

  // Function to calculate priority vector
  const calculatePriorityVector = (matrix: number[][]): number[] => {
    const n = matrix.length
    const geometricMeans = matrix.map((row) => {
      const product = row.reduce((acc, val) => acc * val, 1)
      return Math.pow(product, 1 / n)
    })
    const sum = geometricMeans.reduce((a, b) => a + b, 0)
    return geometricMeans.map((gm) => gm / sum)
  }

  console.log("=== Final Consistency Test ===");

  // Test case 1: All 3s (the problematic case)
  console.log("\n1. Testing with all 3s (inconsistent matrix):");
  const matrix3s = buildFullMatrix({
    "0-1": 3,
    "0-2": 3,
    "1-2": 3,
  }, 3);

  const priorities3s = calculatePriorityVector(matrix3s);

  const resultForm3s = calculateConsistencyForm(matrix3s, priorities3s);
  const resultDashboard3s = calculateConsistencyDashboard(matrix3s, priorities3s);

  console.log(`  Form method CR: ${resultForm3s.CR.toFixed(6)}`);
  console.log(`  Dashboard method CR: ${resultDashboard3s.CR.toFixed(6)}`);
  console.log(`  Match: ${Math.abs(resultForm3s.CR - resultDashboard3s.CR) < 1e-10 ? 'YES' : 'NO'}`);
  console.log(`  Status: ${resultForm3s.CR <= 0.10 ? 'ACCEPTED' : 'NOT ACCEPTED'}`);

  // Test case 2: All 1s (consistent matrix)
  console.log("\n2. Testing with all 1s (consistent matrix):");
  const matrix1s = buildFullMatrix({
    "0-1": 1,
    "0-2": 1,
    "1-2": 1,
  }, 3);

  const priorities1s = calculatePriorityVector(matrix1s);

  const resultForm1s = calculateConsistencyForm(matrix1s, priorities1s);
  const resultDashboard1s = calculateConsistencyDashboard(matrix1s, priorities1s);

  console.log(`  Form method CR: ${resultForm1s.CR.toFixed(6)}`);
  console.log(`  Dashboard method CR: ${resultDashboard1s.CR.toFixed(6)}`);
  console.log(`  Match: ${Math.abs(resultForm1s.CR - resultDashboard1s.CR) < 1e-10 ? 'YES' : 'NO'}`);
  console.log(`  Status: ${resultForm1s.CR <= 0.10 ? 'ACCEPTED' : 'NOT ACCEPTED'}`);

  // Test case 3: Consistent ratios
  console.log("\n3. Testing with consistent ratios (A vs B = 1, A vs C = 3, B vs C = 3):");
  const consistentMatrix = buildFullMatrix({
    "0-1": 1,
    "0-2": 3,
    "1-2": 3,
  }, 3);

  const consistentPriorities = calculatePriorityVector(consistentMatrix);

  const resultFormConsistent = calculateConsistencyForm(consistentMatrix, consistentPriorities);
  const resultDashboardConsistent = calculateConsistencyDashboard(consistentMatrix, consistentPriorities);

  console.log(`  Form method CR: ${resultFormConsistent.CR.toFixed(6)}`);
  console.log(`  Dashboard method CR: ${resultDashboardConsistent.CR.toFixed(6)}`);
  console.log(`  Match: ${Math.abs(resultFormConsistent.CR - resultDashboardConsistent.CR) < 1e-10 ? 'YES' : 'NO'}`);
  console.log(`  Status: ${resultFormConsistent.CR <= 0.10 ? 'ACCEPTED' : 'NOT ACCEPTED'}`);

  console.log("\n=== Summary ===");
  console.log("Both methods now use the same RI values and calculation approach.");
  console.log("The CR calculation is mathematically correct:");
  console.log("- All 3s matrix: CR = 0.116906 > 0.10 → NOT ACCEPTED (correct, it's inconsistent)");
  console.log("- All 1s matrix: CR = 0.000000 ≤ 0.10 → ACCEPTED (correct, it's perfectly consistent)");
};

testFinalConsistency();

export default function FinalTest() {
  return (
    <div>
      <h1>Final Consistency Test</h1>
      <p>Check console for test results</p>
    </div>
  );
}