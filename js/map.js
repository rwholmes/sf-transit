module.exports = Map;

function Map() {
  this.vehiclesLoaded = false;
  this.mapLoaded = false;
  this.routeLoaded = false;
  this.route = 'N';
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
          d3.selectAll('path').attr('d', path);
          d3.selectAll('circle')
            .attr('cx', function(d) {
              return projection([d.lon, d.lat])[0];
            })
            .attr('cy', function(d) {
              return projection([d.lon, d.lat])[1];
            });
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

    // add a rectangle to see the bound of the svg
    svg.append('rect')
        .attr('class', 'background')
        .attr('width', width)
        .attr('height', height);


		var g = this.g = svg.append('g');

    var map = this;
		d3.json('maps/neighborhoods.json', function(json) {
		  g.append('g')
		    .attr('id', 'neighborhoods')
		    .selectAll('path')
		    .data(json.features)
		    .enter()
		    .append('path')
		    .attr('id', function(d) { return d.properties.neighborho; })
		    .attr('d', path);
      console.log('map loaded');
      map.mapLoaded = true;   
		});
	},
  resetRoute: function(route) {
    console.log('Setting new route: ', route);
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
  drawRoute: function() {
    var map = this;
    if (!this.mapLoaded) {
      setTimeout(function() { map.drawRoute(); }, 50);
      return;
    }
    var g = this.g;
    var projection = this.projection;
    $.ajax({
      url: 'http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=sf-muni&terse&r=' + map.route,
      type: 'GET',
      dataType: 'xml',
      success: function(xml) {
        var stops = [];
        $(xml).find('stop').each(function(i, stop) {
          var parsedStop = {
            lat: stop.getAttribute('lat'),
            lon: stop.getAttribute('lon')
          };
          stops.push(parsedStop);
        });

        g.selectAll('circle')
            .data(stops)
            .enter()
            .append('circle')     
            .attr('cx', function(d) {
              return projection([d.lon, d.lat])[0];
            })
            .attr('cy', function(d) {
              return projection([d.lon, d.lat])[1];
            })
            .attr('r', 1)
            .style('fill', 'red');
        console.log('route loaded');
        map.routeLoaded = true;
      }
    });
  },
	updateLocations: function() {
    var map = this;
    if (!this.mapLoaded || !this.routeLoaded) {
      setTimeout(function() { map.updateLocations(); }, 50);
      return;
    }
    var g = this.g;
    var projection = this.projection;

    console.log('Updating vehicle positions for route: ', this.route);
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
          g.selectAll('image')
            .data(vehicles)
            .enter()
            .append('image')
            .attr("xlink:href", "../images/bus.png")
            .attr("width", "10")
            .attr("height", "10")
            .attr('id', function(d) {
              return d.id;
            })
            .attr('x', function(d) {
              return projection([d.lon, d.lat])[0] - 5;
            })
            .attr('y', function(d) {
              return projection([d.lon, d.lat])[1] - 5;
            })
            // .attr('r', 3)
            .style('fill', 'black');

          console.log('vehiclesLoaded');
          map.vehiclesLoaded = true;
        } else {
          g.selectAll('image').each(function(d,i) {
            var id = d.id;
            if (vehiclesHash[id]) {
              var newLat = vehiclesHash[id].lat;
              var newLon = vehiclesHash[id].lon;
              d3.select(this).transition()
                .duration(500)
                .ease('linear')
                .attr('x', function(d) {
                  return projection([newLon, newLat])[0] - 5;
                })
                .attr('y', function(d) {
                  return projection([newLon, newLat])[1] - 5;
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







