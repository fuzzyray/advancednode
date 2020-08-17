'use strict';

const express = require('express');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const app = express();

fccTesting(app); //For FCC testing purposes
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
