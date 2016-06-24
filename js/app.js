var bApp = angular.module('bApp', []);

bApp.controller('ShowController', function ShowController($scope, $http) {
    $http.get('/data/broadway.json').then(function(response) {
        $scope.shows = response.data;
    });
});

bApp.controller('ProjectController', function ProjectController($scope, $http) {
    $http.get('/data/projects.json').then(function(response) {
        $scope.projects = response.data;
    });
});

bApp.controller('SkillsController', function SkillsController($scope, $http) {
    $http.get('/data/courses.json').then(function(response) {
        $scope.courses = response.data;
    });

    // setting defaults
    $scope.search = {
        start_time: new Date("2014-09-04"),
        end_time: new Date("2016-06-22"),
        companies: {
            treehouse: true,
            codeschool: true,
            codecademy: true,
            lynda: true,
            smartly: true,
        }
    };

    // convert raw input into trimmed and split array of search terms
    $scope.update_search_terms = function() {
        $scope.search.terms = $scope.raw_search.toLowerCase().trim().split(" ");
        console.log($scope.search);
    };

    // when 'check_all' is changed
    $scope.update_inputs = function() {
        if ($scope.check_all) {
            $scope.search.companies.treehouse = true;
            $scope.search.companies.codeschool = true;
            $scope.search.companies.codecademy = true;
            $scope.search.companies.lynda = true;
            $scope.search.companies.smartly = true;
        }
    };
    $scope.update_inputs();

    // when an individual company checkbox is changed, check to see if check_all should be updated
    $scope.update_check_all = function(model) {
        if ($scope.search.companies.treehouse && 
            $scope.search.companies.codeschool && 
            $scope.search.companies.codecademy && 
            $scope.search.companies.lynda && 
            $scope.search.companies.smartly) {
            
            $scope.check_all = true;
        } else {
            $scope.check_all = false;
        }
    };
    $scope.update_check_all();
});


// chart stuff

var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

/* 
 * value accessor - returns the value to encode for a given data object.
 * scale - maps value to a visual display encoding, such as a pixel position.
 * map function - maps from data value to display value
 * axis - sets up axis
 */ 

// setup x 
var xValue = function(d) { return d.Calories;}, // data -> value
    xScale = d3.scale.linear().range([0, width]), // value -> display
    xMap = function(d) { return xScale(xValue(d));}, // data -> display
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

// setup y
var yValue = function(d) { return d["Protein (g)"];}, // data -> value
    yScale = d3.scale.linear().range([height, 0]), // value -> display
    yMap = function(d) { return yScale(yValue(d));}, // data -> display
    yAxis = d3.svg.axis().scale(yScale).orient("left");

// setup fill color
var cValue = function(d) { return d.Manufacturer;},
    color = d3.scale.category10();

// add the graph canvas to the body of the webpage
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add the tooltip area to the webpage
var tooltip = d3.select("#chart").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// load data
d3.csv("data/cereal.csv", function(error, data) {

  // change string (from CSV) into number format
  data.forEach(function(d) {
    // console.log(d);
    d.Calories = +d.Calories;
    d["Protein (g)"] = +d["Protein (g)"];
      console.log(d);
  });

  // don't want dots overlapping axis, so add in buffer to data domain
  xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
  yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);

  // x-axis
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("Calories");

  // y-axis
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Protein (g)");

  // draw dots
  svg.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", xMap)
      .attr("cy", yMap)
      .style("fill", function(d) { return color(cValue(d));}) 
      .on("mouseover", function(d) {
          tooltip.transition()
               .duration(200)
               .style("opacity", .9);
          tooltip.html(d["Cereal Name"] + "<br/> (" + xValue(d) 
            + ", " + yValue(d) + ")")
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          tooltip.transition()
               .duration(500)
               .style("opacity", 0);
      });

  // draw legend
  var legend = svg.selectAll(".legend")
      .data(color.domain())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  // draw legend colored rectangles
  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

  // draw legend text
  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d;})
});