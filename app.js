(async() =>{

const dummyData = await d3.csv("./data/diets.csv");

var mapData = await d3.json("./data/countries.geojson");

const battleData = await d3.csv("./data/battles.csv");

const disasterData = await d3.csv("./data/disaster.csv");

//continent data
const africa = await d3.csv("./data/africa.csv");
const asia = await d3.csv("./data/asia.csv");
const europe = await d3.csv("./data/europe.csv");
const northamerica = await d3.csv("./data/northamerica.csv");
const southamerica = await d3.csv("./data/southamerica.csv");
const oceania = await d3.csv("./data/oceania.csv");

//graph size
var margin = {top: 10, right: 10, bottom: 10, left: 10},
width = 500 - margin.left - margin.right,
height = 500 - margin.top - margin.bottom,
innerRadius = 100,
outerRadius = Math.min(width, height) / 2;

const chartWidth =1100 ;
const chartHeight = 500 - margin.top - margin.bottom;


//axis for barchart
const x = d3.scaleBand().rangeRound([0, chartWidth]).padding(0.5);
const y = d3.scaleLinear().range([chartHeight, 0]);

const chartContainer = d3.select('svg')
    .attr('width', chartWidth)
    .attr('height', chartHeight + margin.top + margin.bottom);

x.domain(dummyData.map(d => d.Country));
y.domain([0, d3.max(dummyData, (d) => d.Healthy) + 10]);

//add axis to bar chart
const chart = chartContainer.append('g');

    
    

            let selectedData = dummyData;

//render barchart 
function renderChart(){

    var div = d3.select("body").append("div")
     .attr("class", "tooltip")
     .style("opacity", 0);

    chart
        .selectAll('.bar')
        .data(selectedData, data => data.id)
        .enter()
        .append('rect')
        .classed('bar', true)
        .attr('width', x.bandwidth())
        .attr('height', data => { 
            return (y(data.Calories) - y(data.Healthy))})
        .attr('x', data =>x(data.Country))
        .attr('y', data =>y(data.Healthy))
        
        //tooltip
        .on('mouseover', function(d){
            console.log(d)
            div.transition()
            .duration(10)
            .style("opacity", 1);
            div.html(d.target.__data__.Country+  "<br>" +"Calorically Sufficient Cost: " +d.target.__data__.Calories + "<br>" +"Healthy Diet Cost: "+d.target.__data__.Healthy)
               .style("left", (d.pageX + 10) + "px")
               .style("top", (d.pageY - 15) + "px");

        });

    chart.selectAll('.bar').data(selectedData, data => data.id).exit().remove();

    /*
    chart.selectAll('.label')
        .data(selectedData, data => data.id)
        .enter()
        .append('text')
        .text(data => data.Calories)
        .attr('x', data => x(data.Country) + x.bandwidth()/2)
        .attr('y', data => y(data.Calories) - 20)
        .attr('text-anchor', 'middle')
        .classed('label', true);

    chart.selectAll('.label').data(selectedData, data => data.id).exit().remove();
    */
}

renderChart();

//remove items based on select bar chart
let unselectedIds = [];
 
var items = d3.group(dummyData, d=>d.Continent)

const listItems = d3
    .select('#data')
    .select('ul')
    .selectAll('li')
    .data(items)
    .enter()
    .append('li');

listItems
    .append('span')
    .text((data) => 
    data[0]);

    listItems.append('input')
        .attr('type', 'checkbox')
        .attr('checked', true)
        .attr('id', data => data[0])
        .on('change', (data) => {
            console.log(data)
            if (unselectedIds.indexOf(event.target.id) === -1){
                unselectedIds.push(event.target.id);
            }else{
                unselectedIds = unselectedIds.filter((id) => id !== event.target.id);
            }
            selectedData = dummyData.filter(
                (d) => unselectedIds.indexOf(d.Continent) === -1
                );
               
            renderChart();
        });


    //map visualization
     
        var map = L.map('map').setView([41.7, 1.6], 2);

        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoiYW1lbGlhbm9lbGxlIiwiYSI6ImNsMXh1NGk4czAwNmUzYnBqN2k3eWgxZWUifQ.FCVHhAy7itARAUElTWZNmw'
    }).addTo(map);
    
    L.geoJSON(mapData).addTo(map);
    
    //chloropleth
    function getColor(d) {
        return d > 75 ? '#800026' :
               d > 50  ? '#BD0026' :
               d > 30  ? '#E31A1C' :
               d > 20  ? '#FC4E2A' :
               d > 10   ? '#FD8D3C' :
               d > 5   ? '#FEB24C' :
               d > 1   ? '#FED976' :
                          '#FFEDA0';
    }
    
    function style(feature) {
        return {
            fillColor: getColor(feature.properties.hungerIndex),
            weight: 2,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7
        };
    }

    L.geoJson(mapData, {style: style}).addTo(map);

    //markers

    //battle marker
    var battleIcon = L.icon({
        iconUrl: '/img/marker.png',
        iconSize: [20, 20],
        iconAnchor: [10,10],
    });

    
    var layerGroup = L.layerGroup();
    var disasterLayer = L.layerGroup();

    var b = 0;
    document.getElementById("battles").addEventListener("click", function(){
        if(b == 0){
            layerGroup.clearLayers();
            b=1;

        }else if(b == 1){
            displayBattles();
            b=0;
        }
    });

    function displayBattles(){
        for(var i = 0; i<battleData.length; i++){
            var battleMarkers = L.marker([battleData[i].latitude, battleData[i].longitude], {icon: battleIcon});
            layerGroup.addLayer(battleMarkers)
            
        }
        map.addLayer(layerGroup);
    }

    var d =0;
    document.getElementById("disasters").addEventListener("click", function(){
        if(d == 0){
            disasterLayer.clearLayers();
            d=1;

        }else if(d == 1){
            displayDisasters();
            d=0;
        }
    });

    function displayDisasters(){

        for(var i = 0; i<disasterData.length; i++){
            //disaster marker
           var iconSize = (disasterData[i].disasters)*4;

        var disasterIcon = L.icon({
            iconUrl: '/img/disaster.png',
            iconSize: [iconSize, iconSize],
            iconAnchor: [iconSize/2, iconSize/2],
        })
            var disasterMarkers = L.marker([disasterData[i].latitude, disasterData[i].longitude], {icon: disasterIcon});
            disasterLayer.addLayer(disasterMarkers);
            
        }
        map.addLayer(disasterLayer);
    }



    //barplot

    // render barplot with africa data
    var chosenContinent = africa;
    renderBarplot();


    
    function renderBarplot(){

    var svg = d3.select("#barplot")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + ( height/2 )+ ")"); // Add 100 on Y translation, cause upper bars are longer

    barplot();
    function barplot() {

    // X scale
    var x = d3.scaleBand()
      .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
      .align(0)                  // This does nothing ?
      .domain( chosenContinent.map(function(d) { return d.country; }) ); // The domain of the X axis is the list of states.

    // Y scale
    var y = d3.scaleRadial()
      .range([innerRadius, outerRadius])   // Domain will be define later.
      .domain([0, 80]); // Domain of Y is from 0 to the max seen in the data

      var tool = d3.select("body").append("div")
      .attr("class", "tooltipbar")
      .style("opacity", 0);

  // Add bars
  svg.append("g")
    .selectAll("path")
    .data(chosenContinent)
    .enter()
    .append("path")
      .attr("fill", "#FED976")
      .attr("d", d3.arc()     // imagine your doing a part of a donut plot
          .innerRadius(innerRadius)
          .outerRadius(function(d) { return y(d['poverty']); })
          .startAngle(function(d) { return x(d.country); })
          .endAngle(function(d) { return x(d.country) + x.bandwidth(); })
          .padAngle(0.01)
          .padRadius(innerRadius))
          .on('mouseover', function(d){
            console.log(d)
            tool.transition()
            .duration(10)
            .style("opacity", 1);
            tool.html(d.target.__data__.country)
               .style("left", (d.pageX + 10) + "px")
               .style("top", (d.pageY - 15) + "px");
    
        });

    }
   
};

    //get radio buttons to choose continent
