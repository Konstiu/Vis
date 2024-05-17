

class FirstHitShader extends Shader {
    constructor() {
        super("firsthit_vert", "firsthit_frag");
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

        const gradient = volume.calcGradient();

        const gradient_texture = new THREE.Data3DTexture(gradient, volume.width, volume.height, volume.depth);
        gradient_texture.type = THREE.FloatType;
        gradient_texture.format = THREE.RGBAFormat;
        gradient_texture.minFilter = texture.magFilter = THREE.LinearFilter;
        gradient_texture.unpackAlignment = 4;
        gradient_texture.needsUpdate = true;
        this.setUniform("gradient", gradient_texture);

        this.setUniform("volume", texture);
        this.setUniform("volume_dims", new THREE.Vector3(volume.width, volume.height, volume.depth));
        this.setUniform("iso_value", 0.3);
        this.setUniform("color", new THREE.Vector4(1, 1, 1));
    }

    /**
     * Sets the resolution of the rendering
     * @param steps > 1
     */
    setSteps(steps) {
        this.setUniform("steps", steps);
    }

    setIsoVal(density) {
        this.setUniform("iso_value", density);
    }

    setColor(color){
        this.setUniform("color", color);
    }
}