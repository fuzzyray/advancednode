'use strict';

require('dotenv').config();
const express = require('express');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport = require('passport');
const session = require('express-session');

const ObjectID = require('mongodb').ObjectID;

const app = express();
fccTesting(app); //For FCC testing purposes

const sessionCookie = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
};

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  done(null, null);
  //db.collection('users').findOne({_id: new ObjectID(id)}, (err, doc) => {done(null, doc);});
});

app.use(session(sessionCookie));
app.use(passport.initialize());
app.use(passport.session());
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'pug');

app.route('/').get((req, res) => {
  const loginMsg = {title: 'Hello', message: 'Please login'};
  res.render(`${process.cwd()}/views/pug/index.pug`, loginMsg);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + listener.address().port);
});
