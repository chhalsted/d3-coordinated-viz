//Christian Halsted 2019

//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ['Single_Family_Home_Permits_2010_to_2017'
                ,'Total_Value_of_All_Homes_Built_2010_to_2017'
                ,'Average_Home_Value'
                ,'Housing_Units_2010'
                ,'Housing_Units_2017'
                ,'Housing_Units_Change'
                ,'Housing_Units_Percent_Change'
                ,'Population_2010'
                ,'Population_2017'
                ,'Population_Change'
                ,'Population_Change_Percent'
                ,'Miles_to_Coast'];
var expressed = attrArray[2]; //initial attribute
//chart frame dimensions
var chartWidth = 300; //window.innerWidth,
  chartHeight = 400,
  leftPadding = 40,
  rightPadding = 2,
  topBottomPadding = 5,
  chartInnerWidth = chartWidth - leftPadding - rightPadding,
  chartInnerHeight = chartHeight - topBottomPadding * 2,
  translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
var chart, yAxis, axis;

// function getMaxY(test){
//   console.log(expressed);
//   if (test==1) {
//     return 30
//   } else {
//     return 100
//   }
// }
// //create a scale to size bars proportionally to frame and for axis
// var yScale = d3.scaleLinear()
//   .range([chartInnerHeight, 0])
//   .domain([0, getMaxY(2)]);
var yScale;

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
  //map frame dimensions
  var width = 300, //window.innerWidth * 0.4,
      height = 400;

  //create new svg container for the map
  var map = d3.select("#divMap")
      .append("svg")
      .attr("class", "map")
      .attr("width", width)
      .attr("height", height)
      .call(responsivefy);
      // .attr("viewBox", `0 0 300 600`);

  //create Albers equal area conic projection centered on Searsmont
  //http://uwcart.github.io/d3-projection-demo/
   var projection = d3.geoAlbers()
       .center([0, 44.36])
       .rotate([69.15, 0, 0])
       .parallels([45, 90])
       .scale(22500)
       .translate([width / 2, height / 2]);

  var path = d3.geoPath()
    .projection(projection);

  //use queue to parallelize asynchronous data loading
  d3.queue()
    .defer(d3.csv, "data/searsmont_towns_10miles_data.csv") //load attributes from csv
    .defer(d3.json, "data/counties.topojson") //load background spatial data
    .defer(d3.json, "data/searsmont_towns_10miles.topojson") //load choropleth spatial data
    .await(callback);

  function callback(error, csvData, counties, towns){
    //place graticule background on the map
    setGraticule(map, path);

    // console.log(error);
    // console.log(csvData);

    // console.log(counties);
    var maineCounties = topojson.feature(counties, counties.objects.counties)
    // console.log(maineCounties);

    //console.log(towns);
    var maineTowns = topojson.feature(towns, towns.objects.searsmont_towns_10miles).features
    // console.log(maineTowns);

    //add Maine Counties to map
    var counties = map.append("path")
      .datum(maineCounties)
      .attr("class", "counties")
      .attr("d", path);

    maineTowns = joinData(maineTowns, csvData);

    //create the color scale
    var colorScale = makeColorScale(csvData);

    //add enumeration units to the map
    setEnumerationUnits(maineTowns, map, path, colorScale);

    //place graticule lines on the top of the map
    setGraticuleLines(map, path);

    setChart(csvData, colorScale);

    createDropdown(csvData);
  };  //end of callback
};  //end of setMap

function createGraticuleGenerator(map, path){
  //create graticule generator
  var graticule = d3.geoGraticule()
    .step([.5, .5])
  return graticule;
};

function setGraticule(map, path){
  var graticule = createGraticuleGenerator(map, path);
  //create graticule background
  var gratBackground = map.append("path")
    .datum(graticule.outline()) //bind graticule background
    .attr("class", "gratBackground") //assign class for styling
    .attr("d", path) //project graticule
};

function setGraticuleLines(map, path){
  var graticule = createGraticuleGenerator(map, path);
  //create graticule lines
  var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
    .data(graticule.lines()) //bind graticule lines to each element to be created
    .enter() //create an element for each datum
    .append("path") //append each element to the svg as a path element
    .attr("class", "gratLines") //assign class for styling
    .attr("d", path); //project graticule lines
};

