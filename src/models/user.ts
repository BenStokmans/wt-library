import { v4 as uuidv4 } from 'uuid';

export class User {
  public id: string;
  public username: string;
  public password: string;

  constructor(username: string, password: string, id?: string) {
    this.id = id ?? uuidv4();
    this.username = username;
    this.password = password;
  }
}
