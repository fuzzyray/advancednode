'use strict';

require('dotenv').config();
const express = require('express');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

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

const clientOptions = {useUnifiedTopology: true, retryWrites: true, w: 'majority'};
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
        if (password !== user.password) { return done(null, false); }
        return done(null, user);
      });
    }));

    app.route('/').get((req, res) => {
      const loginMsg = {
        title: 'Hello',
        message: 'Please login',
        showLogin: true,
      };
      res.render(`${process.cwd()}/views/pug/index.pug`, loginMsg);
    });

    const authOptions = {failureRedirect: '/'};
    app.post('/login', passport.authenticate('local', authOptions),
      (req, res) => {
        console.log(req.body);
        res.redirect('/profile');
      });

    const listener = app.listen(process.env.PORT || 3000, () => {
      console.log('Listening on port ' + listener.address().port);
    });
  }
});