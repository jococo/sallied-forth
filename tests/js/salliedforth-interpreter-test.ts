describe("The Interpreter", function() {

  var itp: any, result: any;

  beforeEach(function() {
    itp = new salliedforth.Interpreter();
  });

  function expectResult(inStr: string, out: any) {
    result = itp.interpret(inStr);
    var resultFirst = result.pop();
    if (Array.isArray(out) || (out === Object(out))) {
      expect(resultFirst).toEqual(out);
    } else {
      expect(resultFirst).toBe(out);
    }
  }

  function expectThrow(inStr: string) {
    result = function() {
      itp.interpret(inStr);
    };
    expect(result).toThrow();
  }

  // Utility Functions

  it("is at version 0.0.2", function() {
    expect(itp.versionString).toBe('0.0.2');
  });

  it("shouldn't get confused by spaces at start", function() {
    expectResult(' 9 9 * .', 81);
  });

  it("shouldn't get confused by multiple spaces", function() {
    expectResult('3 2  + .', 5);
    expectResult('9        7  *   .   ', 63);
  });

  it("shouldn't get confused by carriage returns", function() {
    expectResult('3\n2  + .', 5);
    expectResult('9        7  *   .   ', 63);
  });

  describe("Value Store", function() {

    beforeEach(function() {
      itp = new salliedforth.Interpreter({aaa: {bbb: {ccc: -1999}}});
    });

    it("returns undefined for values that haven't been set.", function() {
      var name = "boff";
      result = itp.getValue(name);
      expect(result).not.toBeDefined();
    });

    it("can set and get integer values.", function() {
      var name = "boff1";
      itp.setValue(name, -99);
      result = itp.getValue(name);
      expect(result).toBe(-99);
    });

    it("can set and get string values.", function() {
      var name = "boff2";
      itp.setValue(name, "Hallelujah!");
      result = itp.getValue(name);
      expect(result).toBe("Hallelujah!");
    });

    it("can set and get complex values.", function() {
      var name = "boff3";
      itp.setValue(name, {a: "help", c: 3.1});
      result = itp.getValue(name);
      expect(result).toEqual({a: "help", c: 3.1});
    });

    it("can reach into nested objects", function() {
      var name = "aaa.bbb.ccc";
      result = itp.getValue(name);
      expect(result).toEqual(-1999);
      result = itp.setValue(name, 2001);
      result = itp.getValue(name);
      expect(result).toEqual(2001);
    });

  });

  describe('WHILE', function() {

    it("takes a function and a boolean", function() {
      expectResult("' dup false while .l", 0);
    });

    it("continues until false is on top of stack", function() {
      expectResult("fn{ false } true while .l", 0);
    });

    xit('can reach the stack', function() {
      expectResult("5 fn{ dec dup 0 > } true while .l", 99);
    });

  });

  describe("Comments and Strings", function() {

    describe("( comment function", function() {

      it("starts a comment", function() {
        expectResult('2 3 + ( adding the two numbers together ) .', 5);
      });
    });

    describe('" function', function() {
      it("creates an inline string", function() {
        expectResult('" aint it so?" .', "aint it so?");
      });

      it("creates an inline string at compile time", function() {
        itp.interpret(': gerty " a b c" . ;');
        expectResult('.l', 0);
        expectResult('gerty', 'a b c');
      });
    });

  });

  describe('NOT function', function() {

    it("pushes the boolean opposite of the top stack item", function() {
      expectResult('true not .', false);
      expectResult('false not .', true);
      expectResult('5 not .', false);
      expectResult('0 not .', true);
      expectResult('word bob not .', false);
    });

  })

  // stack
  describe("stack", function() {

    it("is empty at start.", function() {
      result = itp.interpret('.l');
      expect(result.data[0]).toBe(0);
    });

    it("can have a number added.", function() {
      result = itp.interpret('99 .');
      expect(result.data[0]).toBe(99);
    });

    it("can show it's length.", function() {
      result = itp.interpret('33 22 9 17 4 .l');
      expect(result.data[0]).toBe(5);
    });

    it("can print out it's contents.", function() {
      result = itp.interpret('17 word frank .s');
      expect(result.data[0]).toEqual([17, "frank"]);
    });

    // . function, shows the top item on the stack
    describe("'.' function", function() {

      it("takes the top item.", function() {
        result = itp.interpret('1 2 3 99 .');
        expect(result.data.pop()).toBe(99);
      });

      it("throws an error for an empty stack.", function() {
        expectThrow('.');
      });

    });

    // .s function, shows the stack contents
    describe("'.s' function", function() {

      it("returns all the items.", function() {
        result = itp.interpret('1 2 3 99 .s');
        expect(result.data[0]).toEqual([1, 2, 3, 99]);
      });

      it("returns message for an empty stack and length stays at 0.", function() {
        result = itp.interpret('.s');
        expect(result.data.pop()).toBe('[data stack empty]');
      });

    });

    // .l function, shows the length of the stack
    describe("'.l' function", function() {

      it("shows length as 0 for empty stack", function() {
        result = itp.interpret('.l');
        expect(result.pop()).toBe(0);
      });

      it("", function() {
        result = itp.interpret('1 2 3 4 5 6 7 8 9 .l');
        expect(result.data.pop()).toBe(9);
      });

    });

  });

  describe("Command functions", function() {
    describe("WORD", function() {

      it("drops the next word on the stack.", function() {
        result = itp.interpret('word bob .');
        expect(result.pop()).toBe('bob');
      });

      it("throws an error if there is no next word.", function() {
        expectThrow('word');
      });

      it("will pick up any other command as a word.", function() {
        result = itp.interpret('word .l .');
        expect(result.pop()).toBe('.l');
      });

      it("will push numbers as strings too", function() {
        result = itp.interpret('word 999 .');
        expect(result.pop()).toBe('999');
      });

    });

    describe("FIND", function() {

      it("can find a system word.", function() {
        result = itp.interpret('word dup find .l');
        expect(result.pop()).toBe(1);
      });

      it("returns a JavaScript Object.", function() {
        result = itp.interpret('word dup find .');
        expect(result.pop().name).toBe('dup');
      });

      it("can find itself.", function() {
        result = itp.interpret('word word find .');
        expect(result.pop().name).toBe('word');
      });

      it("throws an error when word can not be found.", function() {
        expectThrow('word jabberwocky find .');
      });

    });

    // no idea what this stands for. In this implementation converts
    // Command object into it's function.
    describe(">CFA", function() {

      it("returns the function ref for a found word.", function() {
        result = itp.interpret('word dup find >cfa .');
        expect(result.pop()).toBeDefined();
      });

      it("throws an error if no defn object is available.", function() {
        expectThrow('1 >cfa');
      });

    });

    describe("' function", function() {

      it("finds a word and returns it's function", function() {
        result = itp.interpret("' swap .");
        expect(result.pop()).toBeDefined();
        expect(result.pop()).not.toBe(null);
      });

    });

    describe("! function", function() {

      it("stores an integer value by name (value, name)", function() {
        result = itp.interpret("87 word speed ! .l");
        expect(result.pop()).toBe(0); // stack length 0
        expect(itp.valueStore['speed']).toEqual(87); // only reach into valueStore for tests.
      });

    });

    describe("@ function", function() {

      it("retieves an integer value by name", function() {
        itp.interpret("10102 word pressure !");
        result = itp.interpret("word pressure @ .");
        expect(result.pop()).toBe(10102);
      });

      it("throws an error if stack is empty", function() {
        expectThrow('@');
      });

    });

    describe("CREATE", function() {

      it("it creates a new CustomCommand", function() {
        result = itp.interpret('create spoon .s');
        expect(result.stackSize).toEqual(0);
        expect(itp.newCommands.current()).toBeDefined();
      });

      it("throws an error if no name is supplied.", function() {
        expectThrow('create');
      });

    });

    describe("fn{ and } functions", function() {

      it("fn{ sets compilationMode to true.", function() {
        expect(itp.compilationMode()).toBeFalsy();
        itp.interpret('fn{');
        expect(itp.compilationMode()).toBe(true);
      });

      it("} sets compilationMode to false and needs to run as immediate.", function() {
        expect(itp.compilationMode()).toBeFalsy();
        itp.interpret('fn{');
        expect(itp.compilationMode()).toBe(true);
        itp.interpret('}');
        expect(itp.compilationMode()).toBeFalsy();
      });

      it("fn{ } creates a new function on the stack", function() {
        itp.interpret('fn{ dup * }');
        result = itp.interpret('12 swap exec .');
        expect(result.pop()).toBe(144);
      });

    });

    describe("; (SEMICOLON) function", function() {

      it("exits compilation mode.", function() {
        itp.interpret('fn{');
        expect(itp.compilationMode()).toBeTruthy();
        itp.interpret(';');
        expect(itp.compilationMode()).toBeFalsy();
      });

      it("updates dictionaryHead.", function() {
        var oldDictionaryHead = itp.dictionaryHead;
        itp.interpret("create aaa");
        expect(oldDictionaryHead).toEqual(itp.dictionaryHead);
        itp.interpret("} ;");
        expect(oldDictionaryHead).not.toEqual(itp.dictionaryHead);
      });

      it("creates a findable item in the dictionary.", function() {
        itp.interpret('create newby ;');
        result = itp.interpret('word newby find .l');
        expect(result.pop()).toBe(1);
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
        expect(itp.compilationMode()).toBeFalsy();
      });

      it("creates a findable word.", function() {
        itp.interpret(': cuckoo ;');
        var result2: any;
        result = function() {
          result2 = itp.interpret("word cuckoo find .");
        };
        expect(result).not.toThrow();
        expect(result2.pop().name).toBe('cuckoo');
      });

      it("can create a word which can call other functions.", function() {
        itp.interpret(': dup+ dup + ;');
        result = itp.interpret('23 dup+ .');
        expect(result.pop()).toBe(46);
      });

    });

    describe("LIT function", function() {

      it("puts the following command as a literal on the stack.", function() {
        result = itp.interpret('lit 99 .');
        expect(result.pop()).toBe(99);
        result = itp.interpret('lit help_me_rhonda! .');
        expect(result.pop()).toBe('help_me_rhonda!');
      });

      it("puts the following command as a literal on the stack in compilation more.", function() {
        result = itp.interpret('fn{ lit 47 } exec .');
        expect(result.pop()).toBe(47);
      });

    });

  });

  describe("Redefining words", function() {

    it("redefining a word displays a warning.", function() {
      itp.interpret(': thingy 222 ;');
      expectResult(': thingy 111 ;', 'thingy is not unique.');
    });

    it("calling the redefined word in the definition should succeed.", function() {
      itp.interpret(': anum 333 ;');
      itp.interpret(': anum anum 222 ;');
      expectResult('anum .s', [333, 222]);
    });
  });

  describe("Anonymous Functions", function() {

    describe("fn{", function() {

      it("creates an anonymous function on the stack", function() {
        expectResult('7 fn{ dup + } exec .', 14);
      });

      it("can create an empty function", function() {
        expectResult('9 fn{ } exec .', 9);
      });

    });

    describe("EXEC function", function() {

      it("can run a function on the stack", function() {
        expectResult('12 19 word + find exec .', 31);
      });

    });

    describe("JS in anon function", function() {
      it("can be called", function() {
        result = itp.interpret('fn{ [ hey! ] . } exec');
        expect(result.pop()).toEqual(['hey!']);
      });

    });

  });

  describe("Arrays", function() {

    it("are defined using '[' and ']'.", function() {
      result = itp.interpret('[ 1 2 3 ] .s');
      expect(result.pop()).toEqual([[1, 2, 3]]);
      expect(result.stackSize).toBe(1);
    });

    it("are a single item on the stack", function() {
      expectResult('[ 5 6 7 8 9 10 11 ] .l', 1);
    });

    it("can be checked for with array?", function() {
      expectResult('[ 9 ] array? .', true);
      expectResult('9 array? .', false);
    });

    it("can be an empty array", function() {
      expectResult('[ ] array? .', true);
    });

    it("can contain single string", function() {
      result = itp.interpret('[ Halp ] .');
      expect(result.pop()).toEqual(['Halp']);
    });

    it("can contain functions", function() {
      result = itp.interpret('[] fn{ dup * } push');
      result = itp.interpret('pop 7.5 swap exec .');
      expect(result.pop()).toBe(56.25);
    });

  });

  describe("Objects", function() {

    it("are defined using '{' and '}'.", function() {
      result = itp.interpret('{ } dup object? . .');
      expect(result.data).toEqual([true, {}]);
    });

    it("can have properties set in pairs", function() {
      result = itp.interpret('{ a 17 } dup object? . .');
      expect(result.data[0]).toBe(true);
      expect(result.data[1]).toEqual({a: 17});
    });

    it("can have can accept a range of datatypes set in pairs", function() {
      result = itp.interpret('{ a 17 jeff koons bill bailey } dup object? . .');
      expect(result.data[0]).toBe(true);
      expect(result.data[1]).toEqual({a: 17, bill: 'bailey', jeff: 'koons'});
    });

    it("throws an error if there an odd number of keys+values", function() {
      expectThrow('{ jeff 1999 oops }');
    });

  });

  describe("Nesting", function() {

    it("Arrays can be nested in Arrays", function() {
      expectResult('[ 1 [ 2 ] 3 ] .', [1, [2], 3]);
    });

    it("Arrays can be nested in Arrays can be nested in Arrays", function() {
      expectResult('[ 19 [ 1 [ 2 ] 3 ] 99 ] .', [19, [1, [2], 3], 99]);
    });

    it("Arrays can be nested in Objects", function() {
      expectResult('{ a [ 2 4 8 ] b -99 } .', {a: [2, 4, 8], b: -99});
    });

    it("Objects can be nested in Objects", function() {
      expectResult('{ a { c 48 } b -99 } .', {a: {c: 48}, b: -99});
    });

    it("Objects can be nested in Objects can be nested in Objects", function() {
      expectResult('{ a { c 48 d { e 1000 } } b -99 } .',
        {a: {c: 48, d: {e: 1000}}, b: -99});
    });

    it("Objects can be nested in Arrays", function() {
      expectResult('[ 2 4 { a -99 } 8 ] .', [2, 4, {a: -99}, 8]);
    });

    it("Array items are retrieved with get", function() {
      result = itp.interpret("[ 1 2 9 7 ] get 2 .");
      expect(result.pop()).toBe(9);
    });

    it("Array items are written with set", function() {
      itp.interpret("[ a b c ] -99 set 1");
      result = itp.interpret("get 1 .");
      expect(result.pop()).toBe(-99);
    });

    it("Array items can be added with push", function() {
      result = itp.interpret("[ a b c ] 89 push .");
      expect(result.pop()).toEqual(['a', 'b', 'c', 89]);
    });

    it("Last Array item can be fetched with pop", function() {
      result = itp.interpret("[ 1 2 9 17 ] pop .");
      expect(result.pop()).toBe(17);
    });

    it("Object properties are retrieved with get", function() {
      result = itp.interpret("{ a 97 } get a .");
      expect(result.pop()).toBe(97);
      result = itp.interpret("{ a 97 b { c 28 } } get b.c .");
      expect(result.pop()).toBe(28);
    });

    it("Object properties are written with set", function() {
      itp.interpret("{ a 97 } 101 set b");
      result = itp.interpret("get b .");
      expect(result.pop()).toBe(101);
      itp.interpret("{ a 97 b { c 99 } } 1999 set b.c");
      result = itp.interpret("get b.c .");
      expect(result.pop()).toBe(1999);
    });

  });
});
