var CLIENT = {
  'username': null,
  'password': null,
  'loggedIn': false
};


$(function(){
  $.get("/userData", function(data){
    if(data.user){
      CLIENT.loggedIn = true;
      CLIENT.username = data.user;
      $('.login').html('Logout, '+data.user+'!');
    }
  });
  var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  $(".date").html(new Date().toLocaleString("en-GB", options));
});

function hideBlock(_class, hide){
  // if hide is true make hide _class, otherwise show it.
  var display = hide ? 'none' : 'block';
  $(_class).css({display: display});
}

function setOpacity(_class, opacity){
  $(_class).css({opacity: opacity});
}

$("button").click(function(){
  if(!CLIENT["loggedIn"]){
    alert("You need to login!!");
    hideBlock('.login-container', false);
    setOpacity('.container', 0.3);
  }
  else{
    var id = $(this).attr("id");   
    var location = '/'+id;
    //redirect(location, CLIENT, "post");
    window.location.href = location;   
  }
});

function redirect(location, args, method){
  method = method || "post";
  var form = $('<form></form>');
  form.attr("method", method);
  form.attr("action", location);

  $.each( args, function( key, value ) {
    var field = $('<input></input>');
    //alert(key+': '+value);
    field.attr("type", "hidden");
    field.attr("name", key);
    field.attr("value", value);
    form.append(field);
  });
  form.appendTo('body').submit();
}


$(".login").click(function(){
  if(!CLIENT["loggedIn"]){ 
    hideBlock('.login-container', false);
    setOpacity('.container', 0.3); 
  }
  else{
    $.get("/logout");
    CLIENT['loggedIn'] = false;
    $('.login').html('Login');
  }
});


function closePopUp(_class){
    var formId = _class == ".login-container" ? "#login-form" : "#signup-form";
    hideBlock(_class , true);
    setOpacity('.container', 1);
    $(formId)[0].reset();
}

function signup(){
    hideBlock(".signup-container" , false);
    hideBlock(".login-container" , true);
}

$("#signup-form").submit(function(){
  var user = $("#usernameS").val(),
  pass = $('#passwordS').val(),
  repass = $('#reenter-passwordS').val();
  if(pass !== repass)
    alert('Both passwords should match');
  else{    
    $.post('/signup?' + $.param({user: user, pass: pass}), function(data) {
      if(data < 0)
        alert("Couldn't sign up, this username is already taken");
      else{
        alert("Sign up succesful");
        $('#signup-form')[0].reset();
        hideBlock(".signup-container" , true);
        setOpacity('.container', 1);
      }
    });
  }
  return false;
});

$("#login-form").submit(function(){
  var user = $("#usernameL").val(),
  pass = $('#passwordL').val();
  $.post('/login?' + $.param({user: user, pass: pass}), function(data) {
    if(data < 0)
      alert("Incorrect credentials, try again");
    else{
      CLIENT.username = user;
      CLIENT.password = pass;
      CLIENT.loggedIn = true;
      $('.login').html('Logout, '+user+'!');
      $('#login-form')[0].reset();
      hideBlock(".login-container" , true);
      setOpacity('.container', 1);
    }
  });
  return false;
});
