import { ArrayCommand } from "./ArrayCommand";
import { CommandStack } from "./CommandStack";
import { CustomCommand } from "./CustomCommand";
import { ObjectCommand } from "./ObjectCommand";
import { ResponseData } from "./ResponseData";
import { construct } from "./util";
import { addMetaData } from "./util";
import { isObject } from "./util";
import { pathRecur } from "./util";
import { mergeIn } from "./util";
import { Stack } from "./Stack";


export class Interpreter {
  dataStack: any[];
  returnStack: any[];
  dictionaryHead: any;
  newCommands: CommandStack;
  _compilationModeStack: Stack;
  valueStore: { [key: string]: any; };
  version: { major: number; minor: number; build: number; revision: any; };
  versionString: string;
  logFn: (item: any) => void;
  errorFn: (txt: string) => void;
  response: ResponseData = new ResponseData('OK.');
  commands: string[] = [];

  constructor(world: any) {
    this.dataStack = [];
    this.returnStack = [];
    this.dictionaryHead = undefined;
    this.newCommands = new CommandStack();
    this._compilationModeStack = new Stack('CompilationMode Stack');
    this.valueStore = mergeIn(world || {}, { 'false': false, 'true': true });
    this.version = { major: 0, minor: 0, build: 2, revision: undefined };
    this.versionString = `${this.version.major}.${this.version.minor}.${this.version.build}`;
    if (this.version.revision) {
      this.versionString = `${this.versionString}.${this.version.revision}`;
    }
    this.logFn = (item: any) => {
      this.response.push(item);
    };
    this.errorFn = (txt: string) => {
      throw new Error('FORTH ERROR: ' + txt);
    };
  }

  compilationMode() {
    return !!this._compilationModeStack.current();
  }

  enterCompilationMode() {
    this._compilationModeStack.push(true);
  }

  leaveCompilationMode() {
    this._compilationModeStack.pop();
  }

  log(item: any) {
    this.logFn && this.logFn(item);
    return void 0;
  }

  error(txt: string) {
    this.errorFn && this.errorFn(txt);
    return void 0;
  }

  pushToDataStack(...args: any[]) {
    args.forEach((item) => {
      this.dataStack.push(item);
    });
  }

  popFromDataStack() {
    if (this.dataStack.length < 1) {
      this.error("DataStackUnderFlow!");
    }
    return this.dataStack.pop();
  }

  pushToReturnStack(...args: any[]) {
    args.forEach((item) => {
      this.returnStack.push(item);
    });
  }

  popFromReturnStack() {
    if (this.returnStack.length < 1) {
      this.error("ReturnStackUnderFlow!");
    }
    return this.returnStack.pop();
  }

  /**
   * Adds a new entry to the dictionary.
   *
   * @param name - The name of the dictionary entry.
   * @param fn - The function associated with the dictionary entry.
   * @param imm - Optional boolean indicating if the entry is immediate.
   */
  addToDictionary(name: string, fn: () => void, imm?: boolean) {
    if (this.dictionaryHead) {
      const newNode = { name, fn, prev: this.dictionaryHead, immediate: !!imm };
      this.dictionaryHead = newNode;
    } else {
      this.dictionaryHead = { name, fn, immediate: !!imm };
    }
  }

  setValue(name: string, value: any) {
    this.valueStore[name] = value;
  }

  getValue(name: string) {
    let value = this.valueStore[name];
    if (!value) {
      const path = name.split(".");
      if (path.length > 1) {
        value = pathRecur(path, this.valueStore);
      }
    }
    return value;
  }

  findDefn(head: any, name: string) {
    if (name === head.name) {
      return head;
    } else {
      if (head.prev) {
        return this.findDefn(head.prev, name);
      } else {
        return undefined;
      }
    }
  }

  findJSDefinition(name: string) {
    const defn = this.getValue(name);
    if (defn) {
      const ret = new CustomCommand(name, undefined, this.valueStore);
      ret.add(() => {
        const result = defn();
        if (result !== undefined) {
          return result;
        }
      });
      return ret;
    }
  }

  findWordDefinition(name: string) {
    if (this.dictionaryHead) {
      const defn = this.findDefn(this.dictionaryHead, name);
      if (defn) {
        return defn;
      }
    }
    return undefined;
  }

  executeFunctions(...args: Array<() => void>) {
    args.forEach((fn) => {
      fn.call(this);
    });
  }

