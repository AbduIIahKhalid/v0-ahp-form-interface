import React from 'react';

// Detailed analysis of the CR calculation issue
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

// Function to calculate consistency (CI, CR)
const calculateConsistency = (matrix: number[][], priorities: number[]) => {
  const n = matrix.length

  // Calculate weighted sum for each row: sum of (matrix[i][j] * priority[j]) for all j
  const weightedSum = matrix.map((row) => row.reduce((sum, val, j) => sum + val * priorities[j], 0))

  // Calculate lambda values: weightedSum[i] / priority[i] for each row
  const lambdaValues = weightedSum.map((ws, i) => ws / priorities[i])

  // Calculate lambda max (average of lambda values)
  const lambdaMax = lambdaValues.reduce((a, b) => a + b, 0) / n

  // Calculate CI
  const CI = (lambdaMax - n) / (n - 1)

  // Get RI value
  const RI = RI_VALUES[n] || 1.59

  // Calculate CR
  const CR = CI / RI

  return { lambdaMax, CI, CR, RI, weightedSum, lambdaValues }
}

console.log("=== Understanding the issue with equal values ===");
console.log("When user selects all 3s in the interface:");
console.log("  - They think they're saying all criteria/alternatives are equal");
console.log("  - But actually they're saying:");
console.log("    - A vs B = 3 (A is moderately more important than B)");
console.log("    - A vs C = 3 (A is moderately more important than C)");
console.log("    - B vs C = 3 (B is moderately more important than C)");
console.log("  - This creates an inconsistent relationship!");
console.log();

// Create the matrix that results from all 3s
const allThreesMatrix = buildFullMatrix({
  "0-1": 3,
  "0-2": 3,
  "1-2": 3,
}, 3);

console.log("Matrix created from all 3s:");
allThreesMatrix.forEach((row, i) => {
  console.log(`  [${row.map(val => val.toFixed(4)).join(', ')}]`);
});
console.log();

// What the user probably intended - all equal (all 1s)
const allOnesMatrix = buildFullMatrix({
  "0-1": 1,
  "0-2": 1,
  "1-2": 1,
}, 3);

console.log("Matrix for truly equal importance (all 1s):");
allOnesMatrix.forEach((row, i) => {
  console.log(`  [${row.map(val => val.toFixed(4)).join(', ')}]`);
});
console.log();

// Calculate for all 3s
const allThreesPriorities = calculatePriorityVector(allThreesMatrix);
const allThreesConsistency = calculateConsistency(allThreesMatrix, allThreesPriorities);

console.log("All 3s matrix results:");
console.log(`  Priorities: [${allThreesPriorities.map(p => p.toFixed(6)).join(', ')}]`);
console.log(`  Lambda Max: ${allThreesConsistency.lambdaMax.toFixed(6)}`);
console.log(`  CI: ${allThreesConsistency.CI.toFixed(6)}`);
console.log(`  CR: ${allThreesConsistency.CR.toFixed(6)}`);
console.log(`  Status: ${allThreesConsistency.CR <= 0.10 ? 'ACCEPTED' : 'NOT ACCEPTED'}`);
console.log();

// Calculate for all 1s
const allOnesPriorities = calculatePriorityVector(allOnesMatrix);
const allOnesConsistency = calculateConsistency(allOnesMatrix, allOnesPriorities);

console.log("All 1s matrix results:");
console.log(`  Priorities: [${allOnesPriorities.map(p => p.toFixed(6)).join(', ')}]`);
console.log(`  Lambda Max: ${allOnesConsistency.lambdaMax.toFixed(6)}`);
console.log(`  CI: ${allOnesConsistency.CI.toFixed(6)}`);
console.log(`  CR: ${allOnesConsistency.CR.toFixed(6)}`);
console.log(`  Status: ${allOnesConsistency.CR <= 0.10 ? 'ACCEPTED' : 'NOT ACCEPTED'}`);
console.log();

// Let's also test what happens when the user selects "1 - Equally Important" for all comparisons
console.log("=== Testing when user selects '1 - Equally Important' for all ===");
const equallyImportantMatrix = buildFullMatrix({
  "0-1": 1,  // 1 - Equally Important
  "0-2": 1,  // 1 - Equally Important
  "1-2": 1,  // 1 - Equally Important
}, 3);

console.log("Matrix when all comparisons are 'Equally Important':");
equallyImportantMatrix.forEach((row, i) => {
  console.log(`  [${row.map(val => val.toFixed(4)).join(', ')}]`);
});

const equallyImportantPriorities = calculatePriorityVector(equallyImportantMatrix);
const equallyImportantConsistency = calculateConsistency(equallyImportantMatrix, equallyImportantPriorities);

