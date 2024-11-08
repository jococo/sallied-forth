import { Interpreter } from "./Interpreter";


const world: any = {}; // Replace with the appropriate value for 'world'
const interpreter = new Interpreter(world);
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

  /**
    * Fetches the value from str specified in the pth array..
    * pth = array of keys (Strings)
    * str = JS Object hierarchy.
    */
  function pathRecur( pth, str ) {
    if( pth.length > 0 ) {
        var nxt = pth.shift(); // remove first item
        var data = str[nxt];
        if (data !== undefined ) {
            return pathRecur( pth, data );
        }
        return undefined;
    }
    return str;
  }

  function isObject(obj) {
    return obj === Object(obj);
  }

  /**
   * CustomCommand
   *
   * handles the execution of cutom forth words from the stack or vocabulary.
   *
   * @param name String
   * @param prev CustomCommand, the top of the current vocab
   * @scope ??
   * errorFn Function for custom error handling
   */
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

  CustomCommand.prototype.getMetaData = function() {
    return { type: 'CustomCommand' };
  };

  CustomCommand.prototype.apply = function(ctx, args) {
    return this.fn.apply(ctx, args);
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
    this.returnStackSize = 0;
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
      build: 2,
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
      if(self.dataStack.length < 1) { self.error("DataStackUnderFlow!"); }
      return self.dataStack.pop();
    };

    this.pushToReturnStack = function() {
      var args = Array.prototype.slice.call(arguments);
      args.forEach( function(item) {
        self.returnStack.push(item);
      } );
    };

    this.popFromReturnStack = function() {
      if(self.returnStack.length < 1) { self.error("ReturnStackUnderFlow!"); }
      return self.returnStack.pop();
    };


    /**
     * Add a new word to the main dictionary.
     * dictionaryHead is a pointer to the head of a linked list.
     * new definitions are added to the head of this list so the word search favours newest first.
     *
     * name - String
     * fn - javascript function
     * imm - boolean, is this an immediate mode word? i.e. runs immediately when processing.
     */
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
      var value = self.valueStore[name];
      if(!value) {
        var path = name.split(".");
        if(path.length > 1) {
          value = pathRecur( path, self.valueStore );
        }
      }
      return value;
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


    this.findJSDefinition = function(name) {
      var defn;
      defn = self.getValue(name);
      if( defn ) { // && (toString.call(defn) == '[object Function]')) {
        var ret = new CustomCommand(name, undefined, self.valueStore);
        ret.add( function() {
          var result = defn();
          if( result !== undefined ) {
            return result;
          }
        });
        return ret; // or definition
      }
    };

    this.findWordDefinition = function(name) {
      if(self.dictionaryHead) {
        var defn = self.findDefn(self.dictionaryHead, name);
        if( defn ) {
          return defn;
        }
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
          var defn = self.findWordDefinition( name );
          if( defn ) {
            return defn.fn;
          }
          defn = self.findJSDefinition(name);
          if( defn ) {
            return defn.fn;
          }
          throw('Function ' + name + ' not found!');
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
              var commandDefn = self.findWordDefinition(nextCommandName);
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
      self.commands = txt.split(/\s+/).filter(function(str) {
        return str.trim() !== '';
      });

      self.processCommands();

      self.response.stackSize = self.dataStack.length;
      self.response.returnStackSize = self.returnStack.length;
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

    this.addToDictionary('log', function() {
      console.log(self.popFromDataStack());
    });

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
        self.log('[data stack empty]');
      } else {
        self.log( self.dataStack );
      }
    });

    this.addToDictionary('.rs', function() {
      if( self.returnStack.length < 1 ) {
        self.log('[return stack empty]');
      } else {
        self.log( self.returnStack );
      }
    });

    this.addToDictionary('.l', function() {
      self.log( self.dataStack.length );
    });

    this.addToDictionary('.cs', function() {
      self.dataStack.length = 0;
    });

    this.addToDictionary('.log', function() {
      console.log.apply( console, ["STACK >>"].concat( self.dataStack.map(function(cell) {return cell.toString()}) ) );
    });

    /**
     * Return Stack functions
     */

    // Takes a value off the parameter stack and pushes it onto the return stack.
    // ( n -- )
    this.addToDictionary('>R', function() {
      var val = self.popFromDataStack();
      self.pushToReturnStack(val);
    });

    // Takes a value off the return stack and pushes it onto the parameter stack.
    // ( -- n )
    this.addToDictionary('R>', function() {
      var val = self.popFromReturnStack();
      self.pushToDataStack(val);
    });

    // Copies the top of the return stack without affecting it.
    // ( -- n )
    this.addToDictionary('R@', function() {
      var val = self.popFromReturnStack();
      if( val ) {
        self.pushToReturnStack( val );
        self.pushToDataStack( val );
      }
    });

        // Copies the top of the return stack without affecting it.
    // ( -- n )
    this.addToDictionary('I', function() {
      var val = self.popFromReturnStack();
      if( val ) {
        self.pushToReturnStack( val );
        self.pushToDataStack( val );
      }
    });

    // Copies the third item of the return stack without affecting it.
    // ( -- n )
    this.addToDictionary('J', function() {
      var rsLen = self.returnStack.length;
      if( rsLen < 3) { self.error("J needs 3 items on the return stack. There were only " + rsLen); }
      var val = self.returnStack[ rsLen - 3 ]; // JS array is zero indexed.
      self.pushToDataStack( val );
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

/*
    // Pushes the loop index and loop limit onto the return stack.
    // ( n1 n2 -- )
    this.addToDictionary('do', function() {
      this.interpret('swap >R >R');
      self.newCommands.push( new CustomCommand( "Anonymous", undefined, self ) );
      this.enterCompilationMode();
    });

    this.addToDictionary('loop', function() {
      self.leaveCompilationMode();
      if( self.newCommands.current() ) {
        var latest = self.newCommands.pop();



        // if nested then add this to the parent
        if( self.newCommands.current() && self.compilationMode() ) {
          self.newCommands.addToCurrent( self.popFromDataStack() );
        }
      }
    }, true);

    // Increments the loop index by 1 and tests against the upper limit. If the loop index is equal to the limit, discard the loop parameters and continue execution immediately following the loop. Otherwise continue execution at the beginning of the loop.
    // ( -- )
this.addToDictionary('loop', function() {
      var loopIndex = this.popFromReturnStack();
      var loopLimit = this.popFromReturnStack();
      loopIndex = loopIndex + 1;
      if(loopIndex < loopLimit) {
        this.pushToReturnStack( loopLimit );
        this.pushToReturnStack( loopIndex );
      } else {

      }
    });
*/
    // JS Interop TODO does this need to go later, e.g. if we use the Maths functions?

    // TODO commenting these out for now.
    // this.addToDictionary('js@', function() {
    //   self.executeString('word @');
    // });

    // this.addToDictionary('js!', function() {
    //   self.executeString('word');
    //   self.executeString('swap !');
    // });

    // this.addToDictionary('js->', function() {
    //   var args = self.popFromDataStack();
    //   self.executeString('word dup @');
    //   // self.executeString('swap');
    //   var fn = self.popFromDataStack();
    //   var fnStr = self.popFromDataStack();
    //   var localContext = self.valueStore;
    //   switch( fnStr ) { // TODO this has got to go!
    //     case "console.log":
    //       localContext = window.console; // TODO WARNING!! TMI !!
    //       break;
    //     case "rsandom":
    //       break;
    //   }
    //   var result = fn.apply(localContext, args);
    //   if( result !== undefined ) {
    //     self.pushToDataStack( result );
    //   }
    // });

    this.getJSContextFor = function( path ) {
      var context = self.valueStore;
      if( path.substr(0, 8) === 'console.' ) {
        context = window.console; // TODO WARNING!! TMI !!
      } else if ( path.substr(0, 9) == 'document.') {
        context = document;
      }
      return context;
    };

    this.addToDictionary('get', function() {
      var obj = self.popFromDataStack();
      if( isObject(obj) ) {
        self.executeWords('word');
        var key = self.popFromDataStack();
        self.pushToDataStack(obj);
        var val = pathRecur( key.split('.'), obj );
        if((typeof val) === 'function') {
          val = addMetaData(val, {context: obj});
        }
        self.pushToDataStack( val );
      }
    });

    //
    this.addToDictionary('set', function() {
      var value = self.popFromDataStack();
      var obj = self.popFromDataStack();
      if( isObject(obj) ) {
        self.executeWords('word');
        var key = self.popFromDataStack();
        var path = key.split('.');
        key = path.pop();
        var parent = pathRecur( path, obj );
        parent[key] = value;
        self.pushToDataStack( obj );
      }
    });

    this.addToDictionary('pop', function() {
      var arr = self.popFromDataStack();
      if(Array.isArray(arr)) {
        self.pushToDataStack( arr );
        self.pushToDataStack( arr.pop() );
      } else {
        self.error('Not an array for pop! ' + arr);
      }
    });

    this.addToDictionary('push', function() {
      var value = self.popFromDataStack();
      var arr = self.popFromDataStack();
      if(Array.isArray(arr)) {
        arr.push( value );
        self.pushToDataStack( arr );
      } else {
        self.error('Not an array for pop! ' + arr);
      }
    });

    // TODO js & js- need refactoring
    // also look into trad forth CREATE & DOES>
    this.addToDictionary('js', function() {
      var fn, fnPath, localContext;
      if( self.compilationMode() ) {
        self.executeString('word dup @'); // get the js fn name, find it from the js context
        fn = self.popFromDataStack();
        fnPath = self.popFromDataStack();
        localContext = self.getJSContextFor( fnPath );
        self.newCommands.addToCurrent( (function( aFn, aPath, aContext ) {
          return function() {
            var aArgs = self.popFromDataStack();
            aFn.apply( aContext, aArgs );
          };
        } )( fn, fnPath, localContext ) );
      } else {
        var args = self.popFromDataStack(); // get the array of words
        self.executeString('word dup @'); // get the js fn name, find it from the js context
        fn = self.popFromDataStack();
        fnPath = self.popFromDataStack();
        localContext = self.getJSContextFor( fnPath );
        fn.apply(localContext, args);
      }
    }, true);

    // same as 'js' but expects a return value or returns undefined
    this.addToDictionary('js-', function() {
      var fn, fnPath, localContext, result;
      if( self.compilationMode() ) {
        // var args = self.popFromDataStack(); // get the array of words
        self.executeString('word dup @'); // get the js fn name, find it from the js context
        fn = self.popFromDataStack();
        fnPath = self.popFromDataStack();
        localContext = self.getJSContextFor( fnPath );
        self.newCommands.addToCurrent((function(aFn, aPath, aContext){
          return function() {
            var aArgs = self.popFromDataStack();
            var aResult = fn.apply(aContext, aArgs);
            self.pushToDataStack( aResult );
          };
        })( fn, fnPath, localContext ));
      } else {
        var args = self.popFromDataStack(); // get the array of words
        self.executeString('word dup @'); // get the js fn name, find it from the js context
        fn = self.popFromDataStack();
        fnPath = self.popFromDataStack();
        localContext = self.getJSContextFor( fnPath );
        result = fn.apply(localContext, args);
        self.pushToDataStack( result );
      }
    }, true);

    /*
    Pass in a 'class' function and an array of args.
    This function will create a new instance, injecting the args as parameters.
    */
    function construct(constructor, args) {
      function F() {
          return constructor.apply(this, args);
      }
      F.prototype = constructor.prototype;
      if(args.length < 1) {
        F.prototype.toString = function() {return '[' + constructor.cname + '()]'};
      } else {
        F.prototype.toString = function() {return '[' + constructor.cname + '(' + args + ')]'};
      }
      return new F();
    }

    /*
      Adds a 'getMetaData' function to the passed in inst
      which returns the supplied metadata(meta).
    */
    function addMetaData(inst, meta) {
      inst.getMetaData = function() {
        return meta;
      };
      return inst;
    }

    this.addToDictionary('jsnew', function() {
      var fn;
      self.executeString('word dup @'); // get the js fn name, find it from the js context
      fn = self.popFromDataStack();
      fn.cname = self.popFromDataStack();
      var args = self.popFromDataStack();
      var result = construct(fn, args);
      self.pushToDataStack(result);
    });

    /*
    run a javascript function off of the stack
    args is top of stack because this function is generally used to execute a fetched js func
    */
    // ( fn [args] -- )
    this.addToDictionary('jsexec', function() {
      var args = self.popFromDataStack();
      var fn = self.popFromDataStack();
      var meta = fn.getMetaData && fn.getMetaData();
      if(meta && meta.context) {
        fn.apply(meta.context, args);
      } else {
        fn.apply(null, args);
      }
    });

    /*
    run a javascript function off of the stack, push result
    args is top of stack because this function is generally used to execute a fetched js func
    */
    // ( fn [args] -- r )
    this.addToDictionary('jsexec-', function() {
      var args = self.popFromDataStack();
      var fn = self.popFromDataStack();
      var result = fn.apply(null, args);
      self.pushToDataStack( result );
    });

    this.addToDictionary('arity', function() {
      var len = self.popFromDataStack();
      var result = addMetaData([], {arity: len});
      while( len-- ) {
        result.unshift( self.popFromDataStack() );
      }
      self.pushToDataStack( result );
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

    this.addToDictionary('>', function() {
      var val1 = self.popFromDataStack();
      if( self.dataStack.length < 1) {
        self.error("2 items needed for > !");
      } else {
        var val2 = self.popFromDataStack();
        self.pushToDataStack( val2 > val1 );
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
      var defn = self.findWordDefinition( name );
      if( defn ) {
        self.pushToDataStack( defn );
        return;
      } else {
        defn = self.findJSDefinition( name );
        if( defn ) {
          self.pushToDataStack( defn );
          return;
        }
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
        var name = self.popFromDataStack();
        var value = self.popFromDataStack();
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

    // comments
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

    // inline strings
    this.addToDictionary('"', function() {
      var txt = "";
      var cmd;
      while((cmd = self.commands.shift()) && (cmd.indexOf('"')==-1)) {
        // console.log('while loop ' + cmd);
        txt += cmd + ' ';
      }
      txt = txt + cmd.split('"')[0];
      self.pushToDataStack( txt.trim() );
      if( self.compilationMode() ) {
        self.newCommands.addToCurrent( (function(newTxt) {
          return function() {
            self.pushToDataStack(newTxt);
          };
        })(self.popFromDataStack()));
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
      var nextWord = self.commands.shift();
      if(nextWord) {
        self.pushToDataStack(nextWord);
        if( self.dataStack.length > 0) {
          // get the object ready
          var cmd = new CustomCommand( self.popFromDataStack(), self.dictionaryHead, self );
          self.newCommands.push( cmd );
          return;
        }
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
        // if nested then add this to the parent
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
          var found = self.findWordDefinition( cmd.name );
          if( found ) {
            self.log( cmd.name + ' is not unique.' );
          }
        }
        self.dictionaryHead = cmd;
      }
    }, true);

    this.addToDictionary(':', function() {
      self.executeWords('create'); // 'word',
      self.enterCompilationMode();
    });

    /**
     * Flow Control
     */

     /*
      DO ... LOOP will work a little differently to native Forth implementations.
      DO adds the loop index and limit but then enters compilation mode.
      LOOP retrieves the function wrapper around the code between DO & LOOP and sets up a function to repeatedly call it.
     */

    this.addToDictionary('do', function() {
      debugger;
      self.interpret('swap >R >R');
      self.newCommands.push( new CustomCommand( "Anonymous", undefined, self ) );
      self.enterCompilationMode(); // ->C
    });

    this.addToDictionary('loop', function() {
      debugger;
      self.interpret('} R> inc >R');
    }, true);

    // Defining Arrays

    this.addToDictionary('[', function() {
      self.newCommands.push( new ArrayCommand(self) );
      self.enterCompilationMode(); // ->C
    }, true);

    this.addToDictionary(']', function() {
      self.executeString('}');
    }, true);

    this.addToDictionary('array?', function() {
      self.pushToDataStack( Array.isArray( self.popFromDataStack() ) );
    });

    // empty array, useful for call JS funcs with no params
    this.addToDictionary('[]', function() {
      self.pushToDataStack([]);
    });

    this.addToDictionary('{}', function() {
      self.pushToDataStack({});
    });

    this.addToDictionary('undefined', function() {
      self.pushToDataStack(void 0);
    });

    this.addToDictionary('null', function() {
      self.pushToDataStack(null);
    });

    // call a function given the JS PATH
    this.interpret(': call word @ exec ;');

    this.interpret(': arity1 1 arity ;');
    this.interpret(': arity2 2 arity ;');
    this.interpret(': arity3 3 arity ;');
    this.interpret(': arity4 4 arity ;');
    // any more? define your own

    // Defining Objects

    // only need the opening word as } is defined for functions fn{
    // but still works for objects
    this.addToDictionary('{', function() {
      self.newCommands.push( new ObjectCommand(self) );
      self.enterCompilationMode(); // ->C
    }, true);

    this.addToDictionary('object?', function() {
      var obj = self.popFromDataStack();
      self.pushToDataStack( isObject( obj ) );
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