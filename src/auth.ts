import type {Express, Request, Response} from "express";
import ejs from "ejs";
import passport from "passport";
import {User} from "./models/user";
import bcrypt from "bcrypt";
import type { Database } from "sqlite";
import log from "./logger";

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
      if (!req.body.username || !req.body.email || !req.body.first_name || !req.body.last_name || !req.body.street_and_number || !req.body.zip_code || !req.body.zip_code || !req.body.password || !req.body.password_repeat) {
        res.status(400);
        log.info(`POST /signup 400 Bad Request`);
        return;
      }

      if (req.body.password !== req.body.password_repeat) {
        req.flash("error", "Passwords do not match");
        res.redirect("/signup");
        return;
      }

      // also check user email
      try {
          if (await User.getByUsername(req.body.username, db)) { // user already exists
              req.flash("error", "Username already exists");
              res.redirect("/signup");
              return;
          }
      } catch (e) {
          log.error(`error while attempting to check username occupancy: ${e}`);
          req.flash("error", "an unknown error occurred while signing up");
          res.redirect("/signup");
          return;
      }

      let zipCodeRegExp = new RegExp("^[1-9][0-9]{3}[A-Z]{2}$");
      let emailRegexp = new RegExp("(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\\])\n");

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

      try {
          if (!await User.create(user, db)) {
              res.status(500);
              return;
          }
      } catch (e) {
          log.error(`error while attempting to create user: ${e}`);
          req.flash("error", "an unknown error occurred while signing up");
          res.redirect("/signup");
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