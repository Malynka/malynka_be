export class ClientNotDefinedException extends Error {
  constructor(msg: string) {
    super(msg);
  }
}