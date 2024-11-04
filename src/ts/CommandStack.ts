import { Stack } from "./Stack";

export class CommandStack extends Stack {
  constructor() {
    super("Command Stack");
  }

  addToCurrent(item: any) {
    this.current().add(item);
  }
}
