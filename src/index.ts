import express, { type Request, type Response, type NextFunction, type Express } from 'express';
import * as sqlite from "sqlite3";
import passport from "passport";
import applyStrategy from "./mixins/passport"
import ejs from "ejs";
import bcrypt from "bcrypt";
import session from "express-session";

const app: Express = express();

app.use(session({
    secret: "demannenvancerberus",
    resave: false,
    saveUninitialized: true,
}))
app.use(express.urlencoded());
app.use(express.json());
app.use(passport.initialize())

// apply our strategy
applyStrategy(passport);

const port = process.env.PORT || 8080;

app.get(
    "/",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (req.user) {
            res.send("Welcome " + req.user.username);
            return;
        }
        res.send("Guest page");
    },
);

app.get(
    "/login",
    async (req: Request, res: Response): Promise<void> => {
        if (req.user) {
          res.redirect("/");
          return;
        }
        res.send(await ejs.renderFile("src/views/login.ejs", { error: null }));
    },
);

app.post(
    "/login",
    passport.authenticate("local", { successRedirect: "/" }),
);

// app.get(
//     "/signup"
// );

app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
    // bcrypt.hash("vo", 10).then(v => {
    //    console.log(v);
    // });
});
