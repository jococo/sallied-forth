
function expectResult( inStr, out ) {
  result = itp.interpret(inStr);
  var resultFirst = result.pop();
  if( Array.isArray( out ) || (out === Object(out)) ) {
    expect(resultFirst).toEqual(out);
  } else {
    expect(resultFirst).toBe(out);
  }
}

function expectThrow( inStr ) {
  result = function() {
    itp.interpret(inStr);
  };
  expect(result).toThrow();
}

