import * as sqlite from "sqlite3";
import { User } from "../models/user";

const db = new sqlite.Database("sqlite.db");

export async function getUserByUsername(username: string): Promise<User | null> {
    const sql = `SELECT DISTINCT user_id, passwd_hash FROM users WHERE username = ?`;

    let user: User | null = null;

    db.get(sql, [username], (err, row) => {
        console.log(row);
    });

    return user;
}

export async function getUserById(id: number):  Promise<User | null> {
    const sql = `SELECT DISTINCT username, passwd_hash FROM users WHERE user_id = ?`;

    let user: User | null = null;

    db.get(sql, [id], (err, row) => {
        console.log(row);
    });

    return user;
}
