// LOAD NEXTBUS DATA

var stops = [];

$(document).ready(function() {
  $.ajax({
    url: 'http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=sf-muni&r=N',
    type: 'GET',
    dataType: 'xml',
    success: function(xml) {
      var $route = $(xml).find('route')[0];
      for (var j = 0; j < $route.childNodes.length; j++) {
        var stop = $route.childNodes[j];
        if (stop.tagName == 'stop') {
          var parsedStop = {
            tag: stop.getAttribute('tag'),
            title: stop.getAttribute('title'),
            lat: stop.getAttribute('lat'),
            lon: stop.getAttribute('lon')
          };
          stops.push(parsedStop);
        }
      }
        
      console.log('stops: ', stops);
    }
  });
});
