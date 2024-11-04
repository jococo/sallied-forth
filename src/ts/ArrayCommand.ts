
export class ArrayCommand {
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

  add(item: any) {
    this._data.push(item);
  }
}
