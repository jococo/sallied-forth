
describe("Stack Manipulation", function() {

  var itp, result;

  beforeEach(function() {
    itp = new salliedforth.Interpreter();
  });

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

  // DUP function
  describe("DUP function", function() {

    it("duplicates the top stack item.", function() {
      result = itp.interpret("3 dup .");
      expect(result.pop()).toBe(3); // size of stack, top item
    });

    it("throws an error if stack is empty", function() {
      expectThrow('dup');
    });

  });

  // DROP function
  describe("DROP function", function() {

    it("drops the top stack item.", function() {
      result = itp.interpret("7 8 drop .l .");
      expect(result.pop()).toBe(7); // top item
      expect(result.stackSize).toBe(0);
    });

    it("throws an error if stack is empty", function() {
      expectThrow('drop');
    });

  });

  // SWAP function
  describe("SWAP function", function() {

    it("swaps the top stack item with the one beneath.", function() {
      result = itp.interpret("4 9 swap .");
      expect(result.pop()).toBe(4);
    });

    it("throws an error if stack is empty", function() {
      expectThrow('swap');
    });

  });

  // OVER function
  describe("OVER function", function() {

    it("duplicates the second stack item pushing it on the top.", function() {
      result = itp.interpret("6 7 over .");
      expect(result.pop()).toBe(6);
    });

    it("throws an error if stack is empty", function() {
      expectThrow('over');
    });

  });

  // ROLL function
  describe("ROLL function", function() {

    it("take the third item on the stack and put's it up top", function() {
      expectResult('1 2 3 2 roll .s', [2,3,1]);
    });

    it("take the second item on the stack and put's it up top", function() {
      expectResult('1 2 3 1 roll .s', [1,3,2]);
    });

    it("stays the same", function() {
      expectResult('1 2 3 0 roll .s', [1,2,3]);
    });

    it("throws an error if stack is empty", function() {
      expectThrow('roll');
    });

  })

  // ROT function
  describe("ROT function", function() {

    it("take the third item on the stack and put's it up top", function() {
      expectResult('1 2 3 rot .s', [2,3,1]);
    });

    it("throws an error if <3 items on the stack", function() {
      expectThrow('1 2 rot');
    });

  })

})

