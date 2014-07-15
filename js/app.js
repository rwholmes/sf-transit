
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
    .attr("height", height)
    .on("click", mapClicked)
    .on("dblclick", zoomOut);

var g = svg.append("g");

d3.json("maps/neighborhoods.json", function(json) {
  g.append("g")
    .attr("id", "neighborhoods")
    .selectAll("path")
    .data(json.features)
    .enter()
    .append("path")
    .attr("id", function(d) { return d.properties.neighborho; })
    .attr("d", path)
    .on("click", mapClicked)
    .on("dblclick", zoomOut);

  // svg.selectAll("path").data(json.features).enter().append("path")
  //   .attr("d", path)
  //   .style("fill", "red")
  //   .style("stroke-width", "1")
  //   .style("stroke", "black")
  //   .on("click", mapClicked);
});

var zoom = function(xyz) {
  console.log('zoomed ', xyz);
  zoomed = xyz;
  g.transition()
    .duration(750)
    .attr("transform", "translate(" + projection.translate() + ")scale(" + xyz[2] + ")translate(-" + xyz[0] + ",-" + xyz[1] + ")"); 
}

var getXyz = function(d) {
  var bounds = path.bounds(d);
  var w_scale = (bounds[1][0] - bounds[0][0]) / width;
  var h_scale = (bounds[1][1] - bounds[0][1]) / height;
  var z = .96 / Math.max(w_scale, h_scale);
  var x = (bounds[1][0] + bounds[0][0]) / 2;
  var y = (bounds[1][1] + bounds[0][1]) / 2 + (height / z / 6);
  return [x, y, z];
}

var mapClicked = function(d) {
  console.log('map clicked ', d.properties.neighborho);

  var xyz = getXyz(d);
  zoom(xyz);
};

var zoomOut = function() {
  var outX = zoomed[0];
  var outY = -zoomed[1];

  g.transition()
  .duration(750)
  .attr("transform", "translate(" + projection.translate() + ")scale(1)translate(-" + outX + ",-" + outY + ")");
}


// / CODE FOR STOPS

// $(document).ready(function() {
//   $.ajax({
//     url: 'http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=sf-muni&r=N',
//     type: 'GET',
//     dataType: 'xml',
//     success: function(xml) {
//       var stops = [];
//       var $route = $(xml).find('route')[0];
//       for (var j = 0; j < $route.childNodes.length; j++) {
//         var stop = $route.childNodes[j];
//         if (stop.tagName == 'stop') {
//           var parsedStop = {
//             tag: stop.getAttribute('tag'),
//             title: stop.getAttribute('title'),
//             lat: stop.getAttribute('lat'),
//             lon: stop.getAttribute('lon')
//           };
//           stops.push(parsedStop);
//         }
//       }
        

//       g.selectAll("circle")
//         .data(stops)
//         .enter()
//         .append("circle")
//         .attr("cx", function(d) {
//           return projection([d.lon, d.lat])[0];
//         })
//         .attr("cy", function(d) {
//           return projection([d.lon, d.lat])[1];
//         })
//         .attr("r", 3)
//         .style("fill", "black");
//     }
//   });
// });


// CODE FOR VEHICLE POSITIONS

$(document).ready(function() {
  var initialized = false;
  var lastTime = '0'; 

  var updateLocations = function() {
    console.log('Getting vehicle locations');
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













