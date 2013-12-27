(function(exports){
  "use strict";

  var CustomCommand = function( name, prev, scope, errorFn ) {
    var self = this;
    this.name = name;
    this.fn = function() {
      self.functions.forEach( function(fn1) {
        fn1.call(scope);
      });
    };
    this.errorFn = errorFn || function(txt) {
      console.error("FORTH ERROR::CustomCommand: " + txt);
    };
    this.prev = prev;
    this.functions = [];
    this.add = function( fn2 ) {
      if( typeof fn2 === 'function') {
        // self.errorFn("add can only be called with a function ref as argument!");
        self.functions.push( fn2 );
      } else {
        self.functions.push( function() {
          scope.pushToDataStack( (function(item) {
            return item;
          })(fn2) );
        } );
      }
    };
  };

  var ArrayCommand = function( scope ) {
    var self = this;
    this._data = [];
    this.fn = function() { // TODO maybe we should pass in this function? TMI for Array.
      scope.pushToDataStack( self._data );
    };
    this.add = function( item ) {
      self._data.push( item );
    };
  };

  exports.Interpreter = function() {
    var self = this;

    this.dataStack = [];
    this.returnStack = [];
    this.dictionary = undefined;
    this.dictionaryHead = undefined;

    this.valueStore = {'false': false, 'true': true};

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

    // log function
    this.log = function(txt) {
      self.logFn && self.logFn( txt );
      return void 0;
    };

    // error function
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

    /**
      * Run all the functions passed in.
      */
    this.executeFunctions = function(/* function refs... */) {
      var args = Array.prototype.slice.call(arguments);
      args.forEach( function(fn) {
        fn.call(self);
      });
    };

    /**
      * When a list of functions names (words) are passed in,
      * fetch their definitions from the dictionary.
      * Run all the functions.
      * Throw an exception if a word cannot be found.
      */
    this.executeWords = function( /* names of functions... */ ) {
      var args = Array.prototype.slice.call(arguments);
      try {
        var allFunctions = args.map(function(name) {
          var defn = self.findDefinition( name );
          if( defn ) {
            return defn.fn;
          } else {
            throw('Function ' + name + ' not found!');
          }
        });
        self.executeFunctions.apply( self, allFunctions );
      } catch(err) {
        self.error(err);
      }
    };

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
                self.newCommand.add( commandDefn.fn );
              }
            } else {
              self.executeWords(nextCommandName);
            }
          } else {
            if( self.compilationMode ) {
              self.newCommand.add(flN);
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

    // ---------------------------------
    // Definitions
    // ---------------------------------

    this.addToDictionary('.', function() {
      self.log( self.popFromDataStack() );
    });

    this.addToDictionary('true', function() {
      self.pushToDataStack( self.getValue('true') );
    });

    this.addToDictionary('false', function() {
      self.pushToDataStack( self.getValue('false') );
    });

    /**
      * TODO Maybe specify endstops [ & ] so they can be changed?
      */
    this.addToDictionary('.s', function() {
      if( self.dataStack.length < 1 ) {
        self.log('[stack empty]');
      } else {
        self.log( '[' + self.dataStack.map(function(item) {
          return JSON.stringify(item);
        }).join(",") + ']');
      }
    });

    this.addToDictionary('.l', function() {
      self.log( self.dataStack.length );
    });

    this.addToDictionary('.cs', function() {
      self.dataStack.length = 0;
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

    this.addToDictionary('roll', function() {
      if(self.dataStack.length < 2) {
        self.error("ROLL needs something to work with, nothing on stack!");
      } else {
        var places = self.popFromDataStack();
        if(self.dataStack.length < places + 1) {
          self.error("ROLL specifed a larger number then number of items on stack!");
        } else {
          var item = self.dataStack.splice(self.dataStack.length - places - 1, 1);
          self.pushToDataStack( item[0] );
        }
      }
    });

    // Maths words

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

    this.addToDictionary('=', function() {
      var val1 = self.popFromDataStack();
      if( self.dataStack.length < 1) {
        self.error("2 items needed for EQUAL!");
      } else {
        var val2 = self.popFromDataStack();
        self.pushToDataStack( val1 === val2 );
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

    this.addToDictionary('!)?', function() {
      var str = self.commands.shift();
      self.pushToDataStack( str.indexOf(')') < 0 );
    });

    this.addToDictionary('not', function() {
      self.pushToDataStack(!self.popFromDataStack());
    });

    // (fn bool --)
    this.addToDictionary('while', function() {
      while(!!self.popFromDataStack()) {
        self.executeWords('dup', 'exec');
      }
      self.executeWords('drop');
    });

    this.addToDictionary('(', function() {
      // TODO revisit forth version
      // : test_for_close_backet word lit ) contains?
      // ' test_for_close_backet while
      // var words = "' !)? true while";
      // self.executeWords.apply(self, words.split(' '));
      var cmd;
      while((cmd = self.commands.shift()) && (cmd.indexOf(')')==-1)) {
        // console.log('while loop ' + cmd);
      }

    }, true);

    // Defining Words

    this.addToDictionary("'", function() {
      self.executeWords('word', 'find', '>cfa'); // , 'next' TODO find out what 'next' does.
    });

    this.addToDictionary('create', function() {
      if(self.newCommand) {
        self.error('Already compiling ' + self.newCommand.name + '!');
      }
      if( self.dataStack.length > 0) {
        // get the object ready
        var cmd = new CustomCommand( self.popFromDataStack(), self.dictionaryHead, self );
        self.newCommand =  cmd;
        return;
      }
      self.error("CREATE needs a name.");
    });

    this.addToDictionary('{', function() {
      self.compilationMode = true;
      if( !self.newCommand ) {
        self.newCommand = new CustomCommand( "Anonymous", undefined, self );
      }
    });

    this.addToDictionary('}', function() {
      self.compilationMode = false;
      if( self.newCommand ) {
        self.pushToDataStack( self.newCommand );
        self.newCommand = void 0;
      }
    }, true);

    // for the moment this will try to act smart and
    // will test whether the top item on the stack
    // is a function or a CustomCommand
    // may spli this up into two words if it looks unwieldy
    this.addToDictionary('exec', function() {
      if( self.dataStack.length > 0 ) {
        var cmd = self.popFromDataStack();
        if( typeof cmd === 'function' ) {
          cmd.call( self );
        } else if (cmd.fn) { // most likely a command definition
          cmd.fn.call(self);
        } else {
          self.error('' + cmd + ' is not executable!');
        }
      } else {
        self.error('exec needs a function or command ref on the stack!');
      }
    });

    this.addToDictionary(';', function() {
      self.executeWords('}');
      var cmd = self.popFromDataStack();
      if( cmd ) {
        if( cmd && cmd.name ) {
          var found = self.findDefinition( cmd.name );
          if( found ) {
            self.log( cmd.name + ' is not unique.' );
          }
        }
        self.dictionaryHead = cmd;
      }
    }, true);

    this.addToDictionary(':', function() {
      self.executeWords('word', 'create', '{');
    });

    // Defining Arrays

    this.addToDictionary('[', function() {
      self.compilationMode = true;
      self.newCommand = new ArrayCommand(self);
    });

    this.addToDictionary(']', function() {
      self.compilationMode = false;
      if( self.newCommand ) {
        self.newCommand.fn();
        self.newCommand = void 0;
      }
    }, true);

    this.addToDictionary('array?', function() {
      self.pushToDataStack( Array.isArray( self.popFromDataStack() ) );
    });

    // ROT
    this.interpret(': rot ( a b c -- b c a ) 2 roll ;');

    // increment the top number on the stack
    this.interpret( ': inc 1 + ;' );

    // decrement the top number on the stack
    this.interpret( ': dec 1 - ;' );

    this.addToDictionary('.list', function() {
      var node = self.dictionaryHead;
      if( node ) {
        do {
          self.log(node.name);
        } while (node = node.prev);
      }
    }, true);

    this.addToDictionary('.values', function() {
      var keys = Object.getOwnPropertyNames( self.valueStore );
      var values = keys.map(function(key) {
        return self.valueStore[key];
      });
      self.log( values );
    });

    this.addToDictionary('.keys', function() {
      var keys = Object.getOwnPropertyNames( self.valueStore );
      self.log( keys );
    });

    this.addToDictionary('.vs', function() {
      self.log( self.valueStore );
    });
  };

})(typeof exports === 'undefined'? this['salliedforth']={}: exports);
