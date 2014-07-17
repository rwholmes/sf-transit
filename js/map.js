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