function joinData(maineTowns, csvData){
    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i < csvData.length; i++){
      var csvRegion = csvData[i]; //the current region
      var csvKey = csvRegion.geocode; //the CSV primary key

      //loop through geojson regions to find correct region
      for (var a=0; a < maineTowns.length; a++){
        var geojsonProps = maineTowns[a].properties; //the current region geojson properties
        var geojsonKey = geojsonProps.geocode; //the geojson primary key
        //where primary keys match, transfer csv data to geojson properties object
        if (geojsonKey == csvKey){
          //assign all attributes and values
          attrArray.forEach(function(attr){
            var val = parseFloat(csvRegion[attr]); //get csv attribute value
            geojsonProps[attr] = val; //assign attribute and value to geojson properties
          });
        };
      };
    };
    // console.log(maineTowns);
    return maineTowns;
};

function setEnumerationUnits(maineTowns, map, path, colorScale){
  //add Searsmont adjacent towns to map
  var regions = map.selectAll(".regions")
    .data(maineTowns)
    .enter()
    .append("path")
    .attr("class", function(d){
      return "regions " + d.properties.geocode;
    })
    .attr("d", path)
    .style("fill", function(d){
      //return colorScale(d.properties[expressed]);
      return choropleth(d.properties, colorScale);
    })
    .on("mouseover", function(d){
      highlight(d.properties);
    })
    .on("mouseout", function(d){
      dehighlight(d.properties);
    })
    .on("mousemove", moveLabel);
  var desc = regions.append("desc")
    .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#ffffcc",
        "#c2e699",
        "#78c679",
        "#31a354",
        "#006837"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i < data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };
    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);
    return colorScale;
};

//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //create a second svg element to hold the bar chart
    chart = d3.select("#divGraph")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart")
        .call(responsivefy);

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.geocode;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
        updateChart(bars, csvData, colorScale);

    // //create a text element for the chart title
    // var chartTitle = chart.append("text")
    //     .attr("x", 40)
    //     .attr("y", 40)
    //     .attr("class", "chartTitle")
    //     .text("Value of " + expressed + " in each town");

    // //create vertical axis generator
    // var yAxis = d3.axisLeft()
    //     .scale(yScale)
        // .orient("left");

    // //place axis
    // var axis = chart.append("g")
    //     .attr("class", "axis")
    //     .attr("transform", translate)
    //     .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
};  //end of setChart

//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
  //add select element
  var dropdown = d3.select("#divDropdown")
      .append("select")
      .attr("class", "dropdown")
      .attr("id", "selStat")
      .on("change", function(){
            changeAttribute(this.value, csvData)
      });

  //add initial option
  var titleOption = dropdown.append("option")
      .attr("class", "titleOption")
      .attr("disabled", "true")
      .text("");

  //add attribute name options
  var attrOptions = dropdown.selectAll("attrOptions")
      .data(attrArray)
      .enter()
      .append("option")
      .attr("value", function(d){ return d })
      .text(function(d){ return d.replace(/_/g," ") });

  $("#selStat").val(expressed);
};

//dropdown change listener handler
function changeAttribute(attribute, csvData){
  //change the expressed attribute
  expressed = attribute;

  //recreate the color scale
  var colorScale = makeColorScale(csvData);

  //recolor enumeration units
  var regions = d3.selectAll(".regions")
    .transition()
    .duration(1000)
    .style("fill", function(d){
        return choropleth(d.properties, colorScale)
    });
  //re-sort, resize, and recolor bars
  var bars = d3.selectAll(".bar")
    //re-sort bars
    .sort(function(a, b){
        return b[expressed] - a[expressed];
    })
    .transition() //add animation
    .delay(function(d, i){
        return i * 20
    })
    .duration(500);
    updateChart(bars, csvData, colorScale);
};

