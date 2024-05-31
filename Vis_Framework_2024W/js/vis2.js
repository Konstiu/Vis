/**
 * Vis 1 Task 1 Framework
 * Copyright (C) TU Wien
 *   Institute of Visual Computing and Human-Centered Technology
 *   Research Unit of Computer Graphics
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are not permitted.
 *
 * Main script for Vis1 exercise. Loads the volume, initializes the scene, and contains the paint function.
 *
 * @author Manuela Waldner
 * @author Laura Luidolt
 * @author Diana Schalko
 */
let renderer, camera, scene, orbitCamera;
let canvasWidth, canvasHeight = 0;
let container = null;
let volume = null;
let fileInput = null;
let firstHitShader = null;
let density = 0.3;
let intensity = 1.0;
let theColor = "#ffffff";
let theColor_rgb = hexToRgb(theColor);
let density_and_intensity_values = [[-1.0, -1.0, theColor], [-1.0, -1.0, theColor], [-1.0, -1.0, theColor], [-1.0, -1.0, theColor], [-1.0, -1.0, theColor]];
let density_arr = [-1,-1,-1,-1,-1];
let intensity_arr = [-1,-1,-1,-1,-1];
let color_arr =[[theColor, theColor_rgb], [theColor, theColor_rgb], [theColor, theColor_rgb], [theColor, theColor_rgb], [theColor, theColor_rgb]];

/**
 * Load all data and initialize UI here.
 */
function init() {
    // volume viewer
    container = document.getElementById("viewContainer");
    canvasWidth = window.innerWidth * 0.7;
    canvasHeight = window.innerHeight * 0.7;

    // WebGL renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(canvasWidth, canvasHeight);
    container.appendChild(renderer.domElement);

    // read and parse volume file
    fileInput = document.getElementById("upload");
    fileInput.addEventListener('change', readFile);

    // create new maximum intensity projection shader
    firstHitShader = new FirstHitShader();

    buttonpress();
    // color changing
    var colorInput = document.getElementById("surfaceColor");

    colorInput.addEventListener("input", function () {
        theColor = colorInput.value;
        theColor_rgb = hexToRgb(theColor);
        firstHitShader.setSurfaceColor(new THREE.Vector3(theColor_rgb.r / 255, theColor_rgb.g / 255, theColor_rgb.b / 255));
        paint();
    }, false);
}

