export function randomMathDigit() {
  return Math.floor(Math.random() * 9) + 1;
}

export function isValidMathChallenge(a: number, b: number, answer: number) {
  return (
    Number.isInteger(a) &&
    Number.isInteger(b) &&
    Number.isInteger(answer) &&
    a >= 1 &&
    a <= 9 &&
    b >= 1 &&
    b <= 9 &&
    a + b === answer
  );
}
