module.exports = Map;

var route = 'N';
var initialized = false;
var lastTime = '0';

function Map() {}

Map.prototype = {
	init: function() {
		var m_width = $('#map').width()*.5;
		var width  = 500;
		var height = 500;
		var offset = [width/2, height/1.7];

		var projection = d3.geo.mercator()
		    .scale(160000)
		    .translate(offset);

		var center = projection.center([-122.43, 37.75]);

		var path = d3.geo.path()
		    .projection(projection);

    // ADDED DRAG CODE
    var drag = d3.behavior.drag()
        // .origin(function(d) { return d; })
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

    function dragstarted(d) {
      console.log('drag start');
      d3.event.sourceEvent.stopPropagation();
      d3.select(this).classed("dragging", true);
    }

    function dragged(d) {
      console.log('dragging');
      d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }

    function dragended(d) {
      console.log('drag end');
      d3.select(this).classed("dragging", false);
    }
    // END DRAG CODE

    this.svg = d3.select('#map').append('svg')
        .attr('preserveAspectRatio', 'xMidYMid')
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('width', m_width)
        .attr('height', m_width * height / width)
        .call(drag);

    // add a rectangle to see the bound of the svg
    this.svg.append('rect')
        .attr('class', 'background')
        .attr('width', width)
        .attr('height', height);


		this.g = this.svg.append('g');
		var g = this.g;
		var path = path;

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

	updateLocations: function() {
		var g = this.g;
		var projection = projection;

    console.log('Updating vehicle positions for route ', route);
    $.ajax({
      url: 'http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=sf-muni&r=' + route + '&t=' + lastTime,
      type: 'GET',
      dataType: 'xml',
      success: function(xml) {
        var vehicles = [];
        var vehiclesHash = {};
        lastTime = $(xml).find('lastTime').attr('time').toString();

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

        if (!initialized) {
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


          initialized = true;
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
		setTimeout(function() { map.updateLocations(); }, 15000);
  }
}







