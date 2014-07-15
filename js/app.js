
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

var svg = d3.select('#map').append('svg')
    .attr('preserveAspectRatio', 'xMidYMid')
    .attr('viewBox', '0 0 ' + width + ' ' + height)
    .attr('width', m_width)
    .attr('height', m_width * height / width);

// add a rectangle to see the bound of the svg
svg.append('rect')
    .attr('class', 'background')
    .attr('width', width)
    .attr('height', height);

var g = svg.append('g');

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

// d3.json('maps/streets.json', function(json) {
//   g.append('g')
//     .attr('id', 'streets')
//     .selectAll('path')
//     .data(json.features)
//     .enter()
//     .append('path')
//     .attr('d', path);
// });


$(document).ready(function() {
  var route = 'N';
  var initialized = false;
  var lastTime = '0'; 

  var updateLocations = function() {
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

    setTimeout(function() {
      updateLocations();
    }, 5000);
  };

  // UI Controls
  var loadRoutes = function(callback) {
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

  };

  var displayRoutes = function(routes) {
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

  $('button').on('click', function() {
    var chosenRoute = $('select option:selected').text();
    updateLocations();
  });

  updateLocations();
  loadRoutes(displayRoutes);
});