  executeWords(...args: string[]) {
    try {
      const allFunctions = args.map((name) => {
        let defn = this.findWordDefinition(name);
        if (defn) {
          return defn.fn;
        }
        defn = this.findJSDefinition(name);
        if (defn) {
          return defn.fn;
        }
        throw new Error('Function ' + name + ' not found!');
      });
      this.executeFunctions(...allFunctions);
    } catch (err:any) {
      this.error(err.message);
    }
  }

  executeString(forthTxt: string) {
    this.executeWords(...forthTxt.split(' '));
  }

  processCommands() {
    let nextCommandName;
    while ((nextCommandName = this.commands.shift())) {
      if (nextCommandName) {
        const flN = parseFloat(nextCommandName);
        if (isNaN(flN)) {
          if (this.compilationMode()) {
            const commandDefn = this.findWordDefinition(nextCommandName);
            if (commandDefn) {
              if (commandDefn.immediate) {
                commandDefn.fn();
              } else {
                this.newCommands.addToCurrent(commandDefn.fn);
              }
            } else {
              this.newCommands.addToCurrent(nextCommandName);
            }
          } else {
            this.executeWords(nextCommandName);
          }
        } else {
          if (this.compilationMode()) {
            this.newCommands.addToCurrent(flN);
          } else {
            this.pushToDataStack(flN);
          }
        }
      }
    }
  }

  interpret(txt: string): ResponseData {
    this.response = new ResponseData('OK.');
    this.commands = txt.split(/\s+/).filter((str) => str.trim() !== '');
    this.processCommands();
    this.response.stackSize = this.dataStack.length;
    this.response.returnStackSize = this.returnStack.length;
    return this.response;
  }

  setLogFunction(fn: (item: any) => void) {
    this.logFn = fn;
  }

  setErrorFunction(fn: (txt: string) => void) {
    this.errorFn = fn;
  }

  getJSContextFor(path: string) {
    const pathArray = path.split('.');
    let context = this.valueStore;
    while (pathArray.length > 0) {
      const key = pathArray.shift();
      if (context && key) {
        context = context[key];
      }
    }
    return context;
  }

