import { Interpreter } from "../ts/Interpreter";

"use strict";

/**
  merge properties from obj2 into obj1 if they don't exist.
  returns obj1
*/
function mergeIn(obj1: any, obj2: any): any {
  let attrname: string;
  for (attrname in obj2) {
    if (obj2.hasOwnProperty(attrname)) {
      if (!obj1.hasOwnProperty(attrname) && obj1[attrname] === undefined) {
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
function pathRecur(pth: string[], str: any): any {
  if (pth.length > 0) {
    const nxt = pth.shift(); // remove first item
    const data = str[nxt];
    if (data !== undefined) {
      return pathRecur(pth, data);
    }
    return undefined;
  }
  return str;
}

function isObject(obj: any): boolean {
  return obj === Object(obj);
}

/**
 * CustomCommand
 *
 * handles the execution of custom forth words from the stack or vocabulary.
 *
 * @param name String
 * @param prev CustomCommand, the top of the current vocab
 * @scope ??
 * errorFn Function for custom error handling
 */
class CustomCommand {
  name: string;
  fn: () => void;
  errorFn: (txt: string) => void;
  prev: CustomCommand | undefined;
  functions: any[];
  executeAfterCreation: boolean;

  constructor(name: string, prev: CustomCommand | undefined, scope: any, errorFn?: (txt: string) => void) {
    this.name = name;
    this.fn = () => {
      this.functions.forEach((fn1) => {
        fn1.call(scope);
      });
    };
    this.errorFn = errorFn || ((txt: string) => {
      console.error("FORTH ERROR::CustomCommand: " + txt);
    });
    this.prev = prev;
    this.functions = [];
    this.executeAfterCreation = false;
  }

  add(fn2: any): void {
    if (typeof fn2 === 'function') {
      this.functions.push(fn2);
    } else {
      this.functions.push(() => {
        scope.pushToDataStack((item: any) => item)(fn2);
      });
    }
  }

  getMetaData(): { type: string } {
    return { type: 'CustomCommand' };
  }

  apply(ctx: any, args: any[]): any {
    return this.fn.apply(ctx, args);
  }
}

class ArrayCommand {
  _data: any[];
  fn: () => void;
  executeAfterCreation: boolean;

  constructor(scope: any) {
    this._data = [];
    this.fn = () => {
      scope.pushToDataStack(this._data);
    };
    this.executeAfterCreation = true;
  }

  add(item: any): void {
    this._data.push(item);
  }
}

class ObjectCommand {
  _data: { [key: string]: any };
  fn: () => void;
  key: string | undefined;
  executeAfterCreation: boolean;

  constructor(scope: any) {
    this._data = {};
    this.fn = () => {
      if (this.key === undefined) {
        scope.pushToDataStack(this._data);
      } else {
        scope.error("Unmatched key value pairs when defining Object. Key '" + this.key + "' does not have a value!");
      }
    };
    this.key = undefined;
    this.executeAfterCreation = true;
  }

  add(item: any): void {
    if (this.key === undefined) {
      this.key = item;
    } else {
      this._data[this.key] = item;
      this.key = undefined;
    }
  }
}

/**
  * A Stack implementation. Kinda useful in Forth.
  */
class Stack {
  name: string;
  _stack: any[];

  constructor(name: string) {
    this.name = name;
    this._stack = [];
  }

  push(item: any): Stack {
    this._stack.push(item);
    return this;
  }

  pop(): any {
    return this._stack.pop();
  }

  current(): any {
    return this._stack[this._stack.length - 1];
  }

  clear(): Stack {
    this._stack.length = 0;
    return this;
  }

  isEmpty(): boolean {
    return this._stack.length < 1;
  }
}

class CommandStack extends Stack {
  constructor() {
    super("Command Stack");
  }

  addToCurrent(item: any): void {
    this.current().add(item);
  }
}

class ResponseData {
  data: any[];
  status: string;
  stackSize: number;
  returnStackSize: number;

  constructor(status: string) {
    this.data = [];
    this.status = status;
    this.stackSize = 0;
    this.returnStackSize = 0;
  }

  push(item: any): void {
    this.data.push(item);
  }

  pop(): any {
    return this.data.pop();
  }
}

export class Interpreter {
  dataStack: any[];
  returnStack: any[];
  dictionaryHead: any;
  newCommands: CommandStack;
  _compilationModeStack: Stack;
  valueStore: any;
  version: { major: number; minor: number; build: number; revision: any };
  versionString: string;
  response: ResponseData;
  commands: string[];
  logFn: (item: any) => void;
  errorFn: (txt: string) => void;

  constructor(world: any) {
    this.dataStack = [];
    this.returnStack = [];
    this.dictionaryHead = undefined;
    this.newCommands = new CommandStack();
    this._compilationModeStack = new Stack();
    this.valueStore = mergeIn(world || {}, { 'false': false, 'true': true });
    this.version = {
      major: 0,
      minor: 0,
      build: 2,
      revision: undefined
    };
    this.versionString = '' +
      this.version.major + '.' +
      this.version.minor + '.' +
      this.version.build;
    if (this.version.revision) {
      this.versionString = this.versionString + '.' + this.version.revision;
    }
    this.logFn = (item: any) => {
      this.response.push(item);
    };
    this.errorFn = (txt: string) => {
      throw ('FORTH ERROR: ' + txt);
    };
  }

  compilationMode(): boolean {
    return !!this._compilationModeStack.current();
  }

  enterCompilationMode(): void {
    this._compilationModeStack.push(true);
  }

  leaveCompilationMode(): void {
    this._compilationModeStack.pop();
  }

  log(item: any): void {
    this.logFn && this.logFn(item);
  }

  error(txt: string): void {
    this.errorFn && this.errorFn(txt);
  }

  pushToDataStack(...args: any[]): void {
    args.forEach((item) => {
      this.dataStack.push(item);
    });
  }

  popFromDataStack(): any {
    if (this.dataStack.length < 1) {
      this.error("DataStackUnderFlow!");
    }
    return this.dataStack.pop();
  }

  pushToReturnStack(...args: any[]): void {
    args.forEach((item) => {
      this.returnStack.push(item);
    });
  }

  popFromReturnStack(): any {
    if (this.returnStack.length < 1) {
      this.error("ReturnStackUnderFlow!");
    }
    return this.returnStack.pop();
  }

  addToDictionary(name: string, fn: () => void, imm?: boolean): void {
    if (this.dictionaryHead) {
      const newNode = { name: name, fn: fn, prev: this.dictionaryHead, immediate: !!imm };
      this.dictionaryHead = newNode;
    } else {
      this.dictionaryHead = { name: name, fn: fn, immediate: !!imm };
    }
  }

  setValue(name: string, value: any): void {
    this.valueStore[name] = value;
  }

  getValue(name: string): any {
    let value = this.valueStore[name];
    if (!value) {
      const path = name.split(".");
      if (path.length > 1) {
        value = pathRecur(path, this.valueStore);
      }
    }
    return value;
  }

  findDefn(head: any, name: string): any {
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

  findJSDefinition(name: string): any {
    let defn = this.getValue(name);
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

  findWordDefinition(name: string): any {
    if (this.dictionaryHead) {
      const defn = this.findDefn(this.dictionaryHead, name);
      if (defn) {
        return defn;
      }
    }
    return undefined;
  }

  executeFunctions(...args: any[]): void {
    args.forEach((fn) => {
      fn.call(this);
    });
  }

  executeWords(...args: string[]): void {
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
        throw ('Function ' + name + ' not found!');
      });
      this.executeFunctions(...allFunctions);
    } catch (err) {
      this.error(err);
    }
  }

  executeString(forthTxt: string): void {
    this.executeWords(...forthTxt.split(' '));
  }

  processCommands(): void {
    let nextCommandName;
    while (nextCommandName = this.commands.shift()) {
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

  setLogFunction(fn: (item: any) => void): void {
    this.logFn = fn;
  }

  setErrorFunction(fn: (txt: string) => void): void {
    this.errorFn = fn;
  }
}
