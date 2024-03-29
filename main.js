function createVis()
{
var height = 932;
var width = 932;
pack = data => d3.pack()
    .size([width, height])
    .padding(3)
  (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value))

// Order in which we nest is dependent on the order of these functions in the array
nestingOrder = [[function(d) {return d.Race;}, function(d) {return d.Sex;}, function(d) {return d.Age;}],
                [function(d) {return d.Sex;}, function(d) {return d.Race;}, function(d) {return d.Age;}],
                [function(d) {return d.Age;}, function(d) {return d.Race;}, function(d) {return d.Sex;}]];

labelFunction1 = function(group) {if (typeof group.values !== 'undefined'){ return{name: group.key, children: group.values}}else{return {name: group.key, value: group.value}}};
labelFunction = function(group) { return {name: group.key, children: group.values.map(labelFunction1)}};

var choice = document.getElementById("nestChoice").value;
console.log(choice);
var i = 0;
if (choice === "Race"){
  i = 0;
}else{
  i = (choice === "Sex") ? 1 : 2;
}

parsedData = d3.csv("CancerByAge.csv").then(function(data) {
    var nestedData = d3.nest()
    .key(nestingOrder[i][0])
    .key(nestingOrder[i][1])
    .key(nestingOrder[i][2])
    .rollup(function(v) { return Math.ceil(d3.mean(v, function(d) { return d.Rate; })) })
    .entries(data).map(function(group){ return {name: group.key, children: group.values.map(labelFunction)}});

    pdata = ({name: 'Cancer', children : nestedData});

    const root = pack(pdata);
    let focus = root;
    let view;
    
    format = d3.format(",d");
    
    color = d3.scaleLinear()
        .domain([0, 5])
        .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
        .interpolate(d3.interpolateHcl)
        
    const svg = d3.select(".svg-wrapper").append("svg")
      .attr("id", "currSVG")
      .attr("width", width/1.4)
      .attr("height", height/1.4)
      .attr("viewBox", `-${width/2} -${height/2} ${width} ${height}`)
      .style("display", "block")
      .style("margin", "0 auto")
      .style("background", color(0))
      .style("cursor", "pointer")
      .on("click", () => zoom(root));


    const node = svg.append("g")
      .selectAll("circle")
      .data(root.descendants().slice(1))
      .join("circle")
        .attr("fill", d => d.children ? color(d.depth) : "white")
        .attr("pointer-events", d => !d.children ? "none" : null)
        .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
        .on("mouseout", function() { d3.select(this).attr("stroke", null); })
        .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));

    const label = svg.append("g")
      .style("font", "10px sans-serif")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
      .style("fill-opacity", d => d.parent === root ? 1 : 0)
      .style("display", d => d.parent === root ? "inline" : "none")
      .style("font-size", "24px")
      .text(d => d.data.name);   

    zoomTo([root.x, root.y, root.r * 2]);

    function zoomTo(v) {
        const k = width / v[2];
    
        view = v;
    
        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("r", d => d.r * k);
    }

    function zoom(d) {
        const focus0 = focus;
    
        focus = d;
    
        const transition = svg.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween("zoom", d => {
              const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
              return t => zoomTo(i(t));
            });
    
        label
          .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
          .transition(transition)
            .style("fill-opacity", d => d.parent === focus ? 1 : 0)
            .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
            .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
    }

    svg.exit().remove();
});



}

function updateVis(){
  d3.selectAll("svg > *").remove();
  createVis();
  d3.select("#currSVG").remove();
}

createVis();
