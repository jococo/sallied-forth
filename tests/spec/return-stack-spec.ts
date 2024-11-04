import { Interpreter } from 'salliedforth';

describe("Return Stack functions", function() {

  let browserInt: Interpreter;
  let bResult: any;

  beforeEach(function() {
    browserInt = new Interpreter(window);
    bResult = null;
  });

  it('>R should make the return stack larger and the data stack smaller.', function() {
    bResult = browserInt.interpret('1 2 3 >R');
    expect(bResult.stackSize).toBe(2);
    expect(bResult.returnStackSize).toBe(1);
  });

  it('R> should make the return stack smaller and the data stack larger.', function() {
    bResult = browserInt.interpret('1 >R ( stack is empty at this point ) 2 3 R>');
    expect(bResult.stackSize).toBe(3);
    expect(bResult.returnStackSize).toBe(0);
  });

  it('R@ should add to data stack but not affect return stack', function() {
    bResult = browserInt.interpret('99 >R R@');
    expect(bResult.stackSize).toBe(1);
    expect(bResult.returnStackSize).toBe(1);
  });

  it('I should add to data stack but not affect return stack', function() {
    bResult = browserInt.interpret('100 101 >R I');
    expect(bResult.stackSize).toBe(2);
    expect(bResult.returnStackSize).toBe(1);
  });

  it('J should add to data stack but not affect return stack', function() {
    bResult = browserInt.interpret('1 >R 2 >R 3 >R 4 >R J');
    expect(bResult.stackSize).toBe(1);
    expect(bResult.returnStackSize).toBe(4);
    expect(browserInt.popFromDataStack()).toBe(2);
  });

});
