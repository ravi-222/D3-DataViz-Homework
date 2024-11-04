document.addEventListener('DOMContentLoaded', function () {
    let smokingData = [];
    let bmiData = [];
    let glucoseData = [];
    let ageData = [];
    let genderData = [];
    let hypertensionData = [];
    let heartData = [];

    //Dimensions
    const svgWidth = 700;
    const svgHeight = 400;
    const margin = { top: 20, right: 100, bottom: 30, left: 80 };
    const graphWidth = svgWidth - margin.left - margin.right;
    const graphHeight = svgHeight - margin.top - margin.bottom;


  d3.csv('./healthcare-dataset-stroke-data.csv').then(function(data) {
    
    // Chart 1
    

    smokingData = data.map(function(d) {
        let simplifiedStatus;
        switch (d.smoking_status) {
            case 'never smoked':
                simplifiedStatus = 'Non Smoker';
                break;
            case 'formerly smoked':
                simplifiedStatus = 'Smoker';
                break;
            case 'smokes':
                simplifiedStatus = 'Smoker';
                break;
            default:
                simplifiedStatus = 'Smoking Unknown';
                break;
        }
        return {
            stroke: d.stroke,
            smoking_status: simplifiedStatus
        };
    });

    let smokeAggregate = d3.rollups(smokingData, 
        v => v.length,
        d => d.stroke,
        d => d.smoking_status
        ).map(([stroke, statuses]) => {
            let statusCounts = Object.fromEntries(statuses);
            statusCounts.stroke = stroke;
            return statusCounts;
        });
    
    let smokePercentage = smokeAggregate.map(group => {
    const total = d3.sum(Object.values(group));
    Object.keys(group).forEach(key => {
        group[key] = (group[key] / total) * 100;
    });
    return group;
    });

    bmiData = data.map(function(d) {
        let simplifiedBmi;
        if(d.bmi < 25) simplifiedBmi = 'BMI<25'
        else if(d.bmi >= 25) simplifiedBmi = 'BMI>=25'
        else simplifiedBmi = 'BMI Unknown'
      return {
        stroke: d.stroke,
        bmi: simplifiedBmi
      };
    });
   
    let bmiAggregate = d3.rollups(bmiData, 
        v => v.length,
        d => d.stroke,
        d => d.bmi
        ).map(([stroke, statuses]) => {
            let statusCounts = Object.fromEntries(statuses);
            statusCounts.stroke = stroke;
            return statusCounts;
        });
    
    let bmiPercentage = bmiAggregate.map(group => {
    const total = d3.sum(Object.values(group));
    Object.keys(group).forEach(key => {
        group[key] = (group[key] / total) * 100;
    });
    return group;
    });

    glucoseData = data.map(function(d) {
      return {
        stroke: d.stroke,
        glucose: d.avg_glucose_level < 100 ? 'Glucose<100' : 'Glucose>=100'
      };
    });
   
    let glucoseAggregate = d3.rollups(glucoseData, 
        v => v.length,
        d => d.stroke,
        d => d.glucose
        ).map(([stroke, statuses]) => {
            let statusCounts = Object.fromEntries(statuses);
            statusCounts.stroke = stroke;
            return statusCounts;
        });
    
    let glucosePercentage = glucoseAggregate.map(group => {
    const total = d3.sum(Object.values(group));
    Object.keys(group).forEach(key => {
        group[key] = (group[key] / total) * 100;
    });
    return group;
    });


    const categories1 = {'smoke': ['Smoker', 'Non Smoker', 'Smoking Unknown'], 'bmi': ['BMI>=25', 'BMI<25', 'BMI Unknown'], 'glucose': ['Glucose>=100', 'Glucose<100']}

    const allCategories1 = [].concat(...Object.values(categories1))

    const color1 = d3.scaleOrdinal()
        .domain(allCategories1)
        .range(d3.schemeTableau10);
    
    const stroke1 = {
        '0.4' : 'Stroke', 
        '0' : 'No Stroke'
    }

    const svg1 = d3.select('.canvas1').append('svg')
      .attr('width', svgWidth)
      .attr('height', svgHeight);

    const graph1 = svg1.append('g')
      .attr('width', graphWidth)
      .attr('height', graphHeight)
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xAxisGroup1 = graph1.append('g')
      .attr('transform', `translate(0, ${graphHeight})`);

    const x1 = d3.scaleBand()
      .domain(Object.keys(stroke1))
      .range([0, graphWidth])
      .padding(0.4);

    xAxisGroup1.call(d3.axisBottom(x1).tickFormat(d => stroke1[d]));

    const yAxisGroup1 = graph1.append('g');

    // Create the y-axis scale
    const y1 = d3.scaleLinear()
        .domain([0, 100])
        .range([graphHeight, 0]);

    // Add the y-axis to your graph
    yAxisGroup1.call(d3.axisLeft(y1));

    const gap = 5;


    const smokeStack = d3.stack()
        .keys(categories1.smoke)
        (smokePercentage);
    const bmiStack = d3.stack()
        .keys(categories1.bmi)
        (bmiPercentage);
    const glucoseStack = d3.stack()
        .keys(categories1.glucose)
        (glucosePercentage);

    console.log(smokeStack)
    console.log(bmiStack)


    graph1.selectAll(".smokeStack")
    .data(smokeStack)
    .enter().append("g")
      .attr("fill", d => color1(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter().append("rect")
      .attr("x", d =>{
                        console.log(d)
                        return x1(d.data.stroke);
                    })
      .attr("y", d => y1(d[1]))
      .attr("height", d => Math.abs(y1(d[0]) - y1(d[1])))
      .attr("width", x1.bandwidth()/4);


    graph1.selectAll(".bmiStack")
    .data(bmiStack)
    .enter().append("g")
      .attr("fill", d => color1(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter().append("rect")
      .attr("x", d => x1(d.data.stroke) + x1.bandwidth()*3/8)
      .attr("y", d => y1(d[1]))
      .attr("height", d => Math.abs(y1(d[0]) - y1(d[1])))
      .attr("width", x1.bandwidth()/4);


    graph1.selectAll(".glucoseStack")
    .data(glucoseStack)
    .enter().append("g")
      .attr("fill", d => color1(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter().append("rect")
      .attr("x", d => x1(d.data.stroke) + x1.bandwidth()*3/4)
      .attr("y", d => y1(d[1]))
      .attr("height", d => Math.abs(y1(d[0]) - y1(d[1])))
      .attr("width", x1.bandwidth()/4);

    legendGroup1 = svg1.append('g')
        .attr('transform', `translate(${svgWidth - 150}, 10)`)
        .attr('fill', 'white')
    legend1 = d3.legendColor()
        .shape('path', d3.symbol().type(d3.symbolSquare).size(250)())
        .shapePadding(10)
        .scale(color1)
        

    legendGroup1.call(legend1)

    
    // Chart 2

    ageData = data.map(function(d) {
      return {
        stroke: d.stroke,
        age: d.age < 40 ? 'Age<40' : 'Age>=40'
      };
    });
   
    let ageAggregate = d3.rollups(ageData, 
        v => v.length,
        d => d.stroke,
        d => d.age
        ).map(([stroke, statuses]) => {
            let statusCounts = Object.fromEntries(statuses);
            statusCounts.stroke = stroke;
            return statusCounts;
        });
    
    let agePercentage = ageAggregate.map(group => {
    const total = d3.sum(Object.values(group));
    Object.keys(group).forEach(key => {
        group[key] = (group[key] / total) * 100;
    });
    return group;
    });

    genderData = data.map(function(d) {
      return {
        stroke: d.stroke,
        gender: d.gender
      };
    });
   
    let genderAggregate = d3.rollups(genderData, 
        v => v.length,
        d => d.stroke,
        d => d.gender
        ).map(([stroke, statuses]) => {
            let statusCounts = Object.fromEntries(statuses);
            statusCounts.stroke = stroke;
            return statusCounts;
        });
    
    let genderPercentage = genderAggregate.map(group => {
    const total = d3.sum(Object.values(group));
    Object.keys(group).forEach(key => {
        group[key] = (group[key] / total) * 100;
    });
    return group;
    });

    hypertensionData = data.map(function(d) {
      return {
        stroke: d.stroke,
        hypertension: d.hypertension == 0 ? 'No Hypertension' : 'Hypertension' 
      };
    });
   
    let hypertensionAggregate = d3.rollups(hypertensionData, 
        v => v.length,
        d => d.stroke,
        d => d.hypertension
        ).map(([stroke, statuses]) => {
            let statusCounts = Object.fromEntries(statuses);
            statusCounts.stroke = stroke;
            return statusCounts;
        });
    
    let hypertensionPercentage = hypertensionAggregate.map(group => {
    const total = d3.sum(Object.values(group));
    Object.keys(group).forEach(key => {
        group[key] = (group[key] / total) * 100;
    });
    return group;
    });

    heartData = data.map(function(d) {
      return {
        stroke: d.stroke,
        heart: d.heart_disease
      };
    });
   
    let heartAggregate = d3.rollups(heartData, 
        v => v.length,
        d => d.stroke,
        d => d.heart == 0 ? 'No Heart Disease' : 'Heart Disease'
        ).map(([stroke, statuses]) => {
            let statusCounts = Object.fromEntries(statuses);
            statusCounts.stroke = stroke;
            return statusCounts;
        });
    
    let heartPercentage = heartAggregate.map(group => {
    const total = d3.sum(Object.values(group));
    Object.keys(group).forEach(key => {
        group[key] = (group[key] / total) * 100;
    });
    return group;
    });

    const categories = {'age': ['Age<40', 'Age>=40'], 'gender': ['Male', 'Female'], 'hypertension': ['No Hypertension', 'Hypertension'], 'heart': ['No Heart Disease', 'Heart Disease'],}

    const allCategories = [].concat(...Object.values(categories))
    
    const color = d3.scaleOrdinal()
        .domain(allCategories)
        .range(d3.schemePaired); // Or any other color scheme
    
    const stroke = {
        '0.4' : 'Stroke', 
        '0' : 'No Stroke'
    }

    const svg = d3.select('.canvas2').append('svg')
      .attr('width', svgWidth)
      .attr('height', svgHeight);

    const graph = svg.append('g')
      .attr('width', graphWidth)
      .attr('height', graphHeight)
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xAxisGroup = graph.append('g')
      .attr('transform', `translate(0, ${graphHeight})`);

    const x = d3.scaleBand()
      .domain(Object.keys(stroke))
      .range([0, graphWidth])
      .padding(0.4);

    xAxisGroup.call(d3.axisBottom(x).tickFormat(d => stroke[d]));

    const yAxisGroup = graph.append('g');

    // Create the y-axis scale
    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([graphHeight, 0]);

    // Add the y-axis to your graph
    yAxisGroup.call(d3.axisLeft(y));


    const ageStack = d3.stack()
        .keys(categories.age)
        (agePercentage);
    const genderStack = d3.stack()
        .keys(categories.gender)
        (genderPercentage);
    const hypertensionStack = d3.stack()
        .keys(categories.hypertension)
        (hypertensionPercentage);
    const heartStack = d3.stack()
        .keys(categories.heart)
        (heartPercentage);

    graph.selectAll(".agestack")
    .data(ageStack)
    .enter().append("g")
      .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter().append("rect")
      .attr("x", d => x(d.data.stroke) - gap*2)
      .attr("y", d => y(d[1]))
      .attr("height", d => Math.abs(y(d[0]) - y(d[1])))
      .attr("width", x.bandwidth()/4);

    graph.selectAll(".genderstack")
    .data(genderStack)
    .enter().append("g")
      .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter().append("rect")
      .attr("x", d => x(d.data.stroke) + x.bandwidth()/4 - gap)
      .attr("y", d => y(d[1]))
      .attr("height", d => Math.abs(y(d[0]) - y(d[1])))
      .attr("width", x.bandwidth()/4);

    graph.selectAll(".hypertensionstack")
    .data(hypertensionStack)
    .enter().append("g")
      .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter().append("rect")
      .attr("x", d => x(d.data.stroke) + x.bandwidth()/2 + gap)
      .attr("y", d => y(d[1]))
      .attr("height", d => Math.abs(y(d[0]) - y(d[1])))
      .attr("width", x.bandwidth()/4);

    graph.selectAll(".heartstack")
    .data(heartStack)
    .enter().append("g")
      .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter().append("rect")
      .attr("x", d => x(d.data.stroke) + x.bandwidth()*3/4 + gap*2)
      .attr("y", d => y(d[1]))
      .attr("height", d => Math.abs(y(d[0]) - y(d[1])))
      .attr("width", x.bandwidth()/4);





    legendGroup = svg.append('g')
        .attr('transform', `translate(${svgWidth - 150}, 10)`)
        .attr('fill', 'white')
    legend = d3.legendColor()
        .shape('path', d3.symbol().type(d3.symbolSquare).size(250)())
        .shapePadding(10)
        .scale(color)

    legendGroup.call(legend)



  }) 
})

