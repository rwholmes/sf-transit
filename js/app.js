/** SF Transit | by Robert Holmes **/

var Map = require('./map.js');

// User Interface
$(document).ready(function() {
  var map = new Map();
  map.init();
  map.updateLocations();

  // Listeners
  $('button').on('click', function() {
    var chosenRoute = $('select option:selected').text();
    updateLocations();
  });

});


// $(document).ready(function() {

//   // UI Controls
//   var loadRoutes = function(callback) {
//     $.ajax({
//       url: 'http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=sf-muni',
//       type: 'GET',
//       dataType: 'xml',
//       success: function(xml) {
//         var routes = [];
//         $(xml).find('route').each(function(i, route) {
//           var parsedRoute = route.getAttribute('tag');
//           routes.push(parsedRoute);
//         });
//         callback(routes);
//       }
//     });

//   };

//   var displayRoutes = function(routes) {
//     for (var i=0; i<routes.length; i++) {
//       var route = routes[i];
//       if (route === 'N') {
//         var $route = $('<option value="' + route + '"selected>' + route + '</option>');
//       } else {
//         var $route = $('<option value="' + route + '">' + route + '</option>');
//       }
//       $('select').append($route);
//     }
//   }

//   // updateLocations();
//   // loadRoutes(displayRoutes);
// });













