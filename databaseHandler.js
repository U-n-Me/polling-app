var mongodb = require('mongodb');
//      {username: user, voted.poll-id Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname, details set in .env
var MONGODB_URI = 'mongodb://'+process.env.DBUSER+':'+process.env.DBPASS+'@'+process.env.HOST+':'+process.env.DB_PORT+'/'+process.env.DB;
var connected = false;


// Will reference db's dreams collection
var users, polls, userPolls;

function connect(){
  if(!connected){
    mongodb.MongoClient.connect(MONGODB_URI, function(err, dbConnection) {
      if(err){
        console.log("Couldn't connect to database");
        throw err;
      }
      users = dbConnection.collection('users');
      polls = dbConnection.collection('polls');
      userPolls = dbConnection.collection('userPolls');
      connected = true;  
    });
  }
}


function login(user, pass, sendSession, sendRes){
  var found = false;
  var query = {username: user, password: pass};
  users.find(query).toArray(function(err, doc){
    if(err)throw err;
    if(doc.length > 0){
      sendSession({user: user, pass: pass});
      found = true;
    }
    var status = found ? "0" : "-1";
    sendRes(status);
  });
}

function signup(user, pass, sendRes){
  var alreadyThere = false;
  users.find({username: user}).toArray(function(err, doc){
    if(doc.length == 0){
      users.insert({username: user, password: pass});
      userPolls.insert({
        username: user,
        owns: [],
        voted: []
      });
      console.log('signup: added'); 
    }
    else{
      console.log('signup: alreadyThere'+ JSON.stringify(doc)); 
      alreadyThere = true;     
    }
    var status = alreadyThere ? "-1" : "0";
    sendRes(status);
  });
}

function addPoll(data, user){
  /* data is in json format. Mandatory fields are:
    poll-name, description, opt1, opt2
    
    i.e it has atleast two options (opt1, opt2). It may have
    options like opt3, opt4,.... etc, but you need to check for
    them dynamically.
  */
  var id = 0;
  polls.find({currentId: {$gte: 0}}).toArray(function(err, doc){
    if(err) throw err;
    if(doc.length == 0)
      polls.insert({currentId: id + 1});
    else{
      id = doc[0].currentId;
      polls.update(
        {currentId: id},
        {$set: {currentId: id + 1} }
      );
    }
    console.log(id);
    insertUserPolls(data, user, id);
    insertPolls(data, user, id);
  });
} 

function insertPolls(data, user, id){
  var name = data['poll-name'], description = data['description'];
  var options = [], numOfVotes = [];
  var opt = 1;
  while(true){
    var optn = "opt"+opt;
    if(!data.hasOwnProperty(optn))break;
    options.push(data[optn]);
    numOfVotes.push(0);
    opt += 1;
  }
  polls.insert({
    'owner': user,
    'poll-id': id,
    'poll-name': name,
    'description': description,
    'options': options,
    'votes': numOfVotes
  });
  console.log('insert into polls');
}

function insertUserPolls(data, user, id){
  userPolls.find({username: user}).toArray(function(err, doc){
    if(err) throw err;
      userPolls.update(
        {username: user},
        {$push: {'owns': {'poll-id': id, 'poll-name': data['poll-name']} } }
      );
  });
  console.log('insert into userPolls');
}

/*
  Sends poll-id and poll-name of polls whose owner
  is "user" or sends the poll-ids and poll-names
  of polls owned by "user"
*/
function getUserPollsDataChunk(user, sendData){
  userPolls.find({username: user}, {_id: 0, 'owns': 1}).toArray(function(err, doc){
    if(err) throw err;    
    //console.log(doc[0].owns);
    if(doc[0])
      sendData(doc[0]["owns"]);
    else
      sendData([]);
  });
}

function getAllPollDataChunk(sendData){
  polls.find({}, {_id: 0, 'poll-id': 1, 'poll-name': 1}).toArray(function(err, doc){
    if(err) throw err;
    if(doc.length > 1)  // means there are polls, now return everything except  
      sendData(doc.slice(1));    // first entry as that is currentId
    else
      sendData([]);
  });
}

function getPollData(id, sendData){
  id = parseInt(id);
  polls.find({'poll-id': id}).toArray(function(err, doc){
    if(err) throw err;
    console.log(doc[0]);
    sendData(doc[0]);
  });
}

function deletePoll(id, user){
  id = parseInt(id);
  polls.remove({'poll-id': id});
  console.log(id+' '+user);
  userPolls.update(
    {username: user},
    {$pull : {owns: {'poll-id': id} } }
  );
  //remove votes given to this poll by evry user
  
  userPolls.update(
    {},
    {$pull: {voted: {'poll-id': id} } },
    {multi: true}
  );
}

function getVote(pollId, user, sendData){
  if(typeof pollId !== 'number')
    pollId = parseInt(pollId);
  userPolls.find({username: user},{_id: 0, voted: 1}).toArray(function(err, doc){
    if(err) throw err;
    
    if(doc.length == 0)
      sendData("-1");
    else{
      var voted = doc[0].voted;
      var result = "-1";
      voted.forEach(function(vote){
        if(vote['poll-id'] === pollId)
          result = ""+vote['option'];
      });
      sendData(result);      
    }
  });
}

function submitVote(pollId, user, oldVote, newVote){
  if(typeof pollId !== 'number')
    pollId = parseInt(pollId);
  
  // oldVote -1 means user is voting this poll first time
  if(oldVote == -1){
    polls.find({'poll-id': pollId}, {_id: 0, votes: 1}).toArray(function(err, doc){
      var votes = doc[0].votes;
      votes[newVote]++;
      polls.update(
        {'poll-id': pollId},
        {$set: {votes: votes}}
      );
    });   
    
    // Put the new vote (vote) in user's voted field

    userPolls.update(
      {username: user},
      {$push : {voted: {'poll-id': pollId, option: newVote} } }
    );
  }
  else{ 
    polls.find({'poll-id': pollId}, {_id: 0, votes: 1}).toArray(function(err, doc){
      var votes = doc[0].votes;
      votes[newVote]++;
      votes[oldVote]--;
      polls.update(
        {'poll-id': pollId},
        {$set: {votes: votes}}
      );
    }); 
    
    // Remove oldvote from user's voted field
    
    userPolls.update(
      {username: user},
      {$pull : {voted: {'poll-id': pollId} } },
      
      function(err, result){
        // Put the new vote (vote) in user's voted field  
        userPolls.update(
          {username: user},
          {$push : {voted: {'poll-id': pollId, option: newVote} } }
        );
      }
    );
  
  }  
  
}

// Let's connect it for once and all
connect();

module.exports = {
  login: login,
  signup: signup,
  addPoll: addPoll,
  getUserPollsDataChunk: getUserPollsDataChunk,
  getAllPollDataChunk: getAllPollDataChunk,
  deletePoll: deletePoll,
  getPollData: getPollData,
  getVote: getVote,
  submitVote: submitVote
};

