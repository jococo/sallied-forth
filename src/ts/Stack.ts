
export class Stack {
  name: string;
  _stack: any[];

  constructor(name: string) {
    this.name = name;
    this._stack = [];
  }

  push(item: any) {
    this._stack.push(item);
    return this;
  }

  pop() {
    return this._stack.pop();
  }

  current() {
    return this._stack[this._stack.length - 1];
  }

  clear() {
    this._stack.length = 0;
    return this;
  }

  isEmpty() {
    return this._stack.length < 1;
  }
}
