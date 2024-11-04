import { Interpreter } from '../../src/js/salliedforth';

describe("Flow Control", function() {

  let interpreter: Interpreter;
  let bResult: any;
  let context: any;

  beforeEach(function() {
    context = {};
    interpreter = new Interpreter(context);
    bResult = null;
  });

  describe('DO LOOPs', function() {

    xit('can perform a simple loop', function() {
      bResult = interpreter.interpret('5 0 do loop');
      expect(context).toEqual({hey: 'jude'});
    });

  });

});
