
describe("Browser interop", function() {

  var browserInt, bResult;

  beforeEach(function() {
    browserInt = new salliedforth.Interpreter( window );
    bResult = null;
  });

  it("document.getElementById should work", function() {
    var div = document.createElement('div');
    div.id="testcase1";
    document.body.appendChild(div);
    // var temp = document.getElementById('testcase1');

    bResult = browserInt.interpret('[ testcase1 ] js- document.getElementById .');

    expect( bResult.pop().id ).toBe('testcase1'); // fetched from HTMLNode
    document.body.removeChild(div);
  });

  describe("Using console.log", function() {

    it("js console.log should not throw an error", function() {
      bResult = function() {
        browserInt.interpret('[ ah! ] js console.log');
      };
      expect(bResult).not.toThrow();
    });

    it("can call JS functions from anonymous functions", function() {
      bResult = function() {
        browserInt.interpret( 'fn{ [ hey! ] js console.log } exec' );
      };
      expect(bResult).not.toThrow();
    });

  });

  it("can call and return values from anon functions", function() {
    bResult = browserInt.interpret( 'fn{ [ div ] js- document.createElement } exec .' );
    expect(bResult.pop().nodeName).toBe('DIV');
  });

});


/**
  * Is there much to test from the JavaScript side of things?
  */
describe("from JavaScript", function() {

  // test add external libs maybe?

  // test event listeners, promises?

  var browserInt = new salliedforth.Interpreter( window );
  var bResult;

  it('can execute a simple stack push an pop', function() {
    bResult = browserInt.interpret('1 .');
    expect(bResult.stackSize).toBe(0);
  });

});
