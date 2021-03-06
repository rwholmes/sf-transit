/**
 * Ui (pseudo-class)
 */

module.exports = Ui;

function Ui() {}

Ui.prototype = {
	init: function() {
		this.loadRoutes(this.displayRoutes);
	},

  // download the route options
	loadRoutes: function(callback) {
    $.ajax({
      url: 'http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=sf-muni',
      type: 'GET',
      dataType: 'xml',
      success: function(xml) {
        var routes = [];
        $(xml).find('route').each(function(i, route) {
          var parsedRoute = route.getAttribute('tag');
          routes.push(parsedRoute);
        });
        callback(routes);
      }
    });

  },

  // load routes into select
  displayRoutes: function(routes) {
    for (var i=0; i<routes.length; i++) {
      var route = routes[i];
      if (route === 'N') {
        var $route = $('<option value="' + route + '"selected>' + route + '</option>');
      } else {
        var $route = $('<option value="' + route + '">' + route + '</option>');
      }
      $('select').append($route);
    }
  }
}