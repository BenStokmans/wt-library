import type {Express, Request, Response} from "express";
import ejs from "ejs";
import passport from "passport";
import {User} from "./models/user.ts";
import bcrypt from "bcrypt";
import type { Database } from "sqlite";

export default function (app: Express, db: Database): void {
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
  );

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

      if (await User.getByUsername(req.body.username, db)) { // user already exists
        req.flash("error", "Username already exists");
        res.redirect("/signup");
        return;
      }

      const user = new User({
        username: req.body.username,
        email: req.body.email,
        firstName: req.body.first_name,
        lastName: req.body.last_name,
        streetAndNumber: req.body.street_and_number,
        zipCode: req.body.zip_code,
        city: req.body.city,
        passwordHash: await bcrypt.hash(req.body.password, 10),
      });
      if (!await User.create(user, db)) {
        res.status(500);
        return;
      }

      req.login(user, err => {
        if (err) {
          res.redirect("/login");
          return;
        }
        res.redirect("/");
      });
    },
  );
}