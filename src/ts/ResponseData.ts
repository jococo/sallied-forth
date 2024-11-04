export class ResponseData {
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

  push(item: any) {
    this.data.push(item);
  }

  pop() {
    return this.data.pop();
  }
}
