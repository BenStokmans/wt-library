export class User {
  public id: number;
  public username: string;
  public password: string;

  constructor(username: string, password: string, id?: number)  {
    this.id = id ?? 0; // create id of new user here
    this.username = username;
    this.password = password;
  }
}
