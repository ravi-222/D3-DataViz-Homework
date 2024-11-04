// Hint: This is a great place to declare your global variables

var femaleData = []
var maleData = []

const svgWidth = 1000;
const svgHeight = 600;
const margin = { top: 50, right: 30, bottom: 50, left: 50}
const graphWidth = svgWidth - margin.left - margin.right
const graphHeight = svgHeight - margin.top - margin.bottom

var svg
var graph
var graphMale
var graphFemale

//axis groups
var xAxisGroup
var yAxisGroup

//legend
var color = d3.scaleOrdinal()
  .domain(['Male Employment Rate', 'Female Employment Rate'])
  .range(['blue', 'pink'])

var legendGroup
var legend



// This function is called once the HTML page is fully loaded by the browser
document.addEventListener('DOMContentLoaded', function () {
   // Hint: create or set your svg element inside this function
    svg = d3.select('#myDataVis').append('svg')      

    svg.attr('width', svgWidth)
    .attr('height', svgHeight)
    
    graph = svg.append('g')
    graph.attr('width', graphWidth)
        .attr('height', graphHeight)
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
    
    graphMale = graph.append('g')
    graphFemale = graph.append('g')

    xAxisGroup = graph.append('g')
    .attr('transform', `translate(0, ${graphHeight})`)
    yAxisGroup = graph.append('g')

    legendGroup = svg.append('g')
        .attr('transform', `translate(${graphWidth - 200}, 10)`)
    legend = d3.legendColor()
        .shape('path', d3.symbol().type(d3.symbolSquare).size(250)())
        .shapePadding(10)
        .scale(color)

   // This will load your CSV files and store them into two arrays.
   Promise.all([d3.csv('data/females_data.csv'),d3.csv('data/males_data.csv')])
        .then(function (values) {
            console.log('Loaded the females_data.csv and males_data.csv');
            values.forEach(value => {
                value.forEach(d => {
                    d.Year = new Date(+d.Year, 0, 1)
                    d.Afghanistan = +d.Afghanistan
                    d.Albania = +d.Albania
                    d.Algeria = +d.Algeria
                    d.Angola = +d.Angola
                    d.Argentina = +d.Argentina                    
                });
            });
            femaleData = values[0];
            maleData = values[1];
        });
       
        const select = document.getElementById("countries");
        select.addEventListener('change', () => {
            drawLollipopChart(select.value);
        })
});



// Use this function to draw the lollipop chart.
function drawLollipopChart(country) {

    var values = []
    
    maleData.forEach(d => {
        values.push(d[country])
    });
    
    femaleData.forEach(d => {
        values.push(d[country])
    });

    //scales
    const x = d3.scaleTime().range([0, graphWidth]).domain([new Date(1990, 0, 1), new Date(2023, 0, 1)]);

    const y = d3.scaleLinear().range([graphHeight, 0]).domain([0, d3.max(values)])

    

    //create Axis

    const xAxis = d3.axisBottom(x)
    const yAxis = d3.axisLeft(y)

    xAxisGroup.call(xAxis)
    yAxisGroup.transition().duration(1000).call(yAxis)
    
     // Create a title for the x-axis
    graph.append("text")
        .attr("class", "x-axis-title")
        .attr("text-anchor", "middle")
        .attr("x", graphWidth / 2)
        .attr("y", graphHeight + 35)
        .text("Year");

    // Create a title for the y-axis
    graph.append("text")
        .attr("class", "y-axis-title")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -graphHeight / 2)
        .attr("y", -35)
        .text("Employment Rate");
        

    //lolipops

    //circles
    const circlesMale = graphMale.selectAll("circle")
        .data(maleData)
    
    const circlesFemale = graphFemale.selectAll("circle")
        .data(femaleData)

    circlesMale.exit().remove();
    circlesFemale.exit().remove();
        
    circlesMale.attr("r", "4")
        .transition()
        .duration(1000)
        .attr('cx', d => x(d.Year) - 5)
        .attr('cy', d => y(d[country]))
        .attr('fill', d => color('Male Employment Rate'))

    circlesFemale.attr("r", "4")
        .transition()
        .duration(1000)
        .attr('cx', d => x(d.Year) + 5)
        .attr('cy', d => y(d[country]))
        .attr('fill', d => color('Female Employment Rate'))
        
    circlesMale.enter()
        .append('circle')
        .attr("r", "4")
        .transition()
        .duration(1000)
        .attr('cx', d => x(d.Year) - 5)
        .attr('cy', d => y(d[country]))
        .attr('fill', d => color('Male Employment Rate'))
            
    circlesFemale.enter()
        .append('circle')
        .attr("r", "4")
        .transition()
        .duration(1000)
        .attr('cx', d => x(d.Year) + 5)
        .attr('cy', d => y(d[country]))
        .attr('fill', d => color('Female Employment Rate'))
    
    //lines
    const linesMale = graphMale.selectAll("line")
        .data(maleData)
    
    const linesFemale = graphFemale.selectAll("line")
        .data(femaleData)

    linesMale.exit().remove();
    linesFemale.exit().remove();
        
    linesMale
        .transition()
        .duration(1000)
        .attr('x1', d => x(d.Year) - 5)
        .attr('x2', d => x(d.Year) - 5)
        .attr('y1', y(0))
        .attr('y2', d => y(d[country]))
        .attr('stroke', d => color('Male Employment Rate'))

    linesFemale
        .transition()
        .duration(1000)
        .attr('x1', d => x(d.Year) + 5)
        .attr('x2', d => x(d.Year) + 5)
        .attr('y1', y(0))
        .attr('y2', d => y(d[country]))
        .attr('stroke', d => color('Female Employment Rate'))
        
    linesMale.enter()
        .append('line')
        .transition()
        .duration(1000)
        .attr('x1', d => x(d.Year) - 5)
        .attr('x2', d => x(d.Year) - 5)
        .attr('y1', y(0))
        .attr('y2', d => y(d[country]))
        .attr('stroke', d => color('Male Employment Rate'))
            
    linesFemale.enter()
        .append('line')
        .transition()
        .duration(1000)
        .attr('x1', d => x(d.Year) + 5)
        .attr('x2', d => x(d.Year) + 5)
        .attr('y1', y(0))
        .attr('y2', d => y(d[country]))
        .attr('stroke', d => color('Female Employment Rate'))
    
    legendGroup.call(legend);
  

}