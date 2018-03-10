
export class Timestamped<T> {
  public readonly timeStamp: number;
  public readonly data: T;
  constructor(data: T) {
    this.timeStamp = Date.now();
    this.data = data;
  }
}