console.log("Results for all 'Equally Important':");
console.log(`  Priorities: [${equallyImportantPriorities.map(p => p.toFixed(6)).join(', ')}]`);
console.log(`  CR: ${equallyImportantConsistency.CR.toFixed(6)}`);
console.log(`  Status: ${equallyImportantConsistency.CR <= 0.10 ? 'ACCEPTED' : 'NOT ACCEPTED'}`);
console.log();

// Now let's test what happens when user selects all "3 - Moderately More Important"
console.log("=== Testing when user selects '3 - Moderately More Important' for all ===");
const moderatelyImportantMatrix = buildFullMatrix({
  "0-1": 3,  // 3 - Moderately More Important
  "0-2": 3,  // 3 - Moderately More Important
  "1-2": 3,  // 3 - Moderately More Important
}, 3);

console.log("Matrix when all comparisons are 'Moderately More Important':");
moderatelyImportantMatrix.forEach((row, i) => {
  console.log(`  [${row.map(val => val.toFixed(4)).join(', ')}]`);
});

const moderatelyImportantPriorities = calculatePriorityVector(moderatelyImportantMatrix);
const moderatelyImportantConsistency = calculateConsistency(moderatelyImportantMatrix, moderatelyImportantPriorities);

console.log("Results for all 'Moderately More Important':");
console.log(`  Priorities: [${moderatelyImportantPriorities.map(p => p.toFixed(6)).join(', ')}]`);
console.log(`  CR: ${moderatelyImportantConsistency.CR.toFixed(6)}`);
console.log(`  Status: ${moderatelyImportantConsistency.CR <= 0.10 ? 'ACCEPTED' : 'NOT ACCEPTED'}`);
console.log();

// Test with different values that should be consistent
console.log("=== Testing a truly consistent matrix ===");
console.log("Let's try A vs B = 1, A vs C = 3, B vs C = 3");
console.log("This means A=B, A is 3x C, so B should be 3x C too (B vs C = 3)");
const trulyConsistentMatrix = buildFullMatrix({
  "0-1": 1,  // A vs B = 1 (equally important)
  "0-2": 3,  // A vs C = 3 (A is 3x more important than C)
  "1-2": 3,  // B vs C = 3 (B is 3x more important than C, since A=B, A=3C => B=3C)
}, 3);

console.log("Truly consistent matrix:");
trulyConsistentMatrix.forEach((row, i) => {
  console.log(`  [${row.map(val => val.toFixed(4)).join(', ')}]`);
});

const trulyConsistentPriorities = calculatePriorityVector(trulyConsistentMatrix);
const trulyConsistentConsistency = calculateConsistency(trulyConsistentMatrix, trulyConsistentPriorities);

console.log("Results for truly consistent matrix:");
console.log(`  Priorities: [${trulyConsistentPriorities.map(p => p.toFixed(6)).join(', ')}]`);
console.log(`  CR: ${trulyConsistentConsistency.CR.toFixed(6)}`);
console.log(`  Status: ${trulyConsistentConsistency.CR <= 0.10 ? 'ACCEPTED' : 'NOT ACCEPTED'}`);
console.log();

// Test with a perfectly consistent ratio matrix
console.log("=== Testing with perfect ratio consistency ===");
console.log("A vs B = 2, A vs C = 6, B vs C = 3 (since A=2B and A=6C => 2B=6C => B=3C)");
const ratioConsistentMatrix = buildFullMatrix({
  "0-1": 2,  // A vs B = 2
  "0-2": 6,  // A vs C = 6
  "1-2": 3,  // B vs C = 3 (this should be 3 to maintain consistency: if A=2B and A=6C, then B=3C)
}, 3);

console.log("Ratio consistent matrix:");
ratioConsistentMatrix.forEach((row, i) => {
  console.log(`  [${row.map(val => val.toFixed(4)).join(', ')}]`);
});

const ratioConsistentPriorities = calculatePriorityVector(ratioConsistentMatrix);
const ratioConsistentConsistency = calculateConsistency(ratioConsistentMatrix, ratioConsistentPriorities);

console.log("Results for ratio consistent matrix:");
console.log(`  Priorities: [${ratioConsistentPriorities.map(p => p.toFixed(6)).join(', ')}]`);
console.log(`  CR: ${ratioConsistentConsistency.CR.toFixed(6)}`);
console.log(`  Status: ${ratioConsistentConsistency.CR <= 0.10 ? 'ACCEPTED' : 'NOT ACCEPTED'}`);

export default function TestCR() {
  return (
    <div>
      <h1>CR Calculation Test</h1>
      <p>Check console for test results</p>
    </div>
  );
}