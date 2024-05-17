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


    calcGradient() {
        let gradient = [];
        for (let z = 0; z < this.depth; z++) {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    let gx = 0.0;
                    let gy = 0.0;
                    let gz = 0.0;
                    if (x > 0 && x < this.width - 1) {
                        gx = this.voxels[x + 1 + y * this.width + z * this.slice] - this.voxels[x - 1 + y * this.width + z * this.slice];
                    }
                    if (y > 0 && y < this.height - 1) {
                        gy = this.voxels[x + (y + 1) * this.width + z * this.slice] - this.voxels[x + (y - 1) * this.width + z * this.slice];
                    }
                    if (z > 0 && z < this.depth - 1) {
                        gz = this.voxels[x + y * this.width + (z + 1) * this.slice] - this.voxels[x + y * this.width + (z - 1) * this.slice];
                    }

                    let factor = 1.0;

                    gradient.push(gx * factor);
                    gradient.push(gy * factor);
                    gradient.push(gz * factor);
                    gradient.push(1.0);

                    // let result = new THREE.Vector3(gx * 255.0, gy * 255.0, gz * 255.0);
                    // result = result *  (new THREE.Vector3(255.0));
                    // gradient.push(result);

                }
            }
        }

        return Float32Array.from(gradient);
    }
}