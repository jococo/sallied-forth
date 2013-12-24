describe("The Interpreter", function() {

  var itp, result;

  beforeEach(function() {
    itp = new forthasm.Interpreter();
  });

  it("is at version 0.0.1", function() {
    expect(itp.versionString).toBe('0.0.1');
  });

  // stack
  describe("stack", function() {

    it("is empty at start.", function() {
      result = itp.interpret('.l');
      expect(result).toBe('0');
    });

    it("can have a number added.", function() {
      result = itp.interpret('99 .');
      expect(result).toBe('99');
    });

    it("can show it's length.", function() {
      result = itp.interpret('33 22 9 17 4 .l');
      expect(result).toBe('5');
    });

    it("can print out it's contents.", function() {
      result = itp.interpret('17 word frank .s');
      expect(result).toBe('[17,frank]');
    });

    // . function, shows the top item on the stack
    describe("'.' function", function() {

      it("takes the top item.", function() {
        result = itp.interpret('1 2 3 99 . .l');
        expect(result).toBe('99 3');
      });

      it("returns undefined for an empty stack and length stays at 0.", function() {
        result = itp.interpret('. .l');
        expect(result).toBe('undefined 0');
      });

    });

    // .s function, shows the stack contents
    describe("'.s' function", function() {

      it("takes the top item.", function() {
        result = itp.interpret('1 2 3 99 .s');
        expect(result).toBe('[1,2,3,99]');
      });

      it("returns message for an empty stack and length stays at 0.", function() {
        result = itp.interpret('.s .l');
        expect(result).toBe('[stack empty] 0');
      });

    });

    // .l function, shows the length of the stack
    describe("'.l' function", function() {

      it("shows length as 0 for empty stack", function() {
        result = itp.interpret('.l');
        expect(result).toBe('0');
      });

      it("", function() {
        result = itp.interpret('1 2 3 4 5 6 7 8 9 .l');
        expect(result).toBe('9');
      });

    });

  });

  // DUP function
  describe("DUP function", function() {

    it("duplicates the top stack item.", function() {
      result = itp.interpret("3 dup .l .");
      expect(result).toBe("2 3"); // size of stack, top item
    });

    it("fails silently if stack is empty", function() {
      result = itp.interpret("dup .l .");
      expect(result).toBe("0 undefined"); // size of stack, top item
    });

  });

  // DROP function
  describe("DROP function", function() {

    it("drops the top stack item.", function() {
      result = itp.interpret("7 8 drop .l .");
      expect(result).toBe("1 7"); // size of stack, top item
    });

    it("fails silently if stack is empty", function() {
      result = itp.interpret("drop .l .");
      expect(result).toBe("0 undefined"); // size of stack, top item
    });

  });

  // SWAP function
  describe("SWAP function", function() {

    it("swaps the top stack item with the one beneath.", function() {
      result = itp.interpret("4 9 swap .l .");
      expect(result).toBe("2 4"); // size of stack, top item
    });

    it("fails silently if stack is empty", function() {
      result = itp.interpret("swap .l .");
      expect(result).toBe("0 undefined"); // size of stack, top item
    });

  });

  // OVER function
  describe("OVER function", function() {

    it("duplicates the second stack item pushing it on the top.", function() {
      result = itp.interpret("6 7 over .l .");
      expect(result).toBe("3 6"); // size of stack, top item
    });

    it("fails silently if stack is empty", function() {
      result = itp.interpret("over .l .");
      expect(result).toBe("0 undefined"); // size of stack, top item
    });

  });

  describe("Maths functions", function() {

    describe("+ (PLUS) function", function() {

      it("adds the top two stack items pushing the result on the stack.", function() {
        result = itp.interpret("7 4 + .l .");
        expect(result).toBe("1 11");
      });

      it("returns the top item if alone.", function() {
        result = itp.interpret("88 + .l .");
        expect(result).toBe("1 88");
      });

      it("returns 0 on empty stack.", function() {
        result = itp.interpret("+ .l .");
        expect(result).toBe("1 0");
      });

    })

    describe("* (MULT) function", function() {

      it("multiplies the top two stack items pushing the result on the stack.", function() {
        result = itp.interpret("6 5 * .l .");
        expect(result).toBe("1 30");
      });

      it("returns the top item if alone.", function() {
        result = itp.interpret("55 * .l .");
        expect(result).toBe("1 55");
      });

      it("returns 1 on empty stack.", function() {
        result = itp.interpret("* .l .");
        expect(result).toBe("1 1");
      });

    })

    describe("- (MINUS) function", function() {

      it("subtracts the top two stack items pushing the result on the stack.", function() {
        result = itp.interpret("19 6 - .l .");
        expect(result).toBe("1 13");
      });

      it("returns the top negated item if alone.", function() {
        result = itp.interpret("88 - .l .");
        expect(result).toBe("1 -88");
      });

      it("returns 0 on empty stack.", function() {
        result = itp.interpret("- .l .");
        expect(result).toBe("1 0");
      });

    })

    describe("/ (DIV) function", function() {

      it("divides the top two stack items pushing the result on the stack.", function() {
        result = itp.interpret("35 5 / .l .");
        expect(result).toBe("1 7");
      });

      it("returns the '1' if alone.", function() {
        result = itp.interpret("88 / .l .");
        expect(result).toBe("1 1");
      });

      it("returns '1' on empty stack.", function() {
        result = itp.interpret("/ .l .");
        expect(result).toBe("1 1");
      });

    })

    describe("% (MOD) function", function() {

      it("divides the top two stack items pushing the result and remainder on the stack.", function() {
        result = itp.interpret("20 6 % .l . .");
        expect(result).toBe("2 3 2");
      });

      it("returns '1 & 0' if alone.", function() {
        result = itp.interpret("66 % .l . .");
        expect(result).toBe("2 1 0");
      });

      it("returns '1 & 0' on empty stack.", function() {
        result = itp.interpret("% .l . .");
        expect(result).toBe("2 1 0");
      });

    });

  });

  describe("Command functions", function() {
    describe("WORD", function() {

      it("drops the next word on the stack.", function() {
        result = itp.interpret('word bob .l .');
        expect(result).toBe('1 bob');
      });

      it("fails silently if there is no next word.", function() {
        itp.interpret('word');
        result = itp.interpret('.l .');
        expect(result).toBe('0 undefined');
      });

      it("will pick up any other command as a word.", function() {
        result = itp.interpret('word .l .');
        expect(result).toBe('.l');
      });

      it("will push numbers too", function() {
        result = itp.interpret('word 999 .l .');
        expect(result).toBe('1 999');
      });

    });

    describe("FIND", function() {

      it("can find a system word.", function() {
        result = itp.interpret('word dup find .l');
        expect(result).toBe('1');
      });

      it("returns a JavaScript Object.", function() {
        result = itp.interpret('word dup find .');
        expect(result).toBe('[object Object]');
      });

      it("can find itself.", function() {
        result = itp.interpret('word word find .l');
        expect(result).toBe('1');
      });

      it("returns 'undefined' when word can not be found.", function() {
        result = itp.interpret('word jabberwocky find .');
        expect(result).toBe('undefined');
      });

    });

    // no idea what this stands for. In this implementation converts
    // Command object into it's function.
    describe(">CFA", function() {

      it("returns the function ref for a found word.", function() {
        result = itp.interpret('word dup find >cfa .');
        expect(result).toBeDefined();
      });

      it("fails silently if no defn object is available.", function() {
        result = itp.interpret('1 2 3 >cfa .s');
        expect(result).toBe('[1,2,3]');
      });

    });

  });

});