  addToDictionaryDefinitions() {
    this.addToDictionary('log', () => {
      console.log(this.popFromDataStack());
    });

    this.addToDictionary('.', () => {
      this.log(this.popFromDataStack());
    });

    this.addToDictionary('true', () => {
      this.pushToDataStack(this.getValue('true'));
    });

    this.addToDictionary('false', () => {
      this.pushToDataStack(this.getValue('false'));
    });

    this.addToDictionary('.s', () => {
      if (this.dataStack.length < 1) {
        this.log('[data stack empty]');
      } else {
        this.log(this.dataStack);
      }
    });

    this.addToDictionary('.rs', () => {
      if (this.returnStack.length < 1) {
        this.log('[return stack empty]');
      } else {
        this.log(this.returnStack);
      }
    });

    this.addToDictionary('.l', () => {
      this.log(this.dataStack.length);
    });

    this.addToDictionary('.cs', () => {
      this.dataStack.length = 0;
    });

    this.addToDictionary('.log', () => {
      console.log.apply(console, ["STACK >>"].concat(this.dataStack.map((cell) => cell.toString())));
    });

    this.addToDictionary('>R', () => {
      const val = this.popFromDataStack();
      this.pushToReturnStack(val);
    });

    this.addToDictionary('R>', () => {
      const val = this.popFromReturnStack();
      this.pushToDataStack(val);
    });

    this.addToDictionary('R@', () => {
      const val = this.popFromReturnStack();
      if (val) {
        this.pushToReturnStack(val);
        this.pushToDataStack(val);
      }
    });

    this.addToDictionary('I', () => {
      const val = this.popFromReturnStack();
      if (val) {
        this.pushToReturnStack(val);
        this.pushToDataStack(val);
      }
    });

    this.addToDictionary('J', () => {
      const rsLen = this.returnStack.length;
      if (rsLen < 3) {
        this.error("J needs 3 items on the return stack. There were only " + rsLen);
      }
      const val = this.returnStack[rsLen - 3];
      this.pushToDataStack(val);
    });

    this.addToDictionary('dup', () => {
      const val = this.popFromDataStack();
      if (val) {
        this.pushToDataStack(val);
        this.pushToDataStack(val);
      }
    });

    this.addToDictionary('drop', () => {
      this.popFromDataStack();
    });

    this.addToDictionary('swap', () => {
      const val1 = this.popFromDataStack();
      const val2 = this.popFromDataStack();
      this.pushToDataStack(val1, val2);
    });

    this.addToDictionary('over', () => {
      if (this.dataStack.length < 2) {
        this.error("Not enough items for OVER!");
      }
      const val = this.dataStack[this.dataStack.length - 2];
      this.pushToDataStack(val);
    });

    this.addToDictionary('roll', () => {
      if (this.dataStack.length < 2) {
        this.error("ROLL needs something to work with, nothing on stack!");
      } else {
        const places = this.popFromDataStack();
        if (this.dataStack.length < places + 1) {
          this.error("ROLL specified a larger number than the number of items on stack!");
        } else {
          const item = this.dataStack.splice(this.dataStack.length - places - 1, 1);
          this.pushToDataStack(item[0]);
        }
      }
    });

    this.addToDictionary('get', () => {
      const obj = this.popFromDataStack();
      if (isObject(obj)) {
        this.executeWords('word');
        const key = this.popFromDataStack();
        this.pushToDataStack(obj);
        let val = pathRecur(key.split('.'), obj);
        if (typeof val === 'function') {
          val = addMetaData(val, { context: obj });
        }
        this.pushToDataStack(val);
      }
    });

    this.addToDictionary('set', () => {
      const value = this.popFromDataStack();
      const obj = this.popFromDataStack();
      if (isObject(obj)) {
        this.executeWords('word');
        const key = this.popFromDataStack();
        const path = key.split('.');
        const lastKey = path.pop();
        const parent = pathRecur(path, obj);
        parent[lastKey] = value;
        this.pushToDataStack(obj);
      }
    });

    this.addToDictionary('pop', () => {
      const arr = this.popFromDataStack();
      if (Array.isArray(arr)) {
        this.pushToDataStack(arr);
        this.pushToDataStack(arr.pop());
      } else {
        this.error('Not an array for pop! ' + arr);
      }
    });

    this.addToDictionary('push', () => {
      const value = this.popFromDataStack();
      const arr = this.popFromDataStack();
      if (Array.isArray(arr)) {
        arr.push(value);
        this.pushToDataStack(arr);
      } else {
        this.error('Not an array for push! ' + arr);
      }
    });

    this.addToDictionary('js', () => {
      let fn, fnPath, localContext;
      if (this.compilationMode()) {
        this.executeString('word dup @');
        fn = this.popFromDataStack();
        fnPath = this.popFromDataStack();
        localContext = this.getJSContextFor(fnPath);
        this.newCommands.addToCurrent(((aFn:Function, aPath, aContext) => {
          return () => {
            const aArgs = this.popFromDataStack();
            aFn.apply(aContext, aArgs);
          };
        }) (fn, fnPath, localContext));
      } else {
        const args = this.popFromDataStack();
        this.executeString('word dup @');
        fn = this.popFromDataStack();
        fnPath = this.popFromDataStack();
        localContext = this.getJSContextFor(fnPath);
        fn.apply(localContext, args);
      }
    }, true);

    this.addToDictionary('js-', () => {
      let fn, fnPath, localContext, result;
      if (this.compilationMode()) {
        this.executeString('word dup @');
        fn = this.popFromDataStack();
        fnPath = this.popFromDataStack();
        localContext = this.getJSContextFor(fnPath);
        this.newCommands.addToCurrent(((aFn, aPath, aContext) => {
          return () => {
            const aArgs = this.popFromDataStack();
            const aResult = fn.apply(aContext, aArgs);
            this.pushToDataStack(aResult);
          };
        })(fn, fnPath, localContext));
      } else {
        const args = this.popFromDataStack();
        this.executeString('word dup @');
        fn = this.popFromDataStack();
        fnPath = this.popFromDataStack();
        localContext = this.getJSContextFor(fnPath);
        result = fn.apply(localContext, args);
        this.pushToDataStack(result);
      }
    }, true);

    this.addToDictionary('jsnew', () => {
      let fn;
      this.executeString('word dup @');
      fn = this.popFromDataStack();
      fn.cname = this.popFromDataStack();
      const args = this.popFromDataStack();
      const result = construct(fn, args);
      this.pushToDataStack(result);
    });

    this.addToDictionary('jsexec', () => {
      const args = this.popFromDataStack();
      const fn = this.popFromDataStack();
      const meta = fn.getMetaData && fn.getMetaData();
      if (meta && meta.context) {
        fn.apply(meta.context, args);
      } else {
        fn.apply(null, args);
      }
    });

    this.addToDictionary('jsexec-', () => {
      const args = this.popFromDataStack();
      const fn = this.popFromDataStack();
      const result = fn.apply(null, args);
      this.pushToDataStack(result);
    });

    this.addToDictionary('arity', () => {
      let len = this.popFromDataStack();
      const result = addMetaData([], { arity: len });
      while (len--) {
        result.unshift(this.popFromDataStack());
      }
      this.pushToDataStack(result);
    });

    this.addToDictionary('+', () => {
      const val1 = this.popFromDataStack();
      const val2 = this.popFromDataStack();
      this.pushToDataStack(val1 + val2);
    });

    this.addToDictionary('-', () => {
      const val1 = this.popFromDataStack();
      const val2 = this.popFromDataStack();
      this.pushToDataStack(val2 - val1);
    });

    this.addToDictionary('*', () => {
      const val1 = this.popFromDataStack();
      const val2 = this.popFromDataStack();
      this.pushToDataStack(val1 * val2);
    });

    this.addToDictionary('/', () => {
      const val1 = this.popFromDataStack();
      const val2 = this.popFromDataStack();
      this.pushToDataStack(val2 / val1);
    });

    this.addToDictionary('%', () => {
      const val1 = this.popFromDataStack();
      const val2 = this.popFromDataStack();
      this.pushToDataStack(val2 % val1);
    });

    this.addToDictionary('=', () => {
      const val1 = this.popFromDataStack();
      if (this.dataStack.length < 1) {
        this.error("2 items needed for EQUAL!");
      } else {
        const val2 = this.popFromDataStack();
        this.pushToDataStack(val1 === val2);
      }
    });

    this.addToDictionary('>', () => {
      const val1 = this.popFromDataStack();
      if (this.dataStack.length < 1) {
        this.error("2 items needed for > !");
      } else {
        const val2 = this.popFromDataStack();
        this.pushToDataStack(val2 > val1);
      }
    });

    this.addToDictionary('word', () => {
      const val = this.commands.shift();
      if (val) {
        this.pushToDataStack(val);
      } else {
        this.error('No more words for WORD');
      }
    });

    this.addToDictionary('lit', () => {
      const val = this.commands.shift();
      if (val) {
        const numVal = parseFloat(val);
        if (isNaN(numVal)) {
          this.pushToDataStack(val);
        } else {
          this.pushToDataStack(numVal);
        }
      }
    }, true);

    this.addToDictionary('find', () => {
      const name = this.popFromDataStack();
      let defn = this.findWordDefinition(name);
      if (defn) {
        this.pushToDataStack(defn);
        return;
      } else {
        defn = this.findJSDefinition(name);
        if (defn) {
          this.pushToDataStack(defn);
          return;
        }
      }
      this.error("Cannot find word '" + name + "'");
    });

    this.addToDictionary('>cfa', () => {
      const defn = this.popFromDataStack();
      if (defn.fn) {
        this.pushToDataStack(defn.fn);
      } else {
        this.error(">CFA requires a found defn.");
      }
    });

    this.addToDictionary('!', () => {
      if (this.dataStack.length > 1) {
        const name = this.popFromDataStack();
        const value = this.popFromDataStack();
        this.setValue(name, value);
      } else {
        this.error('! needs a name and value');
      }
    });

    this.addToDictionary('@', () => {
      if (this.dataStack.length > 0) {
        const name = this.popFromDataStack();
        const value = this.getValue(name);
        if (value !== undefined) {
          this.pushToDataStack(value);
        } else {
          this.error("value '" + name + "' is undefined!");
        }
      } else {
        this.error("@ needs a name input");
      }
    });

    this.addToDictionary('!)?', () => {
      const str = this.commands.shift();
      this.pushToDataStack(str ? str.indexOf(')') < 0 : false);
    });

    this.addToDictionary('not', () => {
      this.pushToDataStack(!this.popFromDataStack());
    });

    this.addToDictionary('while', () => {
      while (!!this.popFromDataStack()) {
        this.executeWords('dup', 'exec');
      }
      this.executeWords('drop');
    });

    this.addToDictionary('(', () => {
      let cmd;
      while ((cmd = this.commands.shift()) && (cmd.indexOf(')') === -1)) { }
    }, true);

    this.addToDictionary('"', () => {
      let txt = "";
      let cmd;
      while ((cmd = this.commands.shift()) && (cmd.indexOf('"') === -1)) {
        txt += cmd + ' ';
      }
      txt = txt + cmd.split('"')[0];
      this.pushToDataStack(txt.trim());
      if (this.compilationMode()) {
        this.newCommands.addToCurrent(((newTxt) => {
          return () => {
            this.pushToDataStack(newTxt);
          };
        }) (this.popFromDataStack()));
      }
    }, true);

    this.addToDictionary("'", () => {
      this.executeWords('word', 'find', '>cfa');
    });

    this.addToDictionary('create', () => {
      const nextWord = this.commands.shift();
      if (nextWord) {
        this.pushToDataStack(nextWord);
        if (this.dataStack.length > 0) {
          const cmd = new CustomCommand(this.popFromDataStack(), this.dictionaryHead, this);
          this.newCommands.push(cmd);
          return;
        }
      }
      this.error("CREATE needs a name.");
    });

    this.addToDictionary('fn{', () => {
      this.newCommands.push(new CustomCommand("Anonymous", undefined, this));
      this.enterCompilationMode();
    });

    this.addToDictionary('}', () => {
      this.leaveCompilationMode();
      if (this.newCommands.current()) {
        const latest = this.newCommands.pop();
        this.pushToDataStack(latest);
        if (latest.executeAfterCreation) {
          this.executeWords('exec');
        }
        if (this.newCommands.current() && this.compilationMode()) {
          this.newCommands.addToCurrent(this.popFromDataStack());
        }
      }
    }, true);

    this.addToDictionary('exec', () => {
      if (this.dataStack.length > 0) {
        const cmd = this.popFromDataStack();
        if (typeof cmd === 'function') {
          cmd.call(this);
        } else if (cmd.fn) {
          cmd.fn.call(this);
        } else {
          this.error('' + cmd + ' is not executable!');
        }
      } else {
        this.error('exec needs a function or command ref on the stack!');
      }
    });

    this.addToDictionary(';', () => {
      this.executeWords('}');
      const cmd = this.popFromDataStack();
      if (cmd) {
        if (cmd && cmd.name) {
          const found = this.findWordDefinition(cmd.name);
          if (found) {
            this.log(cmd.name + ' is not unique.');
          }
        }
        this.dictionaryHead = cmd;
      }
    }, true);

    this.addToDictionary(':', () => {
      this.executeWords('create');
      this.enterCompilationMode();
    });

    this.addToDictionary('do', () => {
      this.interpret('swap >R >R');
      this.newCommands.push(new CustomCommand("Anonymous", undefined, this));
      this.enterCompilationMode();
    });

    this.addToDictionary('loop', () => {
      this.interpret('} R> inc >R');
    }, true);

    this.addToDictionary('[', () => {
      this.newCommands.push(new ArrayCommand(this));
      this.enterCompilationMode();
    }, true);

    this.addToDictionary(']', () => {
      this.executeString('}');
    }, true);

    this.addToDictionary('array?', () => {
      this.pushToDataStack(Array.isArray(this.popFromDataStack()));
    });

    this.addToDictionary('[]', () => {
      this.pushToDataStack([]);
    });

    this.addToDictionary('{}', () => {
      this.pushToDataStack({});
    });

    this.addToDictionary('undefined', () => {
      this.pushToDataStack(void 0);
    });

    this.addToDictionary('null', () => {
      this.pushToDataStack(null);
    });

    this.interpret(': call word @ exec ;');

    this.interpret(': arity1 1 arity ;');
    this.interpret(': arity2 2 arity ;');
    this.interpret(': arity3 3 arity ;');
    this.interpret(': arity4 4 arity ;');

    this.addToDictionary('{', () => {
      this.newCommands.push(new ObjectCommand(this));
      this.enterCompilationMode();
    }, true);

    this.addToDictionary('object?', () => {
      const obj = this.popFromDataStack();
      this.pushToDataStack(isObject(obj));
    });

    this.addToDictionary('concat', () => {
      const arr1 = this.popFromDataStack();
      if (Array.isArray(arr1)) {
        this.pushToDataStack(arr1.concat(this.popFromDataStack()));
      } else {
        this.error('first item on the stack needs to be an array for concat');
      }
    });

    this.interpret(': rot 2 roll ;');

    this.interpret(': inc 1 + ;');

    this.interpret(': dec 1 - ;');

    this.addToDictionary('.list', () => {
      let node = this.dictionaryHead;
      if (node) {
        do {
          this.log(node.name);
        } while (!!(node = node.prev));
      }
    }, true);

    this.addToDictionary('.values', () => {
      const keys = Object.getOwnPropertyNames(this.valueStore);
      const values = keys.map((key) => this.valueStore[key]);
      this.log(values);
    });

    this.addToDictionary('.keys', () => {
      const keys = Object.getOwnPropertyNames(this.valueStore);
      this.log(keys);
    });

    this.addToDictionary('.vs', () => {
      this.log(this.valueStore);
    });
  }
}
