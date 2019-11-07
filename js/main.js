//Christian Halsted 2019

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
  //map frame dimensions
  var width = 960,
      height = 460;

  //create new svg container for the map
  var map = d3.select("body")
      .append("svg")
      .attr("class", "map")
      .attr("width", width)
      .attr("height", height);

  //create Albers equal area conic projection centered on Searsmont
  //http://uwcart.github.io/d3-projection-demo/
   var projection = d3.geoAlbers()
       .center([0, 44.36])
       .rotate([69.15, 0, 0])
       .parallels([45, 90])
       .scale(25000)
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
    //create graticule generator
    var graticule = d3.geoGraticule()
      .step([.5, .5])

    //create graticule background
    var gratBackground = map.append("path")
      .datum(graticule.outline()) //bind graticule background
      .attr("class", "gratBackground") //assign class for styling
      .attr("d", path) //project graticule

    //create graticule lines
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
      .data(graticule.lines()) //bind graticule lines to each element to be created
      .enter() //create an element for each datum
      .append("path") //append each element to the svg as a path element
      .attr("class", "gratLines") //assign class for styling
      .attr("d", path); //project graticule lines

    console.log(error);
    console.log(csvData);

    console.log(counties);
    var maineCounties = topojson.feature(counties, counties.objects.counties)
    console.log(maineCounties);

    console.log(towns);
    var maineTowns = topojson.feature(towns, towns.objects.searsmont_towns_10miles).features
    console.log(maineTowns);

    //add Maine Counties to map
    var countries = map.append("path")
      .datum(maineCounties)
      .attr("class", "countries")
      .attr("d", path);

    //add Searsmont adjacent towns to map
    var regions = map.selectAll(".regions")
      .data(maineTowns)
      .enter()
      .append("path")
      .attr("class", function(d){
          return "regions " + d.properties.town;
      })
      .attr("d", path);


  };
};
