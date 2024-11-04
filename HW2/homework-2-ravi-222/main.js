document.getElementById('editableDiv').addEventListener('input', function() {
        document.getElementById('wordbox').value = this.innerText;
    });

    function highlightCharacterInDiv(char) {
            const editableDiv = document.getElementById('editableDiv');
            let textContent = editableDiv.innerText;
            const highlightedHTML = textContent.split('').map(c =>
                c === char ? `<span class="highlight">${c}</span>` : c
            ).join('');

            editableDiv.innerHTML = highlightedHTML;
        }

    function removeHighlights() {
        const editableDiv = document.getElementById('editableDiv');
        editableDiv.innerHTML = editableDiv.innerText;
    }

function getClassName(char) {
    if (/^[a-z]+$/.test(char)) {
        return '' + char;
    }
    switch (char) {
        case /^[a-z]+$/.test(char):
            return '' + char;
        case '.':
            return 'dot'
        case ',':
            return 'comma'
        case '?':
            return 'question'
        case '!':
            return 'exclaim'
        case ':':
            return 'colon'
        case ';':
            return 'semi'
        default:
            break;
    }
}


function getCharType(char) {
    var vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
    var punctuation = ['.', ',', '!', '?', ':', ';'];

    if (/^[a-zA-Z]+$/.test(char)) {
        return vowels.includes(char) ? 'vowels' : 'consonants';
    } else if (punctuation.includes(char)) {
        return 'punctuation';
    } else {
        return 'other';
    }
}

const submit = document.querySelector('button');
const wordbox = document.getElementById('wordbox');
var text; 

submit.addEventListener('click', (e) => {
    text = wordbox.value.toLowerCase();

    wordbox.value = '';
    var data = [
    { type: 'vowels', children: [] },
    { type: 'consonants', children: [] },
    { type: 'punctuation', children: [] }
    ];
    for (var i = 0; i < text.length; i++) {
        var char = text.charAt(i);
        var type = getCharType(char);

        if (type !== 'other') {
            var group = data.find(d => d.type === type);
            var child = group.children.find(c => c.char === char);
            if (child) {
                child.count++;
            } else {
                group.children.push({ char: char, count: 1 });
            }
        }
    }
    sankeyGraph.selectAll('*').remove();
    drawTreemap(data);
});

const margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = 570 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

const color = d3.scaleOrdinal(d3.schemeAccent).domain(["vowels", "consonants", "punctuation"]);

var treeMaptip = d3.select("body").append("div")
    .attr("class", "tip")

const treemapGraph = d3.select('#treemap_svg')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

let selectedCount = 0;
const drawTreemap = data => {

    var rootData = { children: data };
    const root = d3.hierarchy(rootData).sum(d => d.count);

    d3.treemap()
      .size([width, height])
      .paddingInner(3)(root);

    const rects = treemapGraph.selectAll("rect")
        .data(root.leaves())
        .join("rect")
        .attr("class", d => `treemap-rect treemap-${getClassName(d.data.char)}`)
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("fill", d => color(d.parent.data.type))
        .on("click", function(event, d) {
        drawSankey(d.data.char);
        selectedCount = d.data.count;
        });

    rects.on("mouseover", function(event, d) {
        treeMaptip.transition()
                .duration(250)
                .style("opacity", 1);
        treeMaptip.html("Character: " + d.data.char + "<br/>Count: " + d.data.count)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style('background', 'white');

        d3.selectAll(`.treemap-${getClassName(d.data.char)}`).style("stroke", "white").style("stroke-width", "2px");
        d3.selectAll(`.sankey-${getClassName(d.data.char)}`).style("stroke", "white").style("stroke-width", "2px");
        highlightCharacterInDiv(d.data.char);
    })
    .on("mouseout", function(event, d) {
         treeMaptip.transition()
                .duration(250)
                .style("opacity", 0);
        d3.selectAll(`.treemap-${getClassName(d.data.char)}`).style("stroke", "black").style("stroke-width", "1px");
        d3.selectAll(`.sankey-${getClassName(d.data.char)}`).style("stroke", "black").style("stroke-width", "1px");
        removeHighlights();
    });

       
};

//Sankey data processing
function buildSankeyDataset(selectedChar, text) {
    let before = {}, after = {};

    for (let i = 0; i < text.length; i++) {
        if (text[i] === selectedChar) {
            if (i > 0 && getCharType(text[i - 1]) !== 'other') {
                before[text[i - 1]] = (before[text[i - 1]] || 0) + 1;
            }
            if (i < text.length - 1 && getCharType(text[i + 1]) !== 'other') {
                after[text[i + 1]] = (after[text[i + 1]] || 0) + 1;
            }
        }
    }

    return { before, after };
}

var sankeytip = d3.select("body").append("div")
    .attr("class", "tip")

const sankeyGraph = d3.select('#sankey_svg')
    .append('g')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr("transform", `translate(${margin.left + 10}, ${margin.top})`);

