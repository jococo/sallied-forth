export class ObjectCommand {
  _data: { [key: string]: any; };
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

  add(item: any) {
    if (this.key === undefined) {
      this.key = item;
    } else {
      this._data[this.key] = item;
      this.key = undefined;
    }
  }
}
