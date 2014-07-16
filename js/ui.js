module.exports = Ui;

function Ui() {}

Ui.prototype = {
	init: function() {
		console.log('calling init');
		this.loadRoutes(this.displayRoutes);
	},
	loadRoutes: function(callback) {
		console.log('calling loadRoutes');
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
  displayRoutes: function(routes) {
  	console.log('calling displayRoutes');
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