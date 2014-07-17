/** SF Transit | by Robert Holmes **/

var Map = require('./map.js');
var Ui = require('./ui.js');

// User Interface
$(document).ready(function() {
  var map = new Map();
  var ui = new Ui();
  map.init();
  map.updateLocations();
  ui.init();

  // Listeners
  $('button').on('click', function() {
    var chosenRoute = $('select option:selected').text();
    // map.continueUpdate = false;
    // map.updateLocations(chosenRoute);
    map.resetRoute(chosenRoute);
  });

});