//function to position, size, and color bars in chart
function updateChart(bars, csvData, colorScale){
  //figure out max for y axis
  var yMax = 0, yMin = 0;
  for (var i = 0; i < csvData.length; i++){
    if (parseFloat(csvData[i][expressed]) > yMax) {
      yMax = parseFloat(csvData[i][expressed]);
    }
    if (parseFloat(csvData[i][expressed]) < yMin) {
      yMin = parseFloat(csvData[i][expressed])
    }
  }

  //create a scale to size bars proportionally to frame and for axis
  yScale = d3.scaleLinear()
    .range([chartInnerHeight, 0])
    // .domain([0, yMax*1.1]);
    .domain([yMin, yMax*1.1]);
  //console.log(chartInnerHeight);
  // console.log(yMin, ' - ', yMax);
  yZeroXAxis = chartInnerHeight - ((chartInnerHeight * Math.abs(yMin)) / (Math.abs(yMin) + (yMax * 1.1)));
  // console.log('yZeroXAxis', yZeroXAxis);

  //create vertical axis generator
  $(".axis").remove();
  yAxis = d3.axisLeft()
      .scale(yScale)
  //place axis
  axis = chart.append("g")
      .attr("class", "axis")
      // .attr("id", "axis")
      .attr("transform", translate)
      .call(yAxis);

  //position bars
  var n = csvData.length;
  bars.attr("x", function(d, i){
    return i * (chartInnerWidth / n) + leftPadding;
    })
    //size/resize bars
    .attr("height", function(d, i){
      //console.log(d[expressed], ':', yScale(parseFloat(d[expressed])));
      //return chartInnerHeight - yScale(parseFloat(d[expressed]));
      var h=0;
      if (d[expressed] > 0) {
        h = yZeroXAxis - yScale(parseFloat(d[expressed]));
      } else if (d[expressed] < 0) {
        h = yScale(parseFloat(d[expressed])) - yZeroXAxis;
      }
      return h
    })
    .attr("y", function(d, i){
      //console.log(d[expressed], '::', yScale(parseFloat(d[expressed])));
      // return yScale(parseFloat(d[expressed])) + topBottomPadding;
      var y = 390;
      if (d[expressed] != '') {
        if (d[expressed] >= 0) {
          y = yScale(parseFloat(d[expressed]));
        } else if (d[expressed] < 0) {
          y = yZeroXAxis;
        }
      }
      //console.log('set y: ', y);
      return y + topBottomPadding
    })
    //color/recolor bars
    .style("fill", function(d){
        return choropleth(d, colorScale);
    });

  var chartTitle = d3.select(".chartTitle")
    .text("Value of " + expressed + " in each town");
};

//function to highlight enumeration units and bars
function highlight(props){
  //change stroke
  var selected = d3.selectAll("." + props.geocode)
    .style("stroke", "blue")
    .style("stroke-width", "2");
  setLabel(props);
};

//function to reset the element style on mouseout
function dehighlight(props){
   var selected = d3.selectAll("." + props.geocode)
       .style("stroke", function(){
           return getStyle(this, "stroke")
       })
       .style("stroke-width", function(){
           return getStyle(this, "stroke-width")
       });

   function getStyle(element, styleName){
       var styleText = d3.select(element)
           .select("desc")
           .text();
       var styleObject = JSON.parse(styleText);
       return styleObject[styleName];
   };
   d3.select(".infolabel")
    .remove();
};

//function to create dynamic label (tool tip)
function setLabel(props){
    //label content
    var labelAttribute = "<h4>" + props[expressed] +
        "</h4><b>" + expressed.replace(/_/g," ") + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.geocode + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.town);
};

//function to move info label with mouse
function moveLabel(){
  //get width of label
  var labelWidth = d3.select(".infolabel")
      .node()
      .getBoundingClientRect()
      .width;

  //use coordinates of mousemove event to set label coordinates
  var x1 = d3.event.clientX + 10,
      y1 = d3.event.clientY - 75,
      x2 = d3.event.clientX - labelWidth - 10,
      y2 = d3.event.clientY + 25;

  //horizontal label coordinate, testing for overflow
  var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
  //vertical label coordinate, testing for overflow
  var y = d3.event.clientY < 75 ? y2 : y1;

  d3.select(".infolabel")
      .style("left", x + "px")
      .style("top", y + "px");
};

})(); //last line of main.js - self-executing anonymous function