function hexToRgb(hex) {
    // Remove the leading #
    hex = hex.replace(/^#/, '');

    // Convert 3-digit hex to 6-digit hex
    if (hex.length === 3) {
        hex = hex.split('').map(hexChar => hexChar + hexChar).join('');
    }

    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return {r, g, b};
}

/**
 * Handles the file reader. No need to change anything here.
 */
async function readFile() {
    let reader = new FileReader();
    reader.onloadend = function () {
        console.log("data loaded: ");

        let data = new Uint16Array(reader.result);
        volume = new Volume(data);
        generateHistogram(volume.voxels);

        // set shader data
        firstHitShader.setVolume(volume);
        firstHitShader.setSteps(200);

        resetVis();
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
}

/**
 * Construct the THREE.js scene and update histogram when a new volume is loaded by the user.
 *
 */
async function resetVis() {
    // create new empty scene and perspective camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);


    const boundingBox = new THREE.BoxGeometry(volume.width, volume.height, volume.depth); // create bounding box in which we render the volume
    const material = firstHitShader.material;
    await firstHitShader.load(); // this function needs to be called explicitly, and only works within an async function!
    const mesh = new THREE.Mesh(boundingBox, material);
    scene.add(mesh);

    // our camera orbits around an object centered at (0,0,0)
    orbitCamera = new OrbitCamera(camera, new THREE.Vector3(0, 0, 0), 2 * volume.max, renderer.domElement);

    // init paint loop
    requestAnimationFrame(paint);
}

/**
 * Render the scene and update all necessary shader information.
 */
function paint() {
    if (volume) {
        renderer.render(scene, camera);
    }
}


/**
 * Draws the corresponding histogram in the div histogram
 * @param voxels the float array to be updated.
 */
function generateHistogram(voxels) {
    const container = d3.select("#tfContainer");
    const width = 500;
    const height = width / 2;
    const margin = {top: 10, right: 30, bottom: 40, left: 40};
    const adjWidth = width - margin.left - margin.right;
    const adjHeight = height - margin.top - margin.bottom;


    // Check if the SVG already exists, create it if not
    let svg = container.select('svg');
    if (svg.empty()) {
        svg = container.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Initial x-axis
        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${adjHeight})`);

        // Initial y-axis
        svg.append('g')
            .attr('class', 'y-axis');

        const line = svg.append("line")
            .attr("x1", (density * adjWidth))
            .attr("x2", (density * adjWidth))
            .attr("y1", 0)
            .attr("y2", adjHeight)
            .style("stroke", "#ffffff")
            .style("stroke-width", "2px")
            .style("cursor", "pointer");


        const ball = svg.append("circle")
            .attr("cx", (density * adjWidth))
            .attr("cy", 0)
            .attr("r", 10)
            .style("fill", "#ffffff")
            .style("stroke-width", "2px")
            .style("cursor", "pointer");

        const dragLine = d3.drag()
            .on("drag", function (event) {
                const newX = Math.max(0, Math.min(adjWidth, event.x));
                const newY = Math.max(0, Math.min(adjHeight, event.y));
                line.attr("x1", newX)
                    .attr("x2", newX)
                    .attr("y1", newY)
                    .attr("y2", adjHeight);
                ball.attr("cx", newX)
                    .attr("cy", newY);

                density = line.node().getAttribute("x1") / adjWidth;
                intensity = line.node().getAttribute("y1") / (adjHeight) * -1 + 1;
                firstHitShader.setIsoVal(density);
                paint();
            });

        line.call(dragLine);
        ball.call(dragLine);
    }

    // Setup the x-axis scale
    const xScale = d3.scaleLinear()
        .domain([0, 1]) // Adjust based on your actual data needs
        .range([0, adjWidth]);

    // Histogram function to compute the bins
    let histogram = d3.histogram()
        .value(d => d)
        .domain(xScale.domain())
        .thresholds(xScale.ticks(100));

    let bins = histogram(voxels);

    // Setup the y-axis scale
    const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([adjHeight, 0]);

    // Update the axes
    svg.select('.x-axis').call(d3.axisBottom(xScale));
    svg.select('.y-axis').call(d3.axisLeft(yScale));

    // Adding labels to the axes
    svg.select('.x-axis').append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'end')
        .attr('x', adjWidth)
        .attr('y', 40)
        .text('Density')
        .attr('fill', 'white');

    svg.select('.y-axis').append('text')
        .attr('class', 'y-axis-label')
        .attr('text-anchor', 'end')
        .attr('transform', 'rotate(-90)')
        .attr('y', -40)
        .attr('dy', '.75em')
        .text('Intensity')
        .attr('fill', 'white');

    // Select all bars and bind data
    let bars = svg.selectAll('rect')
        .data(bins);

    // y-scale down for the histogram data
    const yScaleDown = d3.scalePow()
        .exponent(0.25)
        .domain([0, d3.max(bins, d => d.length) * 1.5])
        .range([0, adjHeight]);

    // Enter selection
    bars.enter().append('rect')
        .attr('x', d => xScale(d.x0))
        .attr('y', adjHeight)
        .attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
        .attr('height', 0) // Start with height 0 for transition
        .style('fill', 'white')
        .merge(bars) // Merge enter and update selections
        .transition() // Start a transition to animate new changes
        .duration(750) // Transition time of 750ms
        .attr('y', adjHeight)
        .attr('height', d => yScaleDown(d.length))
        .style('opacity', 0.4);

    // Exit transition
    bars.exit()
        .transition()
        .duration(750)
        .attr('y', adjHeight)
        .attr('height', 0)
        .remove();
}


function buttonpress() {
    document.getElementById('saveButton').addEventListener("click", function () {
        console.log(density + " " + intensity + " " + theColor);
        /*for (let i = 0; i < density_and_intensity_values.length; i++) {
            if (density_and_intensity_values[i][0] === -1) {
                density_and_intensity_values[i][0] = density;
                density_and_intensity_values[i][1] = intensity;
                density_and_intensity_values[i][2] = theColor;
                console.log(density + " " + intensity + " " + theColor);
                updateLineAndCircle();
                break;
            }
        }*/
        for (let i = 0; i < density_arr.length; i++) {
            if (density_arr[i] === -1) {
                density_arr[i] = density;
                intensity_arr[i] = intensity;
                color_arr[i][0] = theColor;
                color_arr[i][1] = theColor_rgb;
                //console.log(density + " " + intensity + " " + theColor+ " " + theColor_rgb);
                updateLineAndCircle();
                break;
            }
        }
    });
}


function updateLineAndCircle() {
    const svg = d3.select('#tfContainer').select('svg').select('g');

    const width = 500;
    const height = width / 2;
    const margin = {top: 10, right: 30, bottom: 40, left: 40};
    const adjWidth = width - margin.left - margin.right;
    const adjHeight = height - margin.top - margin.bottom;
    svg.selectAll("saved-line").remove();
    svg.selectAll("saved-circle").remove();
    for (let i = 0; i <density_arr.length; i++) {
        if (density_arr[i] === -1) {
            continue;
        }
        const newX = density_arr[i] * adjWidth;
        const newY = (intensity_arr[i] -1)  *-1* adjHeight;

        svg.insert("line", ":first-child")
            .attr("x1", newX)
            .attr("x2", newX)
            .attr("y1", newY)
            .attr("y2", adjHeight)
            .attr("class", "saved-line")
            .style("stroke", color_arr[i][0])
            .style("stroke-width", "2px")


        svg.insert("circle", ":first-child")
            .attr("cx", newX)
            .attr("cy", newY)
            .attr("r", 10)
            .attr("class", "saved-circle")
            .style("fill", color_arr[i][0])
            .style("stroke-width", "2px")
    }
}
