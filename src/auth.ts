import type {Express, Request, Response} from "express";
import ejs from "ejs";
import passport from "passport";
import {User, type UserOpts} from "./models/user";
import bcrypt from "bcrypt";
import type {Database} from "sqlite";
import log from "./logger";

/**
 * Configures routes for user authentication (login, logout, signup) on the provided Express app.
 * @param app The Express application.
 * @param urlBase The base URL path.
 * @param db The database connection.
 */
export default function (app: Express, urlBase: string, db: Database): void {
  // Configures routes for user authentication.

  // Route to render login page
  app.get(
    "/login",
    async (req: Request, res: Response): Promise<void> => {
      if (req.user) {
        res.redirect(urlBase);
        log.info("GET /login 200 OK");
        return;
      }
      res.send(await ejs.renderFile("src/views/login.ejs", {
        message: req.flash("error"),
        redirect: req.query.redirect,
        urlBase: urlBase,
      }));
      log.info("GET /login 200 OK");
    },
  );

  // Route to handle login form submission
  app.post(
    "/login",
    passport.authenticate("local", { failureRedirect: urlBase + "/login", failureFlash: true }),
    async (req: Request, res: Response): Promise<void> => {
      if (req.query.redirect) {
        res.redirect(<string>req.query.redirect);
        return;
      }
      res.redirect(urlBase);
    },
  );

  // Route to render signup page
  app.get(
    "/signup",
    async (req: Request, res: Response): Promise<void> => {
      if (req.user) {
        res.redirect(urlBase);
        return;
      }
      // @ts-expect-error hier hebben opzich geen idee of oldOpts bestaat maar maakt niet uit dus tsc moet even stoppen met klagen
      let oldOpts: UserOpts = req.session.oldOpts;
      if (!oldOpts) oldOpts = {
        city: "",
        email: "",
        firstName: "",
        lastName: "",
        passwordHash: "",
        streetAndNumber: "",
        username: "",
        zipCode: "",
      };
      res.send(await ejs.renderFile("src/views/signup.ejs", {oldOpts: oldOpts, message: req.flash("error"), urlBase: urlBase}));
      log.info("GET /signup 200 OK");
    },
  );

  // Route to handle user logout
  app.get(
    "/logout",
    async (req: Request, res: Response): Promise<void> => {
      req.logout(() => {});
      log.info("GET /logout 200 OK");
      res.redirect(urlBase);
    },
  );

  // Route to handle user signup form submission
  app.post(
    "/signup",
    async (req: Request, res: Response): Promise<void> => {
      if (!req.body.username || !req.body.email || !req.body.first_name || !req.body.last_name || !req.body.street_and_number || !req.body.zip_code || !req.body.zip_code || !req.body.password || !req.body.password_repeat) {
        res.status(400);
        log.info("POST /signup 400 Bad Request");
        return;
      }

      const opts: UserOpts = {
        username: req.body.username,
        email: req.body.email,
        firstName: req.body.first_name,
        lastName: req.body.last_name,
        streetAndNumber: req.body.street_and_number,
        zipCode: req.body.zip_code,
        city: req.body.city,
        passwordHash: await bcrypt.hash(req.body.password, 10),
      };
      const validationError = User.verifyOpts(opts);
      if (validationError !== null) {
        req.flash("error", validationError.message);
        log.info("POST /signup 200 OK");
        // @ts-expect-error bestaat inderdaad niet maar boeie
        req.session.oldOpts = opts;
        res.redirect(urlBase + "/signup");
        return;
      }

      if (req.body.password !== req.body.password_repeat) {
        req.flash("error", "Passwords do not match");
        log.info("POST /signup 200 OK");
        res.redirect(urlBase + "/signup");
        return;
      }

      try {
        if (await User.getByUsername(opts.username, db)) { // username already exists
          req.flash("error", "Username already exists");
          log.info("POST /signup 200 OK");
          res.redirect(urlBase + "/signup");
          return;
        }
        if (await User.getByEmail(opts.email, db)) { // email already exists
          req.flash("error", "Email address already in use");
          log.info("POST /signup 200 OK");
          res.redirect(urlBase + "/signup");
          return;
        }
      } catch (e) {
        log.error(`error while attempting to check username occupancy: ${e}`);
        req.flash("error", "an unknown error occurred while signing up");
        res.status(500);
        log.info("POST /signup 500 Internal Server Error");
        res.redirect(urlBase + "/signup");
        return;
      }


      const user = new User(opts);
      try {
        if (!await User.create(user, db)) {
          res.status(500);
          return;
        }
      } catch (e) {
        log.error(`error while attempting to create user: ${e}`);
        req.flash("error", "an unknown error occurred while signing up");
        res.status(500);
        log.info("POST /signup 500 Internal Server Error");
        res.redirect(urlBase + "/signup");
        return;
      }

      log.info("POST /signup 200 OK");
      req.login(user, err => {
        if (err) {
          res.redirect(urlBase + "/login");
          return;
        }
        res.redirect(urlBase);
      });
    },
  );
}