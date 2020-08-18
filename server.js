'use strict';

require('dotenv').config();
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const MongoClient = require('mongodb').MongoClient;

const fccTesting = require('./freeCodeCamp/fcctesting.js');
const routes = require('./routes');
const auth = require('./auth');

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

    auth(app, db);
    routes(app, db);

    const listener = app.listen(process.env.PORT || 3000, () => {
      console.log('Listening on port ' + listener.address().port);
    });
  }
});