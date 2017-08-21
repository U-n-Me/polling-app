var user, myPolls, oldVote;
// Optional; add a title and set the width and height of the chart
var chartOptions = {legend: {position: 'right', textStyle: {color: 'aaa', fontSize: 14}},
               'title':'My Average Day', titleTextStyle : {color: '#777'},
               is3D: true,
               'backgroundColor': '#333', 'width': 500, 'height': 400,
               'fontSize': 20
              };


$(function(){
  $.get("/userData", function(data){    
    if(data.user){
      user = data.user;
      $('.menu #user').html(user + ' &#9662;');  
      
      $.get("/getUserPolls", function(data){
        myPolls = data;
        if(data.length == 0)
          $('#id0 .poll-name').text("You don't have any polls. Create Now");
        else{
          $('#id0').css({display: 'none'});
          showMiniPolls();          
        }
      });
      
    }
    else{
      alert("you are not logged in, log in to continue");
      window.location.href = "/";
    }
  });
});

function showMiniPolls(){
  myPolls.forEach(function(pollData){
    var pollHtml = "<div class = 'poll' id = '"+pollData['poll-id']+"'>"+
        "<div class = 'select-btn' onclick = \"Option_open('#"+pollData['poll-id']+"')\">☰</div>"+
          "<ul class = 'options'>"+
              "<li><span onclick = 'Option_close()'>Close</span></li>"+
              "<li><span onclick = \"poll_open('"+ pollData['poll-id'] +"')\">Open</span></li>"+
              "<li><span onclick = \"poll_delete('"+ pollData['poll-id'] +"')\">Delete</span></li>"+
            "</ul>"+
        "<div class = 'poll-name'>"+ pollData['poll-name'] +"</div>"+
      "</div>";   
    $('.poll-container').append(pollHtml);
  });
}

function drawChart(data){
/*Pie chart*/
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(drawChart);

  // Draw the chart and set the chart values
  function drawChart() {
    var Cdata = google.visualization.arrayToDataTable(data);

    // Display the chart inside the <div> element with id="piechart"
    var chart = new google.visualization.PieChart(document.getElementById('piechart'));
    chart.draw(Cdata, chartOptions);  
  }
}

function getPage(location){
  window.location.href = location;     
}

function Option_open(id){
  Option_close();
  $(id+' > ul').css({display: "block"});
}

function Option_close(){
  $('.options').css({display: "none"});
}

function poll_delete(id){  
  $('.Dmsg > span').text(id);
  $('.options').css({display: "none"});
  $('.delete-container').css({display: 'block'});
}

function deletePoll(conform){
  if(conform){
    var id = $('.Dmsg > span').text();
    $.get('/deletePoll', {'poll-id': id}, function(data){});
    $('#'+id).css({display: 'none'});
  }
  $('.delete-container').css({display: 'none'});  
}

function poll_open(id){
  $('.poll-container').css({display: "none"});
  $('.options').css({display: "none"});
  showMsg('Opening, please wait..');
  $.get("/getPollData", {'poll-id' : id}, function(data){
    var name = data['poll-name'],
        owner = data['owner'],
        description = data['description'],
        options = data['options'],
        votes = data['votes'];
    
    $('.info .poll-name').text(name);
    $('.info .poll-owner').text(owner);
    $('.info .description').text(description);
    
    chartOptions.title = name;
    var chartData = [['Task', name]];
    for(var opt = 0; opt < options.length; opt++){
      chartData.push([options[opt], votes[opt]]);
      var optionHtml = "<label><input type = 'radio' name = 'options' value = '"+opt+
          "'><span id = '"+opt+"'>"+options[opt]+"</span></label><br>";
      $('.poll-options').append(optionHtml);
    }
    $('input[value = 0]').attr({checked: true});
    $('.info button').attr({id: id});
    
    $.get('/getVote', {'poll-id': id, user: user}, function(data){
      // If data is negative, it means this user hasn't voted this poll
      oldVote = data;
      if(data >= 0){
        $('input[value = '+data+']').attr({checked: true});
        $('span[id = '+data+']').css({color: "#D59"});
        $('.info button').text('Re-SUBMIT');
      }      
      hideMsg();
      $('.details-container').css({display: 'flex'});
    });
    
    drawChart(chartData);
  });
}

function close_details_container(){
  $('.poll-container').css({display: "flex"});
  $('.details-container').css({display: 'none'});
  $('.info .poll-name').text("");
  $('.info .poll-owner').text("");
  $('.info .description').text("");
  $('.poll-options').html("");
}

$('#poll-submit').click(function(){
  var newVote = $('input[type = radio]:checked').val(),
      id = $(this).attr('id');
  oldVote = parseInt(oldVote);
  newVote = parseInt(newVote);
  id = parseInt(id);
  if(oldVote != newVote){     
    showMsg('SUBMITTING..');
    $.get('/submitVote', {'poll-id': id, user: user, old: oldVote, new: newVote}, function(data){
      hideMsg();
    });
  }
  close_details_container();
});

function showMsg(message){
  $('.msg').text(message);
  $('.msg').css({display: 'block'});
}

function hideMsg(){
  $('.msg').css({display: 'none'});
}

/*
  user-polls:
  [
   {
    user: username,
    owns: [
            {
              poll-id: id,
              poll-name: name
            }
         ]
    voted: [
             {
              poll-id: id,
              vote-option: option
             }
          ]
   }
  ]
  
  
  poll-data:
  [
    {
      poll-id: id,
      poll-name: name,
      description: description,
      options: []
      votes: []
    }
  ]
*/