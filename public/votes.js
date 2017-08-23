var user, myPolls, oldVote;
// Optional; add a title and set the width and height of the chart
var chartOptions = {legend: {position: 'right', textStyle: {color: 'aaa', fontSize: 16}},
               'title':'My', titleTextStyle : {color: '#777'},
               is3D: true,
               'backgroundColor': '#333', 'width': 500, 'height': 400,
               'fontSize': 20
              };


$(function(){
  $.get("/userData", function(data){    
    if(data.user){
      user = data.user;
      $('.menu #user').html(user + ' &#9662;');  
      
      $.get("/getAllPolls", function(data){
        myPolls = data;
        if(data.length == 0)
          $('#id0 .poll-name').text("Nothing here, go create some polls");
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
    var pollHtml = "<div class = 'poll' id = '"+pollData['poll-id']+
                          "' onclick = \"poll_open('"+ pollData['poll-id'] +"')\" style = 'cursor: pointer;'>"+
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

function poll_open(id){
  $('.poll-container').css({display: "none"});
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
  $('.poll-container').css({display: 'flex'});
  $('.details-container').css({display: 'none'});
  $('.info .poll-name').text("");
  $('.info .poll-owner').text("");
  $('.info .description').text("");
  $('.poll-options').html("");
  $('.info button').text('SUBMITx');
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
