(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./map.js":2,"./ui.js":3}],2:[function(require,module,exports){
/**
 * Map (pseudo-class)
 */

module.exports = Map;

function Map() {
  this.vehiclesLoaded = false;
  this.mapLoaded = false;
  this.routeLoaded = false;
  this.route = 'N';
  this.lastTime = '0';
}

Map.prototype = {

  // Loads the geojson and builds the map
  init: function() {
    var map = this;
		var m_width = $('#map').width();
		var width  = 500;
		var height = 250;
		var offset = [width/1.9, height/1.3];
    var m0;

    // scale and center the initial projection
		var projection = this.projection = d3.geo.mercator()
		    .scale(160000)
		    .translate(offset)
        .center([-122.43, 37.75]);

		var path = d3.geo.path()
		    .projection(projection);

    // define drag behavior for panning the map
    var drag = d3.behavior.drag()
        .on('dragstart', function() {
          var proj = projection.translate();
          // get drag starting position
          m0 = [d3.event.sourceEvent.pageX, d3.event.sourceEvent.pageY];
        })
        .on('drag', function() {
          if (m0) {
            // calculate difference in drag coordinates
            var m1 = [d3.event.sourceEvent.pageX, d3.event.sourceEvent.pageY];
            var deltaPos = [m1[0] - m0[0] + offset[0], m1[1] - m0[1] + offset[1]];
            projection.translate(deltaPos);
          }

          path = d3.geo.path().projection(projection);
          d3.selectAll('path').attr('d', path);

          // translate the stops
          d3.selectAll('circle')
            .attr('cx', function(d) {
              return projection([d.lon, d.lat])[0];
            })
            .attr('cy', function(d) {
              return projection([d.lon, d.lat])[1];
            });

          // translate the vehicles
          d3.selectAll('image')
            .attr('x', function(d) {
              return projection([d.lon, d.lat])[0] - 5;
            })
            .attr('y', function(d) {
              return projection([d.lon, d.lat])[1] - 5;
            });
        });

    var svg = d3.select('#map').append('svg')
        .attr('preserveAspectRatio', 'xMidYMid')
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('width', m_width)
        .attr('height', m_width * height / width)
        .call(drag);

		var g = this.g = svg.append('g');

    // load the geojson map
		d3.json('maps/neighborhoods.json', function(json) {
		  g.append('g')
		    .attr('id', 'neighborhoods')
		    .selectAll('path')
		    .data(json.features)
		    .enter()
		    .append('path')
		    .attr('id', function(d) { return d.properties.neighborho; })
		    .attr('d', path);
      map.mapLoaded = true;   
		});
	},

  // empty and re-render map upon selection of new route
  resetRoute: function(route) {
    d3.selectAll('image').remove();
    d3.selectAll('circle').remove();
    this.vehiclesLoaded = false;
    this.routeLoaded = false;
    this.lastTime = '0';
    this.route = route;
    clearTimeout(this.timeoutId);
    delete this.timeoutId;
    this.drawRoute();
    this.updateLocations();
  },

  // draw the route based on the transit stops
  drawRoute: function() {
    var map = this;
    // only load routes if map is initialized
    if (!this.mapLoaded) {
      setTimeout(function() { map.drawRoute(); }, 50);
      return;
    }

    $.ajax({
      url: 'http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=sf-muni&terse&r=' + map.route,
      type: 'GET',
      dataType: 'xml',
      success: function(xml) {
        var stops = [];
        // parse xml stops data
        $(xml).find('stop').each(function(i, stop) {
          var parsedStop = {
            lat: stop.getAttribute('lat'),
            lon: stop.getAttribute('lon')
          };
          stops.push(parsedStop);
        });

        map.g.selectAll('circle')
            .data(stops)
            .enter()
            .append('circle')     
            .attr('cx', function(d) {
              return map.projection([d.lon, d.lat])[0];
            })
            .attr('cy', function(d) {
              return map.projection([d.lon, d.lat])[1];
            })
            .attr('r', 1)
            .style('fill', 'red');
        map.routeLoaded = true;
      }
    });
  },

  // load vehicle data and position on map
	updateLocations: function() {
    var map = this;
    // only load if map and routes are initialized
    if (!this.mapLoaded || !this.routeLoaded) {
      setTimeout(function() { map.updateLocations(); }, 50);
      return;
    }

    $.ajax({
      url: 'http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=sf-muni&r=' + map.route + '&t=' + map.lastTime,
      type: 'GET',
      dataType: 'xml',
      success: function(xml) {
        var vehicles = [];
        var vehiclesHash = {};
        map.lastTime = $(xml).find('lastTime').attr('time').toString();

        // parse xml vehicle data
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

        // instantiate vehicles
        if (!map.vehiclesLoaded) {
          map.g.selectAll('image')
            .data(vehicles)
            .enter()
            .append('image')
            .attr('xlink:href', '../images/bus.png')
            .attr('width', '10')
            .attr('height', '10')
            .attr('id', function(d) {
              return d.id;
            })
            .attr('x', function(d) {
              return map.projection([d.lon, d.lat])[0] - 5;
            })
            .attr('y', function(d) {
              return map.projection([d.lon, d.lat])[1] - 5;
            })
            .style('fill', 'black');

          map.vehiclesLoaded = true;
        } else {
          // transition vehicles to new position
          map.g.selectAll('image').each(function(d,i) {
            var id = d.id;
            if (vehiclesHash[id]) {
              var newLat = vehiclesHash[id].lat;
              var newLon = vehiclesHash[id].lon;
              d3.select(this).transition()
                .duration(500)
                .ease('linear')
                .attr('x', function(d) {
                  return map.projection([newLon, newLat])[0] - 5;
                })
                .attr('y', function(d) {
                  return map.projection([newLon, newLat])[1] - 5;
                });              
            }
          });
        }
      }
    });
		
    // update vehicles every 15 seconds
	  this.timeoutId = setTimeout(function() { map.updateLocations(); }, 15000);
  }
}
},{}],3:[function(require,module,exports){
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
},{}]},{},[1])