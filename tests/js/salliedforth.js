(function(exports){
  "use strict";

  /**
    merge properties from obj2 into obj1 if they don't exist.
    returns obj1
  */
  function mergeIn( obj1, obj2 ) {
      var attrname;
      for (attrname in obj2) {
        if( obj2.hasOwnProperty(attrname) ) {
          if( !obj1.hasOwnProperty(attrname) && obj1[attrname] === undefined ) {
            obj1[attrname] = obj2[attrname];
          }
        }
      }
      return obj1;
  }

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
    this.executeAfterCreation = false;
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
    this.executeAfterCreation = true;
  };

  var ObjectCommand = function( scope ) {
    var self = this;
    this._data = {};
    this.fn = function() { // TODO maybe we should pass in this function? TMI for Array.
      if( self.key === undefined) {
        scope.pushToDataStack( self._data );
      } else {
        scope.error("Unmatched key value pairs when defining Object. Key '" + self.key + "' does not have a value!");
      }
    };
    this.key = void 0;
    this.add = function( item ) {
      if( self.key === undefined ) {
        self.key = item;
      } else {
        self._data[ self.key ] = item;
        self.key = void 0;
      }
    };
    this.executeAfterCreation = true;
  };

  /**
    * A Stack implementation. Kinda useful in Forth.
    */
  var Stack = function(name) {
    var self = this;
    this.name = name;
    this._stack = [];
    this.push = function( item ) { // TODO should this be variadic?
      self._stack.push( item );
      return self; // TODO do we need to return anything?
    };
    this.pop = function() {
      return self._stack.pop();
    };
    // return the top item without removing it.
    this.current = function() {
      return self._stack[self._stack.length - 1];
    };
    this.clear = function() {
      self._stack.length = 0; // DC does it this way.
      return self;
    };
    this.isEmpty = function() {
      return self._stack.length < 1;
    };
  };

  var CommandStack = function() {
    Stack.call( this, "Command Stack" ); // call the Stack constructor
    var self = this;
    this.addToCurrent = function( item ) {
      self.current().add( item );
    };
  };

  var ResponseData = function(status) {
    var self = this;
    this.data = [];
    this.status = status;
    this.stackSize = 0;
  };

  ResponseData.prototype.push = function(item) {
    this.data.push(item);
  };

  ResponseData.prototype.pop = function() {
    return this.data.pop();
  };

  exports.Interpreter = function( world ) {
    var self = this;

    this.dataStack = [];
    this.returnStack = [];
    this.dictionaryHead = undefined;

    this.newCommands = new CommandStack();

    // keeps track of the level of nesting
    // TODO do we need to clear this on error?
    this._compilationModeStack = new Stack();

    this.compilationMode = function() {
      return !!this._compilationModeStack.current();
    };

    this.enterCompilationMode = function() {
      this._compilationModeStack.push(true);
    };

    this.leaveCompilationMode = function() {
      this._compilationModeStack.pop();
    };

    this.valueStore = mergeIn(world || {}, {'false': false, 'true': true});

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
    this.log = function(item) {
      self.logFn && self.logFn( item );
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
      if(self.dataStack.length < 1) { self.error("StackUnderFlow!"); }
      return self.dataStack.pop();
    };

    this.addToDictionary = function( name, fn, imm ) {
      if( self.dictionaryHead ) {
        var newNode = {name: name, fn: fn, prev: self.dictionaryHead, immediate: !!imm};
        self.dictionaryHead = newNode;
      } else {
        self.dictionaryHead = {name: name, fn: fn, immediate: !!imm};
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

    this.executeString = function( forthTxt ) {
      self.executeWords.apply( self, forthTxt.split(' ') );
    };

    this.processCommands = function() {
      var nextCommandName;
      while( nextCommandName = self.commands.shift() ) {

        if( nextCommandName ) {

          // check if it's a number
          var flN = parseFloat(nextCommandName);
          if( isNaN(flN) ) {

            if( self.compilationMode() ) {
              // in compilationMode
              var commandDefn = self.findDefinition(nextCommandName);
              if( commandDefn ) {
                if( commandDefn.immediate ) {
                  // if it's an immediate command run it now
                  commandDefn.fn();
                } else {
                  // add it to this commands list of commands
                  self.newCommands.addToCurrent( commandDefn.fn );
                }
              } else { // if it's not a command try adding it to the new command anyway
                self.newCommands.addToCurrent( nextCommandName );
              }
            } else {
              self.executeWords(nextCommandName);
            }
          } else {
            if( self.compilationMode() ) {
              self.newCommands.addToCurrent(flN);
            } else {
              self.pushToDataStack(flN);
            }
          }
        }
      }
    };

    this.interpret = function(txt) {
      self.response = new ResponseData('OK.');
      self.commands = txt.split(/ +/);

      self.processCommands();

      self.response.stackSize = self.dataStack.length;
      return self.response;
    };

    this.logFn = function(item) {
      self.response.push( item );
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
        self.log( self.dataStack );
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
      var val1 = self.popFromDataStack();
      var val2 = self.popFromDataStack();
      self.pushToDataStack( val1, val2 );
    });

    this.addToDictionary('over', function() {
      if( self.dataStack.length < 2 ) { self.error("Not enough items for OVER!"); }
      var val = self.dataStack[ self.dataStack.length - 2 ];
      self.pushToDataStack( val );
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

    // JS Interop TODO does this need to go later, e.g. if we use the Maths functions?

    this.addToDictionary('js@', function() {
      self.executeString('word @');
    });

    this.addToDictionary('js!', function() {
      self.executeString('word');
      self.executeString('swap !');
    });

    this.addToDictionary('js->', function() {
      var args = self.popFromDataStack();
      self.executeString('word @');
      // self.executeString('swap');
      var fn = self.popFromDataStack();
      var result = fn.apply(self.valueStore, args);
      if( result !== undefined ) {
        self.pushToDataStack( result );
      }
    });

    // Maths words

    this.addToDictionary('+', function() { // ADD
      var val1 = self.popFromDataStack();
      var val2 = self.popFromDataStack();
      self.pushToDataStack( val1 + val2 );
    });

    this.addToDictionary('-', function() { // MINUS
      var val1 = self.popFromDataStack();
      var val2 = self.popFromDataStack();
      self.pushToDataStack( val2 - val1 );
    });

    this.addToDictionary('*', function() { // MULT
      var val1 = self.popFromDataStack();
      var val2 = self.popFromDataStack();
      self.pushToDataStack( val1 * val2 );
    });

    this.addToDictionary('/', function() { // DIV
      var val1 = self.popFromDataStack();
      var val2 = self.popFromDataStack();
      self.pushToDataStack( val2 / val1 );
    });

    this.addToDictionary('%', function() { // MOD
      var val1 = self.popFromDataStack();
      var val2 = self.popFromDataStack();
      self.pushToDataStack( val2 % val1 );
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
      } else {
        self.error('No more words for WORD');
      }
    });

    // TODO could this be the same as word, only immediate?
    this.addToDictionary('lit', function() {
      var val = self.commands.shift();
      if( val ) {
        var numVal = parseFloat( val );
        if(isNaN(numVal)) {
          self.pushToDataStack( val );
        } else {
          self.pushToDataStack( numVal );
        }
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
        // self.pushToDataStack( defn );
        self.error(">CFA requires a found defn.");
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
        var value = self.getValue(name);
        if( value !== undefined ) {
          self.pushToDataStack( value );
        } else {
          self.error("value '" + name + "' is undefined!");
        }
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
      // TODO is this still needed?
      // if(self.newCommands) {
      //   self.error('Already compiling ' + self.newCommands.name + '!');
      // }
      if( self.dataStack.length > 0) {
        // get the object ready
        var cmd = new CustomCommand( self.popFromDataStack(), self.dictionaryHead, self );
        self.newCommands.push( cmd );
        return;
      }
      self.error("CREATE needs a name.");
    });

    this.addToDictionary('fn{', function() {
      self.newCommands.push( new CustomCommand( "Anonymous", undefined, self ) );
      self.enterCompilationMode(); // ->C
    });

    this.addToDictionary('}', function() {
      self.leaveCompilationMode(); // <-C
      if( self.newCommands.current() ) { // TODO temporary check, may need to provide a default flag in CustomCommand
        var latest = self.newCommands.pop();
        self.pushToDataStack( latest );
        if( latest.executeAfterCreation ) {
          self.executeWords('exec');
        }
        // TODO untested array nesting code!
        if( self.newCommands.current() && self.compilationMode() ) {
          self.newCommands.addToCurrent( self.popFromDataStack() );
        }
      }
    }, true);

    // for the moment this will try to act smart and
    // will test whether the top item on the stack
    // is a function or a CustomCommand
    // may split this up into two words if it looks unwieldy
    this.addToDictionary('exec', function() {
      if( self.dataStack.length > 0 ) {
        var cmd = self.popFromDataStack();
        if( typeof cmd === 'function' ) {
          cmd.call( self );
        } else if (cmd.fn) { // most likely a command definition TODO see above about default flag for CustomCommand
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
      self.executeWords('word', 'create'); // , 'fn{');
      self.enterCompilationMode();
    });

    // Defining Arrays

    this.addToDictionary('[', function() {
      self.newCommands.push( new ArrayCommand(self) );
      self.enterCompilationMode(); // ->C
    }, true);

    this.addToDictionary(']', function() {
      self.leaveCompilationMode(); // <-C
      if( self.newCommands.current() ) {
        self.newCommands.current().fn();
        self.newCommands.pop();
        // TODO untested array nesting code!
        if( self.newCommands.current() && self.compilationMode() ) {
          self.newCommands.addToCurrent( self.popFromDataStack() );
        }
      }
    }, true);

    this.addToDictionary('array?', function() {
      self.pushToDataStack( Array.isArray( self.popFromDataStack() ) );
    });

    // empty array, useful for call JS funcs with no params
    this.addToDictionary('[]', function() {
      self.pushToDataStack([]);
    });

    // Defining Objects

    // only need the opening word as } is defined for functions fn{
    // but still works for objects
    this.addToDictionary('{', function() {
      self.newCommands.push( new ObjectCommand(self) );
      self.enterCompilationMode(); // ->C
    }, true);

    this.addToDictionary('object?', function() {
      var obj = self.popFromDataStack();
      self.pushToDataStack( obj === Object(obj) );
    });

    this.addToDictionary('concat', function() {
      var arr1 = self.popFromDataStack();
      if( Array.isArray(arr1) ) {
        self.pushToDataStack( arr1.concat( self.popFromDataStack() ) );
      } else {
        self.error('first item on the stack needs to be an array for concat');
      }
    });

    // ROT ( a b c -- b c a )
    this.interpret(': rot 2 roll ;');

    // increment the top number on the stack
    this.interpret( ': inc 1 + ;' );

    // decrement the top number on the stack
    this.interpret( ': dec 1 - ;' );

    this.addToDictionary('.list', function() {
      var node = self.dictionaryHead;
      if( node ) {
        do {
          self.log(node.name);
        } while (!!(node = node.prev));
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
