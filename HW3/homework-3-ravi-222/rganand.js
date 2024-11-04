let Data = []
let selectedDots = [];

const xAttribute = document.getElementById('xAttributeSelect')
const yAttribute = document.getElementById('yAttributeSelect')
const color = document.getElementById('colorSelect')
const boxCategory = document.getElementById('boxplotSelect')

function classifyAttributes(data) {
    const attributeSamples = {};
    const attributeTypes = { quantitative: [], categorical: [] };
    const sampleSize = Math.min(10, data.length);
    data.slice(0, sampleSize).forEach(row => {
        Object.keys(row).forEach(key => {
            if (!attributeSamples[key]) {
                attributeSamples[key] = [];
            }
            attributeSamples[key].push(row[key]);
        });
    });
    Object.entries(attributeSamples).forEach(([key, values]) => {
        const numericCount = values.filter(value => !isNaN(value) && isFinite(value)).length;
        if (numericCount > values.length / 2) { 
            attributeTypes.quantitative.push(key);
        } else {
            attributeTypes.categorical.push(key);
        }
    });
    attributeTypes.quantitative = attributeTypes.quantitative.filter(key => !['#', 'Name'].includes(key));
    attributeTypes.categorical = attributeTypes.categorical.filter(key => key !== 'Type 2');

    return attributeTypes;
}

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
        M.FormSelect.init(select);
    });
}

function loadDataset(datasetName) {
    var dataset = '';
    switch (datasetName) {
        case 'penguins':
            dataset = './penguins_cleaned.csv';
            break;
        case 'pokemon':
            dataset = './Pokemon.csv';
            break;
        case 'test1':
            dataset = '/testing/data/Test1.csv';
            break;
        case 'test2':
            dataset = '/testing/data/Test2.csv';
            break;
    }
    if (dataset !== '') {
        d3.csv(dataset).then(data => {
        Data = data
        const { quantitative, categorical } = classifyAttributes(data);

        populateSelect('xAttributeSelect', quantitative);
        populateSelect('yAttributeSelect', quantitative);
        populateSelect('colorSelect', categorical);
        populateSelect('boxplotSelect', quantitative);

        updatePlots()
        }).catch(error => {
            console.error('Error:', error);
    });
    }
}

function updatePlots() {
    const xAttrVal = xAttribute.value;
    const yAttrVal = yAttribute.value;
    const colorVal = color.value;
    const boxCatVal = boxCategory.value
    drawScatterPlot(Data, xAttrVal, yAttrVal, colorVal);
    drawBoxPlot(selectedDots, colorVal, boxCatVal)
}


document.addEventListener('DOMContentLoaded', function() {
    
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems);
    
    
    // Event listeners for selects
    document.getElementById('datasetSelect').addEventListener('change', function() {
        var selectedValue = this.value;
        loadDataset(selectedValue);
    });

    xAttribute.addEventListener('change', updatePlots);
    yAttribute.addEventListener('change', updatePlots);
    color.addEventListener('change', updatePlots);
    boxCategory.addEventListener('change', updatePlots);
});


const svgWidth = 600;
const svgHeight = 400;
const margin = {top: 20, right: 20, bottom: 30, left: 40};
const graphWidth = svgWidth - margin.left - margin.right
const graphHeight = svgHeight - margin.top - margin.bottom

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);


//Scatter Plot groups
const spsvg = d3.select('.spCanvas')
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
const spgraph = spsvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .attr('width', graphWidth)
        .attr('height', graphHeight)
const spX = spgraph.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', `translate(0,${graphHeight})`)
const spY = spgraph.append('g')
        .attr('class', 'axis axis--y')

const bpsvg = d3.select('.bpCanvas')
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
const bpgraph = bpsvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .attr('width', graphWidth)
        .attr('height', graphHeight)
const bpX = bpgraph.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', `translate(0,${graphHeight})`)
const bpY = bpgraph.append('g')
        .attr('class', 'axis axis--y')


