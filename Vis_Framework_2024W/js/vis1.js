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
let mipShader = null;

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

    mipShader = new MipShader();
}

/**
 * Handles the file reader. No need to change anything here.
 */
function readFile() {
    let reader = new FileReader();
    reader.onloadend = function () {
        console.log("data loaded: ");

        let data = new Uint16Array(reader.result);
        volume = new Volume(data);
        generateHistogram(volume.voxels);
        mipShader.setVolume(volume);

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


    const cube = new THREE.BoxGeometry(volume.width, volume.height, volume.depth);

    const material = mipShader.material;
    await mipShader.load(); // this function needs to be called explicitly, and only works within an async function!
    const mesh = new THREE.Mesh(cube, material);
    scene.add(mesh);

    // our camera orbits around an object centered at (0,0,0)
    orbitCamera = new OrbitCamera(camera, new THREE.Vector3(0, 0, 0), 2 * volume.max, renderer.domElement);

    console.log(camera.position);


    // init paint loop
    requestAnimationFrame(paint);
}

/**
 * Render the scene and update all necessary shader information.
 */
function paint() {
    if (volume) {
        mipShader.setUniform("cameraPos", camera.position);

        renderer.render(scene, camera);
    }
}


/**
 * Draws the corresponding histogram in the div histogram
 * @param voxels the float array to be updated.
 */
function generateHistogram(voxels) {
    const container = d3.select("#histogram");

    const margin = {top: 10, right: 10, bottom: 0, left: 30},
        width = 600 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleLinear()
        .domain([0, 1])
        .range([0, width]);

    const histogram = d3.histogram()
        .value(d => d)
        .domain(x.domain())
        .thresholds(x.ticks(100));

    const bins = histogram(voxels);
    const maxCount = d3.max(bins, d => d.length);

    const normalize = bins.map(b => ({
        ...b,
        length: b.length / maxCount
    }));

    const y = d3.scaleLinear()
        .domain([0, 1])
        .range([height / 2, 0]);

    const bars = svg.selectAll("rect")
        .data(normalize);

    svg.append("g")
        .attr("transform", "translate(0," + (height / 2) + ")")
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", "translate(0," + 0 + ")")
        .call(d3.axisLeft(y));

    svg.selectAll("rect")
        .data(normalize)
        .enter()
        .append("rect")
        .attr("x", d => x(d.x0) + 1)
        .attr("y", height / 2)
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("height", d => ((height / 2) - y(d.length)))
        .style("fill", "#ffffff")
        .style("opacity", 0.5);
}
