
var m_width = $('#map').width();
var width  = 938;
var height = 500;
var offset = [width/2, height/1.7];

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
    .on("click", mapClicked);

var g = svg.append("g");

d3.json("maps/neighborhoods.json", function(json) {
  console.log('json ', json);

  g.append("g")
    .attr("id", "neighborhoods")
    .selectAll("path")
    .data(json.features)
    .enter()
    .append("path")
    .attr("id", function(d) { return d.properties.neighborho; })
    .attr("d", path)
    .on("click", mapClicked);

  // svg.selectAll("path").data(json.features).enter().append("path")
  //   .attr("d", path)
  //   .style("fill", "red")
  //   .style("stroke-width", "1")
  //   .style("stroke", "black")
  //   .on("click", mapClicked);
});

var zoom = function(xyz) {
  console.log('zooming');
  svg.transition()
    .duration(750)
    .attr("transform", "translate(" + projection.translate() + ")scale(" + xyz[2] + ")translate(-" + xyz[0] + ",-" + xyz[1] + ")")
    .style("stroke-width", 1.0 / xyz[2] + "px");
};

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






