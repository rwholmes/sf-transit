/**
 *
 * SF Transit | Realtime visualization of San Francisco transit vehicles
 * ********************************
 * by: Robert Holmes | robertwholmes.com
 * 2014-07-17
 *
 */

var Map = require('./map.js');
var Ui = require('./ui.js');

// User Interface
$(document).ready(function() {
  var map = new Map();
  var ui = new Ui();

  // Render the map
  map.init();

  // Draw the bus route
  map.drawRoute();

  // Display current vehicle locations
  map.updateLocations();

  // Load route data into the ui
  ui.init();

  // Listeners
  $('button').on('click', function() {
    var chosenRoute = $('select option:selected').text();
    map.resetRoute(chosenRoute);
  });

});













