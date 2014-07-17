(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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














},{"./map.js":2,"./ui.js":3}],2:[function(require,module,exports){
module.exports = Map;

function Map() {
  this.route = 'N';
  this.vehiclesLoaded = false;
  this.lastTime = '0';
  this.g;
  this.projection;
  this.continueUpdate = true;
}

Map.prototype = {
	init: function() {
		var m_width = $('#map').width();
		var width  = 500;
		var height = 250;
		var offset = [width/2, height/1.7];

		var projection = this.projection = d3.geo.mercator()
		    .scale(160000)
		    .translate(offset);

		var center = projection.center([-122.43, 37.75]);

		var path = d3.geo.path()
		    .projection(projection);

    var drag = d3.behavior.drag()
        .on('dragstart', function() {
          var proj = projection.translate();
          m0 = [d3.event.sourceEvent.pageX, d3.event.sourceEvent.pageY];
        })
        .on('drag', function() {
          if (m0) {
            var m1 = [d3.event.sourceEvent.pageX, d3.event.sourceEvent.pageY];
            var deltaPos = [m1[0] - m0[0] + offset[0], m1[1] - m0[1] + offset[1]];
            projection.translate(deltaPos);
          }

          path = d3.geo.path().projection(projection);
          d3.selectAll("path").attr("d", path);
        });

    var svg = d3.select('#map').append('svg')
        .attr('preserveAspectRatio', 'xMidYMid')
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('width', m_width)
        .attr('height', m_width * height / width)
        .call(drag);

    // add a rectangle to see the bound of the svg
    svg.append('rect')
        .attr('class', 'background')
        .attr('width', width)
        .attr('height', height);


		var g = this.g = svg.append('g');

		d3.json('maps/neighborhoods.json', function(json) {
		  g.append('g')
		    .attr('id', 'neighborhoods')
		    .selectAll('path')
		    .data(json.features)
		    .enter()
		    .append('path')
		    .attr('id', function(d) { return d.properties.neighborho; })
		    .attr('d', path);
		});
	},
  resetRoute: function(route) {
    console.log('Setting new route: ', route);
    d3.selectAll('circle').remove();
    this.vehiclesLoaded = false;
    this.lastTime = '0';
    this.route = route;
    clearTimeout(this.timeoutId);
    delete this.timeoutId;
    this.updateLocations();
  },
	updateLocations: function() {
		var g = this.g;
		var projection = this.projection;

    console.log('Updating vehicle positions for route: ', this.route);
    var map = this;
    $.ajax({
      url: 'http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=sf-muni&r=' + map.route + '&t=' + map.lastTime,
      type: 'GET',
      dataType: 'xml',
      success: function(xml) {
        var vehicles = [];
        var vehiclesHash = {};
        map.lastTime = $(xml).find('lastTime').attr('time').toString();

        $(xml).find('vehicle').each(function(i, vehicle) {
          var parsedVehicle = {
            id: vehicle.getAttribute('id'),
            dirTag: vehicle.getAttribute('dirTag'),
            lat: vehicle.getAttribute('lat'),
            lon: vehicle.getAttribute('lon')
          }

          vehicles.push(parsedVehicle);
          vehiclesHash[parsedVehicle.id] = parsedVehicle;
        });

        if (!map.vehiclesLoaded) {
          g.selectAll('circle')
            .data(vehicles)
            .enter()
            .append('circle')
            .attr('id', function(d) {
              return d.id;
            })
            .attr('cx', function(d) {
              return projection([d.lon, d.lat])[0];
            })
            .attr('cy', function(d) {
              return projection([d.lon, d.lat])[1];
            })
            .attr('r', 3)
            .style('fill', 'black');

          map.vehiclesLoaded = true;
        } else {
          g.selectAll('circle').each(function(d,i) {
            var id = d.id;
            if (vehiclesHash[id]) {
              var newLat = vehiclesHash[id].lat;
              var newLon = vehiclesHash[id].lon;
              d3.select(this).transition()
                .attr('cx', function(d) {
                  return projection([newLon, newLat])[0];
                })
                .attr('cy', function(d) {
                  return projection([newLon, newLat])[1];
                });              
            }
          });
        }
      }
    });
		
    var map = this;
	  this.timeoutId = setTimeout(function() { map.updateLocations(); }, 4000);
  }
}








},{}],3:[function(require,module,exports){
module.exports = Ui;

function Ui() {}

Ui.prototype = {
	init: function() {
		console.log('calling init');
		this.loadRoutes(this.displayRoutes);
	},
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
},{}]},{},[1])