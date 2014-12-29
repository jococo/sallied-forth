describe("Browser interop", function() {

  var ini, r, ii;

  beforeEach(function() {
    ini = new salliedforth.Interpreter( window );
    ii = ini.interpret;
    r = null;
  });

  describe('CREATE', function() {

    it('takes the next word as input and adds to the dictionary', function() {
      var dh = ini.dictionaryHead;
      r = ii('create frank');
      expect(ini.newCommands.current().name).not.toBe(dh.name);
    });

  });

});
