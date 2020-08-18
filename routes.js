'use strict';

const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = (app, db) => {
  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  };

  app.route('/')
    .get((req, res) => {
      const mainVars = {
        title: 'Hello',
        message: 'Please login',
        showLogin: true,
        showRegistration: true,
      };
      res.render(`${process.cwd()}/views/pug/index.pug`, mainVars);
    });

  const authOptions = {failureRedirect: '/'};
  app.route('/login')
    .post(passport.authenticate('local', authOptions), (req, res) => {
      res.redirect('/profile');
    });

  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    const profileVars = {
      username: req.user.username,
    };
    res.render(`${process.cwd()}/views/pug/profile`, profileVars);
  });

  app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
    });

  app.route('/register')
    .post((req, res, next) => {
        const hash = bcrypt.hashSync(req.body.password, 12);
        db.collection('users')
          .findOne({username: req.body.username}, (err, user) => {
            if (err) {
              next(err);
            } else if (user) {
              res.redirect('/');
            } else {
              db.collection('users').insertOne({
                username: req.body.username,
                password: hash,
              }, (err, doc) => {
                if (err) {
                  res.redirect('/');
                } else {
                  next(null, user);
                }
              });
            }
          });
      }, passport.authenticate('local', authOptions), (req, res, next) => {
        res.redirect('profile');
      },
    );

  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
}