document.getElementById('africa').addEventListener("click", () =>{
    chosenContinent = africa;
    d3.select("#barplot").remove();
    d3.selectAll('.tooltip').style('opacity', '0');
    d3.select("#graphThree").insert("div").attr("id", "barplot");
    renderBarplot();
});
document.getElementById('asia').addEventListener("click", () =>{
    chosenContinent = asia;
    d3.select("#barplot").remove();
    d3.selectAll('.tooltip').style('opacity', '0');
    d3.select("#graphThree").insert("div").attr("id", "barplot");
    renderBarplot();
});
document.getElementById('europe').addEventListener("click", () =>{
    chosenContinent = europe;
    d3.select("#barplot").remove();
    d3.selectAll('.tooltip').style('opacity', '0');
    d3.select("#graphThree").insert("div").attr("id", "barplot");
    renderBarplot();
});
document.getElementById('northamerica').addEventListener("click", () =>{
    chosenContinent = northamerica;
    d3.select("#barplot").remove();
    d3.selectAll('.tooltip').style('opacity', '0');
    d3.select("#graphThree").insert("div").attr("id", "barplot");
    renderBarplot();
});
document.getElementById('southamerica').addEventListener("click", () =>{
    chosenContinent = southamerica;
    d3.select("#barplot").remove();
    d3.selectAll('.tooltip').style('opacity', '0');
    d3.select("#graphThree").insert("div").attr("id", "barplot");
    renderBarplot();
});
document.getElementById('oceania').addEventListener("click", () =>{
    chosenContinent = oceania;
    d3.select("#barplot").remove();
    d3.selectAll('.tooltip').style('opacity', '0');
    d3.select("#graphThree").insert("div").attr("id", "barplot");
    renderBarplot();
});

})();



