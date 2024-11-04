function expectResult(inStr: string, out: any): void {
  const result = itp.interpret(inStr);
  const resultFirst = result.pop();
  if (Array.isArray(out) || (out === Object(out))) {
    expect(resultFirst).toEqual(out);
  } else {
    expect(resultFirst).toBe(out);
  }
}

function expectThrow(inStr: string): void {
  const result = () => {
    itp.interpret(inStr);
  };
  expect(result).toThrow();
}
