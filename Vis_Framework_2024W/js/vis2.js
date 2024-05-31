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

let cursor_x;
let cursor_y;


let isoValues = [0.5, -1, -1]; // Example iso-values
let surfaceColors = [new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1)];
let opacities = [1.0, -1, -1]; // Example opacities

let layerIndex = 0;

let theColorRgb = new THREE.Vector3(255, 255, 255);


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
    buttonPressDelete();


    firstHitShader.setUniform("iso_values", isoValues);
    firstHitShader.setUniform("surface_colors", surfaceColors, "v3v");
    firstHitShader.setUniform("opacities", opacities);


    // color changing
    var colorInput = document.getElementById("surfaceColor");

    colorInput.addEventListener("input", function () {
        let theColor = colorInput.value;

        theColorRgb = hexToRgb(theColor);

        //firstHitShader.setSurfaceColor(new THREE.Vector3(theColorRgb.r/255, theColorRgb.g/255, theColorRgb.b/255));
        surfaceColors[layerIndex] = new THREE.Vector3(theColorRgb.x / 255.0, theColorRgb.y / 255.0, theColorRgb.z / 255.0)
        firstHitShader.setUniform("surface_colors", surfaceColors, "v3v");

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
    const r = ((bigint >> 16) & 255);
    const g = ((bigint >> 8) & 255);
    const b = (bigint & 255);

    return new THREE.Vector3(r, g, b);
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
            .attr("x1", (adjWidth / 2))
            .attr("x2", (adjWidth / 2))
            .attr("y1", 0)
            .attr("y2", adjHeight)
            .style("stroke", "white")
            .style("stroke-width", "2px")
            .style("cursor", "pointer");


        const ball = svg.append("circle")
            .attr("cx", (adjWidth / 2))
            .attr("cy", 0)
            .attr("r", 10)
            .style("fill", "white")
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


                cursor_x = line.node().getAttribute("x1") / adjWidth;
                cursor_y = line.node().getAttribute("y1") / (adjHeight) * -1 + 1;
                if (layerIndex !== 3) {
                    isoValues[layerIndex] = cursor_x;
                    opacities[layerIndex] = cursor_y;
                    firstHitShader.setUniform("iso_values", isoValues);
                    firstHitShader.setUniform("opacities", opacities);
                    paint();
                }
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
        if (layerIndex === 3) {
            return;
        }
        updateValuesIfNeed();
        layerIndex++;
        document.getElementById('surfaceColor').value = '#ffffff';
        updateLineAndCircle();
    });
}

function buttonPressDelete() {
    document.getElementById('deleteButton').addEventListener("click", function () {
        if (layerIndex <= 0) {
            return;
        }
        layerIndex--;
        for (let i = layerIndex; i < 3; i++) {
            isoValues[i] = -1;
            opacities[i] = -1;
            surfaceColors[i] = new THREE.Vector3(1, 1, 1);
        }
        document.getElementById('surfaceColor').value = '#ffffff';
        updateLineAndCircle();
    })
}

function updateLineAndCircle() {
    const svg = d3.select('#tfContainer').select('svg').select('g');

    const width = 500;
    const height = width / 2;
    const margin = {top: 10, right: 30, bottom: 40, left: 40};
    const adjWidth = width - margin.left - margin.right;
    const adjHeight = height - margin.top - margin.bottom;
    svg.selectAll(".saved-line").remove();
    svg.selectAll(".saved-circle").remove();
    for (let i = 0; i < layerIndex; i++) {
        const newX = isoValues[i] * adjWidth;
        const newY = (opacities[i] - 1) * -1 * adjHeight;

        svg.insert("line", ":first-child")
            .attr("x1", newX)
            .attr("x2", newX)
            .attr("y1", newY)
            .attr("y2", adjHeight)
            .attr("class", "saved-line")
            .style("stroke", "rgb(" + surfaceColors[i].x * 255 + ", " + surfaceColors[i].y * 255 + ", " + surfaceColors[i].z * 255 + ")")
            .style("stroke-width", "2px")


        svg.insert("circle", ":first-child")
            .attr("cx", newX)
            .attr("cy", newY)
            .attr("r", 10)
            .attr("class", "saved-circle")
            .style("fill", "rgb(" + surfaceColors[i].x * 255 + ", " + surfaceColors[i].y * 255 + ", " + surfaceColors[i].z * 255 + ")")
            .style("stroke-width", "2px")
    }
}

function updateValuesIfNeed() {
    if (isoValues[layerIndex] === -1) {
        isoValues[layerIndex] = cursor_x;
        firstHitShader.setUniform("iso_values", isoValues);
        opacities[layerIndex] = cursor_y;
        firstHitShader.setUniform("opacities", opacities);
    }
    paint();
}
