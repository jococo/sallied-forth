
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
    this.rootAdd = function(num1, num2) {
      return num1 + num2;
    };
    this.rootCountInc = function(num) {
      if( num ) {
        self.rootCount += num;
      } else {
        self.rootCount += 1;
      }
    };
    this.rootReturnOnly = function() {
      return [ 'help', 'me!' ];
    };

    this.rootNames = [
      "Anne", "Bobby", "Catherine", "Dave", "Esther", "Fred", "Gill",
      "Henry", "Ida", "Joseph", "Kate", "Lyndon", "Marie", "Neil"
    ];
    this.rootDomain = {
      title: 'awesome!',
      count: 99,
      runIt: function( msg ) {
        return "returning. " + msg;
      }
    };

    this.Thing = function(a, b) {
      this.name = a;
      this.num = b;
    };

    this.Object = Object;

    // nested access (within arrays, objects, functions)
  };

  // create local variables for this section to test JS interoperability.
  var forthInt, jsWorld, jsResult;

  beforeEach(function() {
    jsWorld = new JSWorld();
    forthInt = new salliedforth.Interpreter( jsWorld );
  });

  function expectThrow( inStr ) {
    result = function() {
      itp.interpret(inStr);
    };
    expect(result).toThrow();
  }



  describe("from Sallied-Forth", function() {

    describe('native JS objects', function() {
      it('can create an empty array', function() {
        jsResult = forthInt.interpret('[] .');
        var val = jsResult.pop();
        expect(Array.isArray(val)).toBeTruthy();
        expect(val.length).toBe(0);
      });
      it('can create an empty Object', function() {
        jsResult = forthInt.interpret('{} .');
        var val = jsResult.pop();
        expect(val).toEqual({});
        expect(typeof val).toEqual("object");
      });
      it('can create a null', function() {
        jsResult = forthInt.interpret('null .');
        var val = jsResult.pop();
        expect(val).toBe(null);
      });
      it('can create an undefined', function() {
        jsResult = forthInt.interpret('undefined .');
        var val = jsResult.pop();
        expect(val).toBe(undefined);
      });
    });

    describe('creating new JS objects', function() {
      it('can instantiate a new empty Object', function() {
        jsResult = forthInt.interpret('[] jsnew Object .');
        var item = jsResult.pop();
        expect(item).toEqual({});
      });
      it('can instantiate a new function with parameters', function() {
        jsResult = forthInt.interpret('" help" 3 arity2 jsnew Thing .');
        var item = jsResult.pop();
        expect(item.name).toEqual('help');
        expect(item.num).toEqual(3);
      });
    });

    describe("getting JS properties", function() {
      it("can get integers", function() {
        jsResult = forthInt.interpret('word rootCount @ .l .');
        expect(jsResult.data).toEqual([1,23]);
      });
      it("can get floats", function() {
        jsResult = forthInt.interpret('word rootHeat @ .l .');
        expect(jsResult.data).toEqual([1,88.97]);
      });
      it("can get strings", function() {
        jsResult = forthInt.interpret('word rootName @ .');
        expect(jsResult.pop()).toEqual('Rudolph');
      });

      it("can get arrays", function() {
        jsResult = forthInt.interpret('word rootNames @ array? .');
        expect(jsResult.pop()).toEqual(true);
      });

      it("can get objects", function() {
        jsResult = forthInt.interpret('word rootDomain @ object? .');
        expect(jsResult.pop()).toEqual(true);
      });

      it("throws an error if property doesn't exist", function() {
        expectThrow("word jabberwocky729 @");
      });
    });

    describe('GET', function() {
      it('can retrieve an integer', function() {
        jsResult = forthInt.interpret('word rootDomain @ get count .');
        expect(jsResult.pop()).toBe(99);
      });
      it('can retrieve a string', function() {
        jsResult = forthInt.interpret('word rootDomain @ get title .');
        expect(jsResult.pop()).toBe('awesome!');
      });
      it('can retrieve a function', function() {
        jsResult = forthInt.interpret('word rootDomain @ get runIt [ help ] jsexec- .');
        expect(jsResult.pop()).toBe('returning. help');
      });
    });

    describe("setting JS properties", function() {
      it("can set integers", function() {
        forthInt.interpret('90 word rootCount !');
        jsResult = forthInt.interpret('word rootCount @ .l .');
        expect(jsResult.data).toEqual([1,90]);
      });
      it("can set floats", function() {
        forthInt.interpret('13.789 word rootHeat !');
        jsResult = forthInt.interpret('word rootHeat @ .l .');
        expect(jsResult.data).toEqual([1,13.789]);
      });
      it("can set strings", function() {
        forthInt.interpret('word BorisJingle word rootName !');
        jsResult = forthInt.interpret('word rootName @ .');
        expect(jsResult.pop()).toEqual('BorisJingle');
      });

      it("can set arrays", function() {
        forthInt.interpret('[ 1 2 3 ] word rootNames !');
        jsResult = forthInt.interpret('word rootNames @ array? .');
        expect(jsResult.pop()).toEqual(true);
      });

      it("can set objects", function() {
        forthInt.interpret('{ b 4 } word rootDomain !');
        jsResult = forthInt.interpret('word rootDomain @ object? .');
        expect(jsResult.pop()).toEqual(true);
      });

      it("throws an error if propertyName missing", function() {
        expectThrow("99 !");
      });
    });

    describe("calling JS functions", function() {

      it("can call js functions with no params no return value", function() {
        jsResult = forthInt.interpret('rootCountInc'); // no return
        jsResult = forthInt.interpret('word rootCount @ .l .');
        expect(jsResult.data).toEqual([1,24]);
      });

      it("can call js functions with params, no return value", function() {
        jsResult = forthInt.interpret('[ 18 ] js rootCountInc');
        jsResult = forthInt.interpret('word rootCount @ .l .');
        expect(jsResult.data).toEqual([1,41]);
      });

      it("can call js functions with 2 params and return value", function() {
        jsResult = forthInt.interpret('[ 19 18 ] js- rootAdd .');
        expect(jsResult.pop()).toEqual(37);
      });

      it("can call js functions with 2 params and return value using arity", function() {
        jsResult = forthInt.interpret('20 45 2 arity js- rootAdd .');
        expect(jsResult.pop()).toEqual(65);
      });

      it("can call js functions with 2 params and return value using arity2 helper", function() {
        jsResult = forthInt.interpret('122 105 arity2 js- rootAdd .');
        expect(jsResult.pop()).toEqual(227);
      });

      it("can call js functions with no params, but a return value", function() {
        jsResult = forthInt.interpret('[] js- rootReturnOnly .');
        expect(jsResult.pop()).toEqual(['help','me!']);
      });

    });

    describe("Nested Properties", function() {

      it("word can @ reach into js objects to retrieve values", function() {
        jsResult = forthInt.interpret('word rootDomain.title @ .');
        expect(jsResult.pop()).toBe('awesome!');
        jsResult = forthInt.interpret('word rootDomain.count @ .');
        expect(jsResult.pop()).toBe(99);
      });

      it("! can reach into js objects to set values", function() {
        jsResult = forthInt.interpret('word awesomer!! word rootDomain.title !');
        jsResult = forthInt.interpret('word rootDomain.title @ .');
        expect(jsResult.pop()).toBe('awesomer!!');
        jsResult = forthInt.interpret('100 word rootDomain.count !');
        jsResult = forthInt.interpret('word rootDomain.count @ .');
        expect(jsResult.pop()).toBe(100);
      });

      it("js- can reach into js objects to run functions", function() {
        jsResult = forthInt.interpret('[ things ] js- rootDomain.runIt .');
        expect(jsResult.pop()).toBe('returning. things');
      });

    });

  });

});

