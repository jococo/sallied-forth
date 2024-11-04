import { Interpreter } from '../../src/js/salliedforth';

describe("Browser interop", function() {

  let ini: Interpreter;
  let r: any;
  let ii: (input: string) => any;

  beforeEach(function() {
    ini = new Interpreter(window);
    ii = ini.interpret.bind(ini);
    r = null;
  });

  describe('CREATE', function() {

    it('takes the next word as input and adds to the dictionary', function() {
      const dh = ini.dictionaryHead;
      r = ii('create frank');
      expect(ini.newCommands.current().name).not.toBe(dh.name);
    });

  });

});
