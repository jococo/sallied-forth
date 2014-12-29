describe("Flow Control", function() {

  var interpreter, bResult, context;

  beforeEach(function() {
    context = {};
    interpreter = new salliedforth.Interpreter( context );
    bResult = null;
  });

  describe('DO LOOPs', function() {

    xit('can perform a simple loop', function() {
      bResult = interpreter.interpret('5 0 do loop');
      expect(context).toBe({hey: 'jude'});
    });

  });


});