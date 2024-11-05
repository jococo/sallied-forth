export class CustomCommand {
  name: string;
  fn: Function;
  errorFn: (txt: string) => void;
  prev: CustomCommand | undefined;
  functions: Array<() => void>;
  executeAfterCreation: boolean;
  scope: any;

  constructor(name: string, prev: CustomCommand | undefined, scope: any, errorFn?: (txt: string) => void) {
    this.scope = scope;
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

  getMetaData() {
    return { type: 'CustomCommand' };
  }

  apply(ctx: any, args: any[]) {
    return this.fn.apply(ctx, args);
  }

  add(fn2: (() => void) | any) {
    if (typeof fn2 === 'function') {
      this.functions.push(fn2);
    } else {
      this.functions.push(() => {
        this.scope.pushToDataStack((item: any) => item);
      });
    }
  }
}
