export class RetryNeededException extends Error {
  constructor(message: string = 'Retry needed') {
    super(message);
    this.name = 'RetryNeededException';
    Object.setPrototypeOf(this, RetryNeededException.prototype);
  }
}

