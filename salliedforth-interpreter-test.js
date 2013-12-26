describe("The Interpreter", function() {

  var itp, result;

  beforeEach(function() {
    itp = new salliedforth.Interpreter();
  });

  function expectResult( inStr, out ) {
    result = itp.interpret(inStr);
    expect(result).toBe(out);
  }

  // Utility Functions

  it("is at version 0.0.1", function() {
    expect(itp.versionString).toBe('0.0.1');
  });

  describe("Value Store", function() {

    it("returns undefined for values that haven't been set.", function() {
      var name = "boff";
      result = itp.getValue( name );
      expect(result).not.toBeDefined();
    });

    it("can set and get integer values.", function() {
      var name = "boff1";
      itp.setValue( name, -99 );
      result = itp.getValue( name );
      expect(result).toBe( -99 );
    });

    it("can set and get string values.", function() {
      var name = "boff2";
      itp.setValue( name, "Hallelujah!" );
      result = itp.getValue( name );
      expect(result).toBe( "Hallelujah!" );
    });

    it("can set and get complex values.", function() {
      var name = "boff3";
      itp.setValue( name, {a: "help", c: 3.1} );
      result = itp.getValue( name );
      expect(result).toEqual( {a: "help", c: 3.1} );
    });

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

      it("throws an error when word can not be found.", function() {
        result = function() {
          itp.interpret('word jabberwocky find .');
        };
        expect(result).toThrow();
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

    describe("' function", function() {

      it("finds a word and returns it's function", function() {
        result = itp.interpret("' swap .");
        expect(result).toBeDefined();
        expect(result).not.toBe(null);
      });

    })

    describe( "! function", function() {

      it("stores an integer value by name (name, value)", function() {
        result = itp.interpret("word speed 87 ! .l");
        expect( result ).toBe('0'); // stack length 0
        expect( itp.valueStore['speed'] ).toEqual(87); // only reach into valueStore for tests.
      });

    });

    describe( "@ function", function() {

      it("retieves an integer value by name", function() {
        itp.interpret("word pressure 10102 ! .l");
        result = itp.interpret("word pressure @ .l .");
        expect( result ).toBe('1 10102');
      });

      it("throws an error if stack is empty", function() {
        result = function() {
          itp.interpret("@");
        };
        expect(result).toThrow();
      });

    });

    describe("CREATE", function() {

      it("it creates a new CustomCommand", function() {
        result = itp.interpret('word spoon create .l');
        expect(result).toEqual('0');
        expect(itp.newCommand).toBeDefined();
      });

      it("throws an error if no name is supplied.", function() {
        result = function() {
          itp.interpret('create');
        };
        expect(result).toThrow();
      });

      it("throws an error if create already called.", function() {
        itp.interpret('word andy create');
        result = function() {
          itp.interpret('word gill create');
        };
        expect(result).toThrow();
      });

    });

    describe("[ and ] functions", function() {

      it("[ sets compilationMode to true.", function() {
        expect(itp.compilationMode).toBeFalsy();
        itp.interpret('[');
        expect(itp.compilationMode).toBe(true);
      });

      it("] sets compilationMode to false and needs to run as immediate.", function() {
        expect(itp.compilationMode).toBeFalsy();
        itp.interpret('[');
        expect(itp.compilationMode).toBe(true);
        itp.interpret(']');
        expect(itp.compilationMode).toBeFalsy();
      });

    });

    describe("; (SEMICOLON) function", function() {

      it("exits compilation mode.", function() {
        itp.interpret('[');
        expect(itp.compilationMode).toBeTruthy();
        itp.interpret(';');
        expect(itp.compilationMode).toBeFalsy();
      });

      it("updates dictionaryHead.", function() {
        var oldDictionaryHead = itp.dictionaryHead;
        itp.interpret("word aaa create");
        expect(oldDictionaryHead).toEqual(itp.dictionaryHead);
        itp.interpret("] ;");
        expect(oldDictionaryHead).not.toEqual(itp.dictionaryHead);
      });

      it("creates a findable item in the dictionary.", function() {
        itp.interpret('word newby create ;');
        result = itp.interpret('word newby find .l');
        expect(result).toBe('1');
      });

      it("clears newCommand variable.", function() {
        result = itp.interpret('word hippo create ;');
        expect(itp.newCommand).not.toBeDefined();
      });

    });

  });

  describe("Defining new words", function() {

    it("unfound word throws an error", function() {
      result = function() {
        itp.interpret("faker");
      };
      expect(result).toThrow();
    });

    describe(": function", function() {

      it("creates a new word.", function() {
        itp.interpret(': monolith ;');
        expect(itp.compilationMode).toBeFalsy();
      });

      it("creates a findable word.", function() {
        itp.interpret(': cuckoo ;');
        var result2;
        result = function() {
          result2 = itp.interpret("word cuckoo find .l");
        };
        expect(result).not.toThrow();
        expect(result2).toBe('1');
        // not sure how to test validity of find result, maybe I don't need to yet.
      });

      it("can create a word which can call other functions.", function() {
        itp.interpret(': dup+ dup + ;');
        result = itp.interpret('23 dup+ .l .');
        expect(result).toBe('1 46');
      });

    });

    describe("LIT", function() {

      it("puts the following command as a literal on the stack.", function() {
        result = itp.interpret('lit 99 .l .');
        expect(result).toBe('1 99');
        result = itp.interpret('lit help_me_rhonda! .l .');
        expect(result).toBe('1 help_me_rhonda!');
      });

      it("puts the following command as a literal on the stack in compilation more.", function() {
        result = itp.interpret('[ lit 47 ] exec .l .');
        expect(result).toBe('1 47');
      });

    });

  });

  describe("Anonymous Functions", function() {

    describe("[", function() {

      it("creates an anonymous function on the stack", function() {
        expectResult('[ dup + ] 7 swap exec .l .', '1 14');
      });

    });

    describe("exec", function() {

    });

  });

});