

class MipShader extends Shader {
    constructor() {
        super("mip_vert", "mip_frag");
        this.setSteps(200);
    }

    /**
     * Creates the 3D Texture and also sets all needed uniforms for rendering
     *
     * @param volume volume to render
     */
    setVolume(volume) {
        const texture = new THREE.Data3DTexture(volume.voxels, volume.width, volume.height, volume.depth);
        texture.format = THREE.RedFormat;
        texture.type = THREE.FloatType;
        texture.minFilter = texture.magFilter = THREE.LinearFilter;
        texture.unpackAlignment = 1;
        texture.needsUpdate = true;

        this.setUniform("volume", texture);
        this.setUniform("volume_dims", new THREE.Vector3(volume.width, volume.height, volume.depth));
    }

    /**
     * Sets the resolution of the rendering
     * @param steps > 1
     */
    setSteps(steps) {
        this.setUniform("steps", steps);
    }
}