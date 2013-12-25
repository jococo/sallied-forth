(function(exports){
  "use asm";

  var CustomCommand = function( name, prev, execFn ) {
    var self = this;
    this.name = name;
    this.fn = function() {
      execFn(self.functions.map( function(defn) {
          return defn.fn;
        }));
    };
    this.prev = prev;
    this.functions = [];
    this.addFunction = function( fn ) {
      self.functions.push( fn );
    };
  };

  exports.Interpreter = function() {
    var self = this;

    this.dataStack = [];
    this.returnStack = [];
    this.dictionary = undefined;
    this.dictionaryHead = undefined;

    this.valueStore = {};

    this.version = {
      major: 0,
      minor: 0,
      build: 1,
      revision: undefined
    };
    this.versionString = ''+
      this.version.major+'.'+
      this.version.minor+'.'+
      this.version.build;
    if( this.version.revision ) {
      this.versionString = this.versionString + '.' + this.version.revision;
    }

    this.log = function(txt) {
      self.logFn && self.logFn( txt );
      return void 0;
    };

    this.error = function( txt ) {
      self.errorFn && self.errorFn( txt );
      return void 0;
    };

    this.pushToDataStack = function() {
      var args = Array.prototype.slice.call(arguments);
      args.forEach( function(item) {
        self.dataStack.push(item);
      } );
    };

    this.popFromDataStack = function() {
      return self.dataStack.pop();
    };

    this.addToDictionary = function( name, fn, imm ) {
      if( self.dictionaryHead ) {
        var newNode = {name: name, fn: fn, prev: self.dictionaryHead, immediate: !!imm};
        self.dictionaryHead = newNode;
      } else {
        self.dictionary = self.dictionaryHead = {name: name, fn: fn, immediate: !!imm};
      }
    };

    this.setValue = function( name, value ) {
      this.valueStore[name] = value;
    };

    this.getValue = function( name ) {
      return this.valueStore[name];
    };

    this.findDefn = function( head, name ) {
      if( name === head.name ) {
        return head;
      } else {
        if( head.prev ) {
          return self.findDefn( head.prev, name );
        } else {
          return undefined;
        }
      }
    };

    this.findDefinition = function(name) {
      if(self.dictionaryHead) {
        var defn = self.findDefn(self.dictionaryHead, name);
        return defn;
      }
      return undefined;
    };

    this.executeFunctions = function() {
      var args = Array.prototype.slice.call(arguments);
      args.forEach( function(fn) {
        fn();
      });
    };

    this.execute = function() {
      var args = Array.prototype.slice.call(arguments);
      var allFunctions = args.map(function(name) {
        var defn = self.findDefinition( name );
        if( defn ) {
          return defn.fn;
        } else {
          throw('Function ' + name + ' not found!');
        }
      });
      self.executeFunctions.apply( undefined, allFunctions );
    };

    this.addToDictionary('.', function() {
      self.log( self.popFromDataStack() );
    });

    /**
      * TODO Maybe specify endstops [ & ] so they can be changed?
      */
    this.addToDictionary('.s', function() {
      if( self.dataStack.length < 1 ) {
        self.log('[stack empty]');
      } else {
        self.log( '[' + self.dataStack.join(",") + ']');
      }
    });

    this.addToDictionary('.l', function() {
      self.log( self.dataStack.length );
    });

    this.addToDictionary('dup', function() {
      var val = self.popFromDataStack();
      if( val ) {
        self.pushToDataStack( val );
        self.pushToDataStack( val );
      }
    });

    this.addToDictionary('drop', function() {
      self.popFromDataStack();
    });

    this.addToDictionary('swap', function() {
      if( self.dataStack.length > 1 ) {
        var val1 = self.popFromDataStack();
        var val2 = self.popFromDataStack();
        self.pushToDataStack( val1, val2 );
      }
    });

    this.addToDictionary('over', function() {
      if( self.dataStack.length > 1 ) {
        var val = self.dataStack[ self.dataStack.length - 2 ];
        self.pushToDataStack( val );
      }
    });

    this.addToDictionary('+', function() { // ADD
      var val1 = self.popFromDataStack() || 0;
      var val2 = self.popFromDataStack() || 0;
      self.pushToDataStack( val1 + val2 );
    });

    this.addToDictionary('-', function() { // MINUS
      var val1 = self.popFromDataStack() || 0;
      var val2 = self.popFromDataStack() || 0;
      self.pushToDataStack( val2 - val1 );
    });

    this.addToDictionary('*', function() { // MULT
      var val1;
      if( self.dataStack.length < 1 ) {
        self.pushToDataStack( 1 );
      } else if ( self.dataStack.length === 1 ) {
        val1 = self.popFromDataStack() || 0;
        self.pushToDataStack( val1 );
      } else {
        val1 = self.popFromDataStack() || 0;
        var val2 = self.popFromDataStack() || 0;
        self.pushToDataStack( val1 * val2 );
      }
    });

    this.addToDictionary('/', function() { // DIV
      var val1 = self.popFromDataStack() || 0;
      if( self.dataStack.length < 1) { // compensating for 1 item already popped.
        self.pushToDataStack( 1 );
      } else {
        var val2 = self.popFromDataStack() || 0;
        self.pushToDataStack( val2 / val1 );
      }
    });

    this.addToDictionary('%', function() { // MOD
      var val1 = self.popFromDataStack() || 0;
      if( self.dataStack.length < 1) { // compensating for 1 item already popped.
        self.pushToDataStack( 0 ); // remainder
        self.pushToDataStack( 1 );
      } else {
        var val2 = self.popFromDataStack() || 0;
        var result = Math.floor( val2 / val1 );
        self.pushToDataStack( val2 - (val1 * result) ); // remainder
        self.pushToDataStack( result );
      }
    });

    // take the next word from the command stack and put it onto the data stack as a string
    this.addToDictionary('word', function() {
      var val = self.commands.shift();
      if( val ) {
        self.pushToDataStack( val );
      }
    });

    // TODO could this be the same as word, only immediate?
    this.addToDictionary('lit', function() {
      var val = self.commands.shift();
      if( val ) {
        self.pushToDataStack( val );
      }
    }, true);

    // find the definition
    this.addToDictionary('find', function() {
      var name = self.popFromDataStack();
      var defn = self.findDefinition( name );
      if( defn ) {
        self.pushToDataStack( defn );
        return;
      }
      self.error("Cannot find word '" + name + "'");
    });

    // convert the definition object to it's function
    this.addToDictionary('>cfa', function() {
      var defn = self.popFromDataStack();
      if( defn.fn ) {
        self.pushToDataStack( defn.fn );
      } else { // probably not a defn, push it back
        self.pushToDataStack( defn );
      }
    });

    this.addToDictionary('!', function() {
      if( self.dataStack.length > 1 ) {
        var value = self.popFromDataStack();
        var name = self.popFromDataStack();
        self.setValue(name, value);
      } else {
        self.error( '! needs a name and value' );
      }
    });

    this.addToDictionary('@', function() {
      if( self.dataStack.length > 0 ) {
        var name = self.popFromDataStack();
        self.pushToDataStack( self.getValue(name) );
      }
       else {
        self.error("@ needs a name input");
      }
    });

    this.addToDictionary("'", function() {
      self.execute('word', 'find', '>cfa'); // , 'next' TODO find out what 'next' does.
    });

    this.addToDictionary('create', function() {
      if(self.newCommand) {
        self.error('Already compiling ' + self.newCommand.name + '!');
      }
      if( self.dataStack.length > 0) {
        // get the object ready
        var cmd = new CustomCommand( self.popFromDataStack(), self.dictionaryHead, self.execute );
        self.newCommand =  cmd;
        return;
      }
      self.error("CREATE needs a name.");
    });

    this.addToDictionary('[', function() {
      self.compilationMode = true;
    });

    this.addToDictionary(']', function() {
      self.compilationMode = false;
    }, true);

    this.addToDictionary(';', function() {
      self.execute(']');
      self.dictionaryHead = self.newCommand;
      self.newCommand = void 0;
    }, true);

    this.addToDictionary(':', function() {
      self.execute('word', 'create', '[');
    });

    this.addToDictionary('.list', function() {
      var node = self.dictionaryHead;
      if( node ) {
        do {
          self.log(node.name);
        } while (node = node.prev);
      }
    }, true);

    this.processCommands = function() {
      var nextCommandName;
      while( nextCommandName = self.commands.shift() ) {

        if( nextCommandName ) {

          // check if it's a number
          var flN = parseFloat(nextCommandName);
          if( isNaN(flN) ) {

            if( self.compilationMode ) {
              // in compilationMode
              var commandDefn = self.findDefinition(nextCommandName);
              if( commandDefn.immediate ) {
                // if it's an immediate command run it now
                commandDefn.fn();
              } else {
                // add it to this commands list of commands
                self.newCommand.addFunction( commandDefn );
              }
            } else {
              self.execute(nextCommandName);
            }
          } else {
            var intN = parseInt(nextCommandName, 10);
            if( flN === intN ) { // TODO not sure this is necessary
              self.pushToDataStack(intN);
            } else {
              self.pushToDataStack(flN);
            }
          }
        }
      }
    };

    this.interpret = function(txt) {
      self.response = "";
      self.commands = txt.split(' ');
      // response = self.commands;
      self.processCommands();
      // self.log( self.response );
      return self.response.trim();
    };

    this.logFn = function(txt) {
      self.response += txt + ' ';
    };

    // override the default logger
    this.setLogFunction = function( fn ) {
      this.logFn = fn;
    };

    this.errorFn = function( txt ) {
      throw( 'FORTH ERROR: ' + txt );
    };

    // override the default error handler
    this.setErrorFunction = function( fn ) {
      this.errorFn = fn;
    };
  };

})(typeof exports === 'undefined'? this['forthasm']={}: exports);
