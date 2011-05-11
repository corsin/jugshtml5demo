// Configuration.
var dataUrl = "data/data.json";
var zurichLat = 47.22;
var zurichLong = 8.33;
var bernLat = 46.57;
var bernLong = 7.27;

// Data
var speakers = new Array();
var events = new Array();
var data = undefined;
var userLocation = undefined;

// Update the event data.
function updateData() {
  console.log("updating data...");
  $.ajaxSetup({
    timeout: 1000
  });
  $(document).ajaxError(function (event, request, settings, exception) {
    console.log("data update failed: " + exception);
    updateScreens();
  });
  console.log("loading data from " + dataUrl);
  $.getJSON(dataUrl, function(data) {
    console.log("data = " + data);
    window.localStorage.setItem("data", $.toJSON(data));
    console.log("data was updated");
    updateScreens();
  });
}

// Update the screens
function updateScreens() {
  console.log("updating screen...");
  
  data = $.parseJSON(window.localStorage.getItem("data"));
  if (data == undefined) {
    console.log("no data found");
    return;
  }
  
  // prepare speakers map
  speakers = new Array();
  $.each(data.speakers, function (i, speaker) {
    speakers[speaker.id] = speaker;
  });
  
  // prepare the events map
  events = new Array();
  $.each(data.events, function (i, event) {
    events[event.id] = event;
  });
  
  updateEventsScreen(data);
  
  console.log("screen was updated");
}

// Update the events screen
function updateEventsScreen() {

  $.each(data.events, function (i, event) {
    var li = $("<li/>");
    li.addClass(event.location);
    var a = $("<a/>").attr("href", "javascript:selectEvent('" + event.id + "');");
    a.append($("<h2/>").append(event.name));
    a.append($("<p/>").append(event.location + ", " + event.date));
    li.append(a);
    $("#eventList").append(li);
  });
  if ($("#eventList").attr("class").indexOf("ui-listview") < 0) {
    $("#eventList").listview();
  } else {
    $("#eventList").listview('refresh');
  }
}

// Update the event screen
function updateEventScreen(eventId) {
  
  var event = events[eventId];
  
  // update the title
  $("h2#eventTitle").empty().append(event.name);
  
  // update the event location and date
  $("p#eventLocationAndDate").empty().append(event.location + ", " + event.date);
  
  // update the abstract
  $("p#eventAbstract").empty().append(event.abstract);
  
  // update the speakers
  $("#eventSpeakers").empty();
  var speakersElement = $("<ul/>").attr("data-inset", "true");
  $("#eventSpeakers").append(speakersElement);
  if (event.speakers != undefined) {
    $.each(event.speakers, function (i, speakerId) {
      var speaker = speakers[speakerId];
      var speakerElement = $("<li/>");
      speakerElement.append($("<img/>").attr("alt", speaker.name).attr("src", "images/" + speaker.id + ".jpg"));
      speakerElement.append(speaker.name + ", " + speaker.affiliation)
      speakersElement.append(speakerElement);
    });
  }
  $("#eventSpeakersTitle").after(speakersElement);
  if (speakersElement.attr("class").indexOf("ui-listview") < 0) {
    speakersElement.listview();
  } else {
    speakersElement.listview('refresh');
  }
}

// update the chart
function updateChart() {
  console.log("updating the chart...");
  var points = [[1998, 100], [1999, 150], [2000, 180], [2001, 250], [2002, 300], [2003, 400], [2004, 430], [2005, 480], [2006, 550], [2007, 620], [2008, 770], [2009, 800], [2010, 920]];
  var data = [ {
     color : "rgb(160, 0, 0)",
     data : points
  } ];
  var options = {
          series : {
            bars : {
              show : false
            },
            lines : {
              show : true
            },
            points : {
              show : false
            }
          },
          xaxis : {
            min: 1998,
            max: 2010,
            autoScaleMargin: 2,
            tickDecimals: "number",
            minTickSize: 4
          },
          grid : {
            show : true,
            aboveData : false,
            color : "silver",
            labelMargin : 0,
            axisMargin : 0,
            borderWidth : 0,
            borderColor : null,
            minBorderMargin : null,
            labels: false
          }
    };
  $.plot($("#memberChart"), data, options);
}

// select an event
function selectEvent(eventId) {
  console.log("select event '" + eventId + "'");
  
  // update the event page
  updateEventScreen(eventId);
  
  // show the event page
  $.mobile.changePage("#event");
}

// update the location
function updateLocation() {
  if (navigator.geolocation) {
   navigator.geolocation.getCurrentPosition(function (position) {  
      var latitude = position.coords.latitude;
      var longitude = position.coords.longitude;
      var distanceToBern = Math.sqrt(Math.pow(bernLat - latitude, 2) + Math.pow(bernLong - longitude, 2));
      var distanceToZurich = Math.sqrt(Math.pow(zurichLat - latitude, 2) + Math.pow(zurichLong - longitude, 2));
      if (distanceToZurich < distanceToBern) {
        userLocation = "Zurich";
      } else {
        userLocation = "Bern";
      }
      console.log("user is in " + userLocation);
      $.each($("#eventList li"), function (i, item) {
        if ($(item).attr("class").indexOf(userLocation) >= 0) {
          $(item).addClass("localEvent");
        }
      });
   }, function (error) {
     switch(error.code) 
     {
       case error.TIMEOUT:
         console.log ('Location timeout');
         break;
       case error.POSITION_UNAVAILABLE:
         console.log ('Position unavailable');
         break;
       case error.PERMISSION_DENIED:
         console.log ('Permission denied for location lookup');
         break;
       case error.UNKNOWN_ERROR:
         console.log ('Unknown error for location lookup');
         break;
     }
   });
 }
}

// initialization
$(document).bind("mobileinit", function(){
 
  // handle the display of the splash screen
  $('div').live('pageshow',function(event, ui){
    if("splash" == event.target.id) {
      window.setTimeout(function () {
        $.mobile.changePage("#home", "fade");  
      }, 2000);
    }
    if("home" == event.target.id) {
      updateChart();
    }
  });
  
  // handle swipe events
  $('div').live('swipeleft',function(event, ui) {
    $.mobile.changePage("#home", "slide");  
  });
  // $('div').live('swiperight',function(event, ui){
  //     $.mobile.changePage("#about", "fade");  
  //   });
 
  // get the location
  updateLocation();
  
  // update the data
  updateData();
  
});