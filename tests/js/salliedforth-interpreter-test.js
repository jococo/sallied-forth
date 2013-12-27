describe("The Interpreter", function() {

  var itp, result;

  beforeEach(function() {
    itp = new salliedforth.Interpreter();
  });

  function expectResult( inStr, out ) {
    result = itp.interpret(inStr);
    var resultFirst = result.pop();
    if( Array.isArray( out ) ) {
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

  describe('WHILE', function() {

    it("takes a function and a boolean", function() {
      expectResult("' dup false while .l", 0);
    });

    it("continues until false is on top of stack", function() {
      expectResult("fn{ false } true while .l", 0);
    });

  });

  describe("Comments", function() {

    describe("( comment function", function() {

      it("starts a comment", function() {
        expectResult('2 3 + ( adding the two numbers together ) .', 5);
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
      expect(result.data[0]).toEqual([17,"frank"]);
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
        expect(result.data[0]).toEqual([1,2,3,99]);
      });

      it("returns message for an empty stack and length stays at 0.", function() {
        result = itp.interpret('.s');
        expect(result.data.pop()).toBe('[stack empty]');
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

  describe("Stack Manipulation", function() {

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
        expect(result.stackLength).toBe(0);
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


  describe("Maths functions", function() {

    describe("+ (PLUS) function", function() {

      it("adds the top two stack items pushing the result on the stack.", function() {
        result = itp.interpret("7 4 + .");
        expect(result.pop()).toBe(11);
      });

      it("throws error on less than two numbers.", function() {
        expectThrow('+');
        expectThrow('1 +');
      });
    });

    describe("* (MULT) function", function() {

      it("multiplies the top two stack items pushing the result on the stack.", function() {
        result = itp.interpret("6 5 * .");
        expect(result.pop()).toBe(30);
      });

      it("throws error on less than two numbers.", function() {
        expectThrow('*');
        expectThrow('1 *');
      });
    })

    describe("- (MINUS) function", function() {

      it("subtracts the top two stack items pushing the result on the stack.", function() {
        result = itp.interpret("19 6 - .");
        expect(result.pop()).toBe(13);
      });

      it("throws error on less than two numbers.", function() {
        expectThrow('-');
        expectThrow('1 -');
      });

    })

    describe("/ (DIV) function", function() {

      it("divides the top two stack items pushing the result on the stack.", function() {
        result = itp.interpret("35 5 / .");
        expect(result.pop()).toBe(7);
      });

      it("throws error on less than two numbers.", function() {
        expectThrow('/');
        expectThrow('1 /');
      });

    })

    describe("% (MOD) function", function() {

      it("divides the top two stack items pushing the remainder on the stack.", function() {
        result = itp.interpret("83 6 % .");
        expect(result.pop()).toBe(5);
      });

      it("throws error on less than two numbers.", function() {
        expectThrow('%');
        expectThrow('1 %');
      });

    });

    describe("= (EQUALS) function", function() {
      it("equals uses JavaScript ===", function() {
        // yes
        expectResult('1 1 = .', true);
        expectResult('1.0 1 = .', true);
        expectResult('0 1.0 + 1 = .', true);
        expectResult('word bob word bob = .', true);
        // no
        expectResult('19 100 = .', false);
        expectResult('word bob word Bob = .', false);
        expectResult('word true true = .', false);
      });
    });

    describe('INC function', function() {

      it("increments the top value on the stack", function() {
        expectResult('4 inc .', 5);
      });

    });

    describe('DEC function', function() {

      it("decrements the top value on the stack", function() {
        expectResult('4 dec .', 3);
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

    })

    describe( "! function", function() {

      it("stores an integer value by name (name, value)", function() {
        result = itp.interpret("word speed 87 ! .l");
        expect( result.pop() ).toBe(0); // stack length 0
        expect( itp.valueStore['speed'] ).toEqual(87); // only reach into valueStore for tests.
      });

    });

    describe( "@ function", function() {

      it("retieves an integer value by name", function() {
        itp.interpret("word pressure 10102 !");
        result = itp.interpret("word pressure @ .");
        expect( result.pop() ).toBe(10102);
      });

      it("throws an error if stack is empty", function() {
        expectThrow('@');
      });

    });

    describe("CREATE", function() {

      it("it creates a new CustomCommand", function() {
        result = itp.interpret('word spoon create .l');
        expect(result.pop()).toEqual(0);
        expect(itp.newCommand).toBeDefined();
      });

      it("throws an error if no name is supplied.", function() {
        expectThrow('create');
      });

      it("throws an error if create already called.", function() {
        itp.interpret('word andy create');
        result = function() {
          itp.interpret('word gill create');
        };
        expect(result).toThrow();
      });

    });

    describe("fn{ and } functions", function() {

      it("fn{ sets compilationMode to true.", function() {
        expect(itp.compilationMode).toBeFalsy();
        itp.interpret('fn{');
        expect(itp.compilationMode).toBe(true);
      });

      it("} sets compilationMode to false and needs to run as immediate.", function() {
        expect(itp.compilationMode).toBeFalsy();
        itp.interpret('fn{');
        expect(itp.compilationMode).toBe(true);
        itp.interpret('}');
        expect(itp.compilationMode).toBeFalsy();
      });

    });

    describe("; (SEMICOLON) function", function() {

      it("exits compilation mode.", function() {
        itp.interpret('fn{');
        expect(itp.compilationMode).toBeTruthy();
        itp.interpret(';');
        expect(itp.compilationMode).toBeFalsy();
      });

      it("updates dictionaryHead.", function() {
        var oldDictionaryHead = itp.dictionaryHead;
        itp.interpret("word aaa create");
        expect(oldDictionaryHead).toEqual(itp.dictionaryHead);
        itp.interpret("} ;");
        expect(oldDictionaryHead).not.toEqual(itp.dictionaryHead);
      });

      it("creates a findable item in the dictionary.", function() {
        itp.interpret('word newby create ;');
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
        expect(itp.compilationMode).toBeFalsy();
      });

      it("creates a findable word.", function() {
        itp.interpret(': cuckoo ;');
        var result2;
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
      expectResult('anum .s', [333,222]);
    });
  });

  describe("Anonymous Functions", function() {

    describe("fn{", function() {

      it("creates an anonymous function on the stack", function() {
        expectResult('7 fn{ dup + } exec .', 14);
      });

    });

    describe("EXEC function", function() {

      it("can run a function on the stack", function() {
        expectResult('12 19 word + find exec .', 31);
      });

    });

  });

  describe("Arrays", function() {

    it("are defined using '[' and ']'.", function() {
      result = itp.interpret('[ 1 2 3 ] .l .s');
      expect(result.pop()).toEqual([[1,2,3]]);
      expect(result.stackLength).toBe(1);
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

    xit("can be nested", function() {
      expectResult('[ 1 [ 2 ] 3 ] .l .s', '1 null');
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
      expect(result.data[1]).toEqual({ a: 17 });
    });

    it("throws an error if there an odd number of keys+values", function() {
      expectThrow('{ jeff 1999 oops }');
    });

  })

  // what sort of a word is interop?
  describe("JavaScript interoperability", function() {

    // proxy class for JS communication
    var JSWorld = function() {
      var self = this;

      // access at the root level
      this.rootCount = 23;
      this.rootHeat = 88.97;
      this.rootName = 'Rudolph';
      this.rootHello = function() {
        return "Hello from Root!";
      };
      this.rootAdd = function(num) {
        self.rootCount += num;
      };
      this.rootNames = [
        "Anne", "Bobby", "Catherine", "Dave", "Esther", "Fred", "Gill",
        "Henry", "Ida", "Joseph", "Kate", "Lyndon", "Marie", "Neil"
      ];
      this.rootDomain = {
        title: 'Domain',
        count: 99
      };

      // nested access (within arrays, objects, functions)
    };

    // create local variables for this section to test JS interoperability.
    var forthInt, jsWorld, jsResult;

    beforeEach(function() {
      jsWorld = new JSWorld();
      forthInt = new salliedforth.Interpreter( jsWorld );
    })

    describe("from Sallied-Forth", function() {

      describe("getting JS properties", function() {
        it("can get integers", function() {
          jsResult = forthInt.interpret('js@ rootCount .l .');
          expect(jsResult.data).toEqual([1,23]);
        });
        it("can get floats", function() {
          jsResult = forthInt.interpret('js@ rootHeat .l .');
          expect(jsResult.data).toEqual([1,88.97]);
        });
        it("can get strings", function() {
          jsResult = forthInt.interpret('js@ rootName .');
          expect(jsResult.pop()).toEqual('Rudolph');
        });

        it("can get arrays", function() {
          jsResult = forthInt.interpret('js@ rootNames array? .');
          expect(jsResult.pop()).toEqual(true);
        });

        it("can get objects", function() {
          jsResult = forthInt.interpret('js@ rootDomain object? .');
          expect(jsResult.pop()).toEqual(true);
        });

        it("throws an error if property doesn't exist", function() {
          expectThrow("js@ jabberwocky729");
        });
      });

      describe("setting JS properties", function() {
        it("can set integers", function() {
          forthInt.interpret('90 js! rootCount');
          jsResult = forthInt.interpret('js@ rootCount .l .');
          expect(jsResult.data).toEqual([1,90]);
        });
        it("can set floats", function() {
          forthInt.interpret('13.789 js! rootHeat');
          jsResult = forthInt.interpret('js@ rootHeat .l .');
          expect(jsResult.data).toEqual([1,13.789]);
        });
        it("can set strings", function() {
          forthInt.interpret('word BorisJingle js! rootName');
          jsResult = forthInt.interpret('js@ rootName .');
          expect(jsResult.pop()).toEqual('BorisJingle');
        });

        it("can set arrays", function() {
          forthInt.interpret('[ 1 2 3 ] js! rootNames');
          jsResult = forthInt.interpret('js@ rootNames array? .');
          expect(jsResult.pop()).toEqual(true);
        });

        it("can set objects", function() {
          forthInt.interpret('{ b 4 } js! rootDomain');
          jsResult = forthInt.interpret('js@ rootDomain object? .');
          expect(jsResult.pop()).toEqual(true);
        });

        it("throws an error if propertyName missing", function() {
          expectThrow("99 js!");
        });
      });




      describe("calling JS functions", function() {

      });

    })

    describe("from JavaScript", function() {



    })

  });

});