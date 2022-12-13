function getSmallestZero(n: number): number {
  for (let i = 0; true; i++) {
    const mask = 1 << i;
    if ((n & mask) === 0) {
      return i;
    }
  }
}

function maskRight(i: number): number {
  let mask = 1;
  for (let j = 0; j < i; j++) {
    mask = (mask << 1) | 1;
  }

  return mask;
}

function rightZeroes(n: number, i: number): number {
  return n & (~maskRight(i));
}

function rightOnes(n: number, i: number): number {
  return n | maskRight(i);
}

export function nodeLowerRange(nodeIndex: number): [number, number] {
  const zeroIndex = getSmallestZero(nodeIndex);
  if (zeroIndex === 0) return [nodeIndex, nodeIndex];

  return [
    rightZeroes(nodeIndex, zeroIndex - 1),
    rightOnes(nodeIndex, zeroIndex - 1),
  ];
}

export function nodeUpperRange(nodeIndex: number): [number, number] {
  const zeroIndex = getSmallestZero(nodeIndex);
  if (zeroIndex === 0) return [nodeIndex | 1, nodeIndex | 1];

  const withOne = rightOnes(nodeIndex, zeroIndex);

  return [
    rightZeroes(withOne, zeroIndex - 1),
    rightOnes(withOne, zeroIndex - 1),
  ];
}