const drawScatterPlot = (data, xAttribute, yAttribute, colorAttribute) => {

    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d[xAttribute]))
        .range([0, graphWidth]);
    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d[yAttribute]))
        .range([graphHeight, 0]);

    spX.transition().duration(750).call(d3.axisBottom(xScale))

    spY.transition().duration(750).call(d3.axisLeft(yScale))

    const dots = spgraph.selectAll('.dot')
        .data(data)
        .join(
            enter => enter.append('circle')
            .attr('class', 'dot')
            .transition().duration(750)
            .attr('r', 3.5)
            .attr('cx', d => xScale(d[xAttribute]))
            .attr('cy', d => yScale(d[yAttribute]))
            .style('fill', d => colorScale(d[colorAttribute]))
            .attr("id", (d, i) => "dot-" + i),

            update => update.transition().duration(750)
            .attr('cx', d => xScale(d[xAttribute]))
            .attr('cy', d => yScale(d[yAttribute]))
            .style('fill', d => colorScale(d[colorAttribute]))
            .attr("id", (d, i) => "dot-" + i),

            exit => exit.transition().duration(750).remove()
        ) 
    
    let coords = [];
    const lineGenerator = d3.line();

    const pointInPolygon = function (point, vs) {         

        var x = point[0],
        y = point[1];

        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i][0],
                yi = vs[i][1];
            var xj = vs[j][0],
                yj = vs[j][1];

            var intersect =
                yi > y != yj > y &&
                x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
        return inside;
    };

    const drawPath = () => {
        d3.select("#lasso")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .style("fill", "#00000054")
            .attr("d", lineGenerator(coords));
        }

    const dragStart = () => {
        coords = [];
        d3.select("#lasso").remove();
        dots.attr('r', '3.5')
        spsvg.append("path")
            .attr("id", "lasso");
        }

    const dragMove = (event) => {
        let mouseX = event.sourceEvent.offsetX;
        let mouseY = event.sourceEvent.offsetY;
        coords.push([mouseX, mouseY]);
        drawPath();
    }

    const dragEnd = () => {
        selectedDots = [];
        dots.each((d, i) => {
            let point = [
                xScale(d[xAttribute]),
                yScale(d[yAttribute]),
            ];
            if (pointInPolygon(point, coords)) {
                d3.select("#dot-" + i).attr("r", "4.5");
                selectedDots.push(d);
            }
        });
            updatePlots();
    }

    const drag = d3.drag()
        .on("start", dragStart)
        .on("drag", dragMove)
        .on("end", dragEnd);

    spsvg.call(drag);
}


 function drawBoxPlot(dots, color, boxCategory) {

    const count = dots.length;

    d3.select(".dataCount").text(`Count: ${count}`);

    const stats = d3.rollup(dots, (v) => {
        const values = v.map(d => d[boxCategory]).sort(d3.ascending);
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const interQuantileRange = q3 - q1;
        const min = d3.min(values);
        const max = d3.max(values);
        return { q1, median, q3, interQuantileRange, min, max };
    }, 
    d => d[color]
    );
    
    const groups = Array.from(stats.keys());
    const statsValues = Array.from(stats.values());

    const y = d3.scaleLinear()
    .domain([
        d3.min(statsValues, stat => stat.min),
        d3.max(statsValues, stat => stat.max)
    ])
    .nice()
    .range([graphHeight, 0]);
        
    const x = d3.scaleBand()
        .domain(groups) 
        .range([0, graphWidth])
        .padding(0.2);

    bpY.transition().duration(750).call(d3.axisLeft(y))
    
    bpX.transition().duration(750).call(d3.axisBottom(x))
        .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)") 
            .style("text-anchor", "end");
    
    const boxGroups = bpgraph.selectAll(".boxGroup")
        .data(Array.from(stats), d => d[0]);

    const enterGroups = boxGroups.enter().append("g")
    .attr("class", "boxGroup");
    
    enterGroups.each(function(d) {
        const group = d3.select(this);
        const [groupKey, stat] = d;
        const xPosition = x(groupKey) + x.bandwidth() / 2;
        const boxWidth = x.bandwidth() * 0.6;

        group.append('rect')
            .attr('class', 'box')
            .attr('x', xPosition - boxWidth / 2)
            .attr('y', y(stat.q3))
            .attr('width', boxWidth)
            .attr('height', y(stat.q1) - y(stat.q3))
            .attr('stroke', 'black')
            .attr('fill', colorScale(groupKey));

        group.append('line')
            .attr('class', 'medianLine')
            .attr('x1', xPosition - boxWidth / 2)
            .attr('x2', xPosition + boxWidth / 2)
            .attr('y1', y(stat.median))
            .attr('y2', y(stat.median))
            .attr('stroke', 'black');

        group.append('line')
            .attr('class', 'whisker')
            .attr('x1', xPosition)
            .attr('x2', xPosition)
            .attr('y1', y(stat.min))
            .attr('y2', y(stat.max))
            .attr('stroke', 'black');
    });

    boxGroups.each(function(d, i) {
        const group = d3.select(this);
        const [groupKey, stat] = d;
        const xPosition = x(groupKey) + x.bandwidth() / 2;
        const boxWidth = x.bandwidth() * 0.6;
        const delay = i * 500;

        group.select('.box')
            .transition().duration(750)
            .delay(delay)
            .attr('x', xPosition - boxWidth / 2)
            .attr('y', y(stat.q3))
            .attr('width', boxWidth)
            .attr('height', y(stat.q1) - y(stat.q3))
            
        group.select('.medianLine')
            .transition().duration(750)
            .delay(delay)
            .attr('x1', xPosition - boxWidth / 2)
            .attr('x2', xPosition + boxWidth / 2)
            .attr('y1', y(stat.median))
            .attr('y2', y(stat.median));

        group.selectAll('.whisker')
            .transition().duration(750)
            .delay(delay)
            .attr('x1', xPosition)
            .attr('x2', xPosition)
            .attr('y1', y(stat.min))
            .attr('y2', y(stat.max))
    });

    boxGroups.exit().transition().duration(750).style('opacity', 0).attr('height', 0).remove();
}

