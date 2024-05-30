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
let density_and_intensity_values = [[-1.0, -1.0, theColor], [-1.0, -1.0, theColor], [-1.0, -1.0, theColor], [-1.0, -1.0, theColor], [-1.0, -1.0, theColor]];

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
    list();
    addEventListeners();
    updateDisplay();
    // color changing
    var colorInput = document.getElementById("surfaceColor");

    colorInput.addEventListener("input", function () {
        theColor = colorInput.value;
        let rgb = hexToRgb(theColor);
        firstHitShader.setSurfaceColor(new THREE.Vector3(rgb.r / 255, rgb.g / 255, rgb.b / 255));
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
            .attr("x1", (adjWidth / 2))
            .attr("x2", (adjWidth / 2))
            .attr("y1", 0)
            .attr("y2", adjHeight)
            .style("stroke", "#ffffff")
            .style("stroke-width", "2px")
            .style("cursor", "pointer");


        const ball = svg.append("circle")
            .attr("cx", (adjWidth / 2))
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
        for (let i = 0; i < density_and_intensity_values.length; i++) {
            if (density_and_intensity_values[i][0] === -1) {
                density_and_intensity_values[i][0] = density;
                density_and_intensity_values[i][1] = intensity;
                density_and_intensity_values[i][2] = theColor;
                updateDisplay();
                break;
            }
        }
    });
}

/*function saveValues() {
    var svg = d3.select("#arrayStrContainer");

// Bind data to text elements, create new text elements as needed
    var text = svg.selectAll('text')
        .data(density_and_intensity_values);
    text.enter()
        .append('text')
        .merge(text)
        .attr("dy", "2em")  // Adjust for vertical alignment of text
        .attr("fill", "#000")  // Set text color
        .text(function (d, i) {
            // Display the value only if it is not -1
            return d[0] === -1 ? (i+1) + ". no value selected" : (i+1) + ". density: " + Math.round(d[0]*100)/100 + ", intensity: " + Math.round(d[1]*100)/100 + ", color:" + d[2];

        })
        .on('click', function(event, d, i) {
            console.log("Vor der Änderung:", d);

            // Ändern eines Wertes im Array direkt
            if (d[0] !== -1) {
                // Beispiel: Setzen des ersten Werts auf einen neuen Wert
                d[0] = -1;
                d[1] = -1;
                d[2] = "#ffffff"// Ändert den ersten Wert des Arrays zu einem zufälligen Wert
                // Aufrufen einer Funktion zur Aktualisierung der Anzeige, falls notwendig
                updateDisplay(svg);
            }

            console.log("Nach der Änderung:", d);
        });

    console.log('Textelement "Test-1" hinzugefügt');
}*/

function updateDisplay() {
    var containers = document.querySelectorAll('.button-text-container .text');
    containers.forEach(function (span, index) {
        if (density_and_intensity_values[index][0] !== -1) {
            span.textContent = "Density: " + Math.round(density_and_intensity_values[index][0] * 100) / 100 +
                ", Intensity: " + Math.round(density_and_intensity_values[index][1] * 100) / 100 +
                ", Color: " + density_and_intensity_values[index][2];
        } else {
            span.textContent = (index + 1) + ". no value selected";
        }
    });
}


function list() {
    document.addEventListener("DOMContentLoaded", function () {
        addEventListeners();
        updateDisplay();
        var containers = document.querySelectorAll('.button-text-container .text');
        containers.forEach(function (span, index) {
            span.textContent = Math.round(density_and_intensity_values[index][0] * 100) / 100 + ", intensity: " + Math.round(density_and_intensity_values[index][1] * 100) / 100 + ", color:" + density_and_intensity_values[index][2]; // Dynamischer Text
        });
    });
}

function addEventListeners() {
    const containers = document.querySelectorAll('.button-text-container');
    containers.forEach((container, index) => {
        const button = container.querySelector('button');
        button.addEventListener('click', function() {
            // Setze die Werte auf Default für diesen spezifischen Index
            density_and_intensity_values[index][0] = -1;
            density_and_intensity_values[index][1] = -1;
            density_and_intensity_values[index][2] = "#ffffff"; // Setze die Farbe zurück auf Weiß oder einen anderen Default-Wert
            updateDisplay(container, index); // Aktualisiere nur diese spezifische Anzeige
        });
    });
}
