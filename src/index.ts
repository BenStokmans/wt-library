import express, { type Request, type Response, type NextFunction, type Express } from 'express';
import passport from "passport";
import applyStrategy from "./mixins/passport"
import ejs from "ejs";
import bcrypt from "bcrypt";
import log from "./mixins/logger"
import session from "express-session";
import cookieParser from "cookie-parser";
import flash from "connect-flash";
import { User, createUser, getUserByUsername } from "./models/user";

const app: Express = express();

app.use(session({
  secret: "demannenvancerberus",
  resave: false,
  saveUninitialized: true,
  // cookie: {
  //     maxAge: 3600000,
  // },
}))
app.use(cookieParser("demannenvancerberus"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// apply our strategy
applyStrategy(passport);

const port = process.env.PORT || 8080;

app.get(
  "/",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
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
    res.send(await ejs.renderFile("src/views/login.ejs", { message: req.flash("error") }));
  },
);

app.post(
  "/login",
  passport.authenticate("local", { successRedirect: "/", failureRedirect: "/login", failureFlash: true }),
);

app.get(
  "/signup",
  async (req: Request, res: Response): Promise<void> => {
    if (req.user) {
      res.redirect("/");
      return;
    }
    res.send(await ejs.renderFile("src/views/signup.ejs", { message: req.flash("error") }));
  },
);

app.get(
    "/logout",
    async (req: Request, res: Response): Promise<void> => {
        req.logout(() => {});
        res.redirect("/");
    },
)

app.post(
  "/signup",
  async (req: Request, res: Response): Promise<void> => {
    if (!req.body.username || !req.body.password || !req.body.password_repeat) {
      res.status(400);
      return;
    }
    if (req.body.password !== req.body.password_repeat) {
      req.flash("error", "Passwords do not match");
      res.redirect("/signup");
      return;
    }

    if (await getUserByUsername(req.body.username)) { // user already exists
      req.flash("error", "Username already exists");
      res.redirect("/signup");
      return;
    }

    const user = new User(req.body.username, await bcrypt.hash(req.body.password, 10));
    if (!await createUser(user)) {
      res.status(500);
      return;
    }

    // log.info(`new user created with name ${req.body.username}`);
    // Retrieve user again to have id field populated.
    const createdUser = await getUserByUsername(req.body.username);
    if (!createdUser) {
      res.status(500);
      return;
    }

    req.login(createdUser, err => {
      if (err) {
        res.redirect("/login");
        return;
      }
      res.redirect("/");
    });
    res.status(401);
  },
);

app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
  // bcrypt.hash("vo", 10).then(v => {
  //    console.log(v);
  // });
});
