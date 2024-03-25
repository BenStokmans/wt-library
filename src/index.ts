import express, { type Request, type Response, type NextFunction, type Express } from 'express';
import * as sqlite from "sqlite3";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

const app: Express = express();
const db = new sqlite.Database("sqlite.db");

app.use(express.json());
app.use(passport.initialize())
passport.use("local", new LocalStrategy((username, password, done) => {

}));

const port = process.env.PORT || 8080;

app.get(
  '/',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({message: "Hello world!"});
    } catch (error: unknown) {
      next(new Error((error as Error).message));
    }
  },
);

app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
