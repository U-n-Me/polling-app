// server.js
// where your node app starts

// init project
var express = require('express');
var session = require('express-session');
var router = require('./router');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();


var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(session({secret:"5x@12XnXAaS"}));

// for parsing multipart/ form data
app.use(upload.array()); 

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

router.route(app);

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
