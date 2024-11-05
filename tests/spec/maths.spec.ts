import { Interpreter } from '../../src/ts/Interpreter';

describe("Maths functions", function() {

  let itp: Interpreter;
  let result: any;

  beforeEach(function() {
    itp = new Interpreter({});
  });

  function expectResult(inStr: string, out: any) {
    result = itp.interpret(inStr);
    const resultFirst = result.pop();
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
