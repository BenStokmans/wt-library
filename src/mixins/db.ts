import * as sqlite from "sqlite3";
import { User } from "../models/user";

const db = new sqlite.Database("sqlite.db");

export function getUserByUsername(username: string): Promise<User | null> {
    const sql = `SELECT * FROM users WHERE username = ?`;

    return new Promise<User | null>(resolve => {
        db.get(sql, username, (err, row) => {
            if (err || !row) {
                resolve(null);
                return;
            }
            resolve(new User(row.username, row.passwd_hash, row.user_id));
        });
    });
}

export function getUserById(id: number): Promise<User | null> {
    const sql = `SELECT * FROM users WHERE user_id = ?`;

    return new Promise<User | null>(resolve => {
        db.get(sql, id, (err, row) => {
            if (err) {
                resolve(null);
                return;
            }
            resolve(new User(row.username, row.passwd_hash, row.user_id));
        });
    });
}

export function createUser(user: User): Promise<Boolean> {
    const sql = `INSERT INTO users VALUES (?, ?, ?)`;

    return new Promise<Boolean>(resolve => {
        db.run(sql, [user.id, user.username, user.password], err => {
            if (err) {
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
}
