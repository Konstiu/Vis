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
 * Volume class handling simple volume.dat files. Loads the volumes as float arrays.
 *
 * @author Manuela Waldner
 * @author Diana Schalko
 */
class Volume {
    constructor(uint16Array) {
        this.width = uint16Array[0];
        this.height = uint16Array[1];
        this.depth = uint16Array[2];
        this.slice = this.width * this.height;
        this.size = this.slice * this.depth;
        this.max = Math.max(this.width, this.height, this.depth);
        this.scale = new THREE.Vector3(this.width, this.height, this.depth);

        let floatArray = [];
        uint16Array.slice(3).forEach(function(voxel){
            floatArray.push(voxel / 4095.0);
        });
        this.voxels = Float32Array.from(floatArray);

        console.log(this.voxels.length + " voxels loaded - ["
            + this.width + ", " + this.height + ", " + this.depth + "], max: " + this.max);
    }

    getIndex(x, y, z){
        return x + this.width * (y + this.height * z);
    }

    calcGradient2() {
        let gradientX = new Float32Array(this.size);
        let gradientY = new Float32Array(this.size);
        let gradientZ = new Float32Array(this.size);


        for (let z = 0; z < this.depth; z++) {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    let index = this.getIndex(x, y, z);

                    // Gradient in the x direction
                    if (x > 0 && x < this.width - 1) {
                        gradientX[index] = (this.voxels[this.getIndex(x + 1, y, z)] - this.voxels[this.getIndex(x - 1, y, z)]) / 2.0;
                    } else if (x === 0) {
                        gradientX[index] = this.voxels[this.getIndex(x + 1, y, z)] - this.voxels[index];
                    } else {
                        gradientX[index] = this.voxels[index] - this.voxels[this.getIndex(x - 1, y, z)];
                    }

                    // Gradient in the y direction
                    if (y > 0 && y < this.height - 1) {
                        gradientY[index] = (this.voxels[this.getIndex(x, y + 1, z)] - this.voxels[this.getIndex(x, y - 1, z)]) / 2.0;
                    } else if (y === 0) {
                        gradientY[index] = this.voxels[this.getIndex(x, y + 1, z)] - this.voxels[index];
                    } else {
                        gradientY[index] = this.voxels[index] - this.voxels[this.getIndex(x, y - 1, z)];
                    }

                    // Gradient in the z direction
                    if (z > 0 && z < this.depth - 1) {
                        gradientZ[index] = (this.voxels[this.getIndex(x, y, z + 1)] - this.voxels[this.getIndex(x, y, z - 1)]) / 2.0;
                    } else if (z === 0) {
                        gradientZ[index] = this.voxels[this.getIndex(x, y, z + 1)] - this.voxels[index];
                    } else {
                        gradientZ[index] = this.voxels[index] - this.voxels[this.getIndex(x, y, z - 1)];
                    }
                }
            }
        }

        const flattened = new Float32Array(this.size * 3);

        for (let i = 0; i < this.size; i++) {
            flattened[i] = gradientX[i] * 255.0;
            flattened[i + this.size] = gradientY[i] * 255.0;
            flattened[i + 2 * this.size] = gradientZ[i] * 255.0;
        }

        console.log(flattened.length);
        console.log(this.voxels.length)

        return flattened;
    }

    calcGradient() {
        const gradient = new Float32Array(this.width * this.height * this.depth * 4);
        const factor = 0.5;
        const { voxels, width, height, depth } = this;

        let idx = 0;
        for (let z = 0; z < depth; z++) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let gx = 0.0, gy = 0.0, gz = 0.0;

                    if (x > 0 && x < width - 1) {
                        gx = (voxels[this.getIndex(x + 1, y, z)] - voxels[this.getIndex(x - 1, y, z)]) * factor;
                    }
                    if (y > 0 && y < height - 1) {
                        gy = (voxels[this.getIndex(x, y + 1, z)] - voxels[this.getIndex(x, y - 1, z)]) * factor;
                    }
                    if (z > 0 && z < depth - 1) {
                        gz = (voxels[this.getIndex(x, y, z + 1)] - voxels[this.getIndex(x, y, z - 1)]) * factor;
                    }

                    gradient[idx++] = gx;
                    gradient[idx++] = gy;
                    gradient[idx++] = gz;
                    gradient[idx++] = 1.0;
                }
            }
        }

        return gradient;
    }

}