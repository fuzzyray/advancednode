'use strict';

require('dotenv').config();
const express = require('express');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');

const app = express();
// log all requests
app.use((req, res, next) => {
  console.log(`${Date.now()}: ${req.method} ${req.path} - ${req.ip}`);
  next();
});

fccTesting(app); //For FCC testing purposes

const sessionCookie = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
};

app.use(session(sessionCookie));
app.use(passport.initialize());
app.use(passport.session());
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'pug');

const clientOptions = {
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority',
};
const client = new MongoClient(process.env.MONGO_URI, clientOptions);
client.connect((err) => {
  console.log('mongo connect started...');
  if (err) {
    console.log(`Database error: ${err}`);
  } else {
    console.log('Connected to database');
    const db = client.db('advancednode');

    passport.serializeUser((user, done) => {
      done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
      db.collection('users')
        .findOne({_id: new ObjectID(id)}, (err, doc) => { done(null, doc); });
    });

    passport.use(new LocalStrategy((username, password, done) => {
      db.collection('users').findOne({username: username}, (err, user) => {
        console.log(`User: ${username} attempted login`);
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false);
        }
        return done(null, user);
      });
    }));

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

    const listener = app.listen(process.env.PORT || 3000, () => {
      console.log('Listening on port ' + listener.address().port);
    });
  }
});