function drawSankey(selectedChar) {

    document.getElementById('flow_label').textContent = `Character flow for ${selectedChar}`

    sankeyGraph.selectAll('*').remove();
    
    const { before, after } = buildSankeyDataset(selectedChar, text);
    
    const nodes = [], links = [];
    let nodeId = 0;

    const sankey = d3.sankey()
        .nodeWidth(30)
        .nodePadding(10)
        .size([width, height]);

    if (Object.keys(before).length === 0 && Object.keys(after).length === 0) {
        nodes.push({ id: nodeId++, name: selectedChar, type: 'selected'});
        let x0 = (width / 2) - 15
        let x1 = (width / 2) + 15
        let y0 = (height / 2) - 10
        let y1 = (height / 2) + 10 

        const sankeyData = sankey({
        nodes: nodes.map(d => Object.assign({}, d)),
        links: links.map(d => Object.assign({}, d))
        });

        console.log(sankeyData);

        const node = sankeyGraph.append('g').selectAll('.node')
            .data(sankeyData.nodes)
            .enter().append('g');

        node.append('rect')
            .attr("class", d => `sankey-rect sankey-${getClassName(d.name)}`) 
            .attr('x', x0)
            .attr('y', 20)
            .attr('height', 350)
            .attr('width', sankey.nodeWidth())
            .style('fill', d => color(getCharType(d.name)))

        node.append('text')
            .attr('x', x0 - 10)
            .attr('y', (y0 + y1) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .text(d => d.name);
        
        node.on("mouseover", function(event, d) {
                let tipText = "";
                    tipText = `Character '${d.name}' appears ${1} times.`;
                sankeytip.html(tipText)
                .transition()
                    .duration(250)
                    .style("opacity", 1)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");

                d3.selectAll(`.sankey-${getClassName(d.name)}`).style("stroke", "white").style("stroke-width", "2px");
                d3.selectAll(`.treemap-${getClassName(d.name)}`).style("stroke", "white").style("stroke-width", "2px");
                highlightCharacterInDiv(d.name);
            })
            .on("mouseout", function(event, d) {
                sankeytip.transition()
                    .duration(250)
                    .style("opacity", 0);
                d3.selectAll(`.sankey-${getClassName(d.name)}`).style("stroke", "black").style("stroke-width", "1px");
                d3.selectAll(`.treemap-${getClassName(d.name)}`).style("stroke", "black").style("stroke-width", "1px");
                removeHighlights();
            });
    }else{

        nodes.push({ id: nodeId++, name: selectedChar, type: 'selected' });
        
        
        Object.entries(before).forEach(([char, count], i) => {
            nodes.push({ id: nodeId, name: char, type: 'before' });
            links.push({ source: nodeId++, target: 0, value: count });
        });
        
        const afterStartId = nodeId;
        Object.entries(after).forEach(([char, count], i) => {
            nodes.push({ id: nodeId, name: char, type: 'after' });
            links.push({ source: 0, target: nodeId++, value: count });
        });
        const sankeyData = sankey({
            nodes: nodes.map(d => Object.assign({}, d)),
            links: links.map(d => Object.assign({}, d))
        });
    
        console.log(sankeyData);
    
    
        const link = sankeyGraph.append('g').selectAll('.link')
            .data(sankeyData.links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d',  d3.sankeyLinkHorizontal())
            .style('stroke-width', d => Math.max(1, d.width));
    
        const node = sankeyGraph.append('g').selectAll('.node')
            .data(sankeyData.nodes)
            .enter().append('g');
    
        node.append('rect')
            .attr("class", d => `sankey-rect sankey-${getClassName(d.name)}`) 
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('height', d => d.y1 - d.y0)
            .attr('width', sankey.nodeWidth())
            .style('fill', d => color(getCharType(d.name)))
            
    
        node.append('text')
            .attr('x', d => (d.x0 - 10))
            .attr('y', d => (d.y0 + d.y1) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .text(d => d.name);
        
        node.on("mouseover", function(event, d) {
                let tipText = "";
                if (d.type === 'before') {
                    tipText = `Character '${d.name}' flows into '${selectedChar}' ${d.value} times.`;
                } else if (d.type === 'selected') {
                    tipText = `Character '${d.name}' appears ${selectedCount} times.`;
                } else if (d.type === 'after') {
                    tipText = `Character '${selectedChar}' flows into '${d.name}' ${d.value} times.`;
                }
                sankeytip.html(tipText)
                   .transition()
                    .duration(250)
                    .style("opacity", 1)
                   .style("left", (event.pageX) + "px")
                   .style("top", (event.pageY - 28) + "px");
    
                d3.selectAll(`.sankey-${getClassName(d.name)}`).style("stroke", "white").style("stroke-width", "2px");
                d3.selectAll(`.treemap-${getClassName(d.name)}`).style("stroke", "white").style("stroke-width", "2px");
                highlightCharacterInDiv(d.name);
            })
            .on("mouseout", function(event, d) {
                sankeytip.transition()
                    .duration(250)
                    .style("opacity", 0);
                d3.selectAll(`.sankey-${getClassName(d.name)}`).style("stroke", "black").style("stroke-width", "1px");
                d3.selectAll(`.treemap-${getClassName(d.name)}`).style("stroke", "black").style("stroke-width", "1px");
                removeHighlights();
            });
    }
}

