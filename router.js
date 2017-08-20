var db = require('./databaseHandler');

function route(app){  
  // http://expressjs.com/en/starter/basic-routing.html
  app.get("/", function (request, response) {
    response.sendFile(__dirname + '/views/index.html');
  });
  
  app.get("/userData", function(req, res){
    res.json({user: req.session.user, pass: req.session.pass});
  });
  
  app.get('/logout', function(req, res){
    req.session.destroy(function(err){
      if(err)console.log("Err while destroying session on logout");
      res.redirect('/');
    });
  });

  app.get("/vote", function (req, res) {
    //console.log(req.body);
    res.sendFile(__dirname + '/views/votes.html');
  });
  
   app.get("/user-polls", function (req, res) {
    //console.log(req.body);
    res.sendFile(__dirname + '/views/myPolls.html');
  }); 
  
  app.get("/create-poll", function (req, res) {
    //console.log(req.body);
    res.sendFile(__dirname + '/views/createPoll.html');
  }); 
  
  // If can't sign in for what ever reason, send some negative response
  app.post("/signup", function (req, res){
    var pass = req.query.pass;
    var user = req.query.user;
    db.signup(user, pass, res);
  });

  // If login not succesful, send some negative response
  app.post("/login", function (req, res){
    var pass = req.query.pass;
    var user = req.query.user;
    db.login(user, pass, req, res);    
  });
  
  app.post("/makePoll", function(req, res){
    console.log(req.body);
    db.addPoll(req.body, req.session.user);
    res.redirect("/user-polls");
  });
  
  // Sends poll id's of this session user
  app.get("/getUserPolls", function(req, res){
    db.getUserPollsDataChunk(res, req.session.user);
  });
  
  app.get("/getAllPolls", function(req, res){
    db.getAllPollDataChunk(res);
  });
  
  app.get('/deletePoll', function(req, res){
    db.deletePoll(req.query['poll-id'], req.session.user);
  });
  
  app.get('/getPollData', function(req, res){
    db.getPollData(req.query['poll-id'], res);
  });
  
  app.get('/getVote', function(req, res){
    db.getVote(req.query['poll-id'], req.query['user'], res);
  });
  
  app.get('/submitVote', function(req, res){
    db.submitVote(req.query['poll-id'], req.query.user, req.query.old, req.query.new);
    res.send("okay");
  });
  
}

module.exports = {
  route: route
};
