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