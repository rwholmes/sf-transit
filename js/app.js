
var m_width = $('#map').width();
var width  = 938;
var height = 500;
var offset = [width/2, height/1.7];
var zoomed = 0;

var projection = d3.geo.mercator()
    .scale(160000)
    .center([-122.43, 37.75])
    .translate(offset);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#map").append("svg")
    .attr("preserveAspectRatio", "xMidYMid")
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("width", m_width)
    .attr("height", m_width * height / width);

// add a rectangle to see the bound of the svg
svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g");

d3.json("maps/neighborhoods.json", function(json) {
  g.append("g")
    .attr("id", "neighborhoods")
    .selectAll("path")
    .data(json.features)
    .enter()
    .append("path")
    .attr("id", function(d) { return d.properties.neighborho; })
    .attr("d", path);

  // svg.selectAll("path").data(json.features).enter().append("path")
  //   .attr("d", path)
  //   .style("fill", "red")
  //   .style("stroke-width", "1")
  //   .style("stroke", "black")
  //   .on("click", mapClicked);
});


// CODE FOR VEHICLE POSITIONS

$(document).ready(function() {
  var initialized = false;
  var lastTime = '0'; 

  var updateLocations = function() {
    $.ajax({
      url: 'http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=sf-muni&r=N&t=' + lastTime,
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
          console.log('updating');
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
  };

  updateLocations();
  setInterval(function() { updateLocations(); }, 10000);
});













