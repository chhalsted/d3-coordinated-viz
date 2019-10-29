//Christian Halsted 2019

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
  //use queue to parallelize asynchronous data loading
  d3.queue()
    .defer(d3.csv, "data/searsmont_towns_10miles_data.csv") //load attributes from csv
    .defer(d3.json, "data/counties.topojson") //load background spatial data
    .defer(d3.json, "data/searsmont_towns_10miles.topojson") //load choropleth spatial data
    .await(callback);
  function callback(error, csvData, counties, towns){
      console.log(error);
      console.log(csvData);
      console.log(towns);
      var maineTowns = topojson.feature(towns, towns.objects.searsmont_towns_10miles)
      console.log(maineTowns);
      console.log(counties);
      var maineCounties = topojson.feature(counties, counties.objects.counties)
      console.log(maineCounties);
  };
};
