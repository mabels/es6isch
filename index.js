
const express = require('express');
const es6isch = require('./es6isch.js');


const app = express();

app.use('/', express.static('./html'));
app.use('/es6isch/', (req, res) => {
  fsPath = '.' + req.url;
  console.log(fsPath);
  res.setHeader('content-type', 'application/javascript');
  res.send(es6isch(fsPath));
});

app.listen(3000, () => console.log('We speak es6isch on 3000'));

