

class MipShader extends Shader {
    constructor() {
        super("mip_vert", "mip_frag");
    }

    setVolume(volume) {
        const texture = new THREE.Data3DTexture(volume.voxels, volume.width, volume.height, volume.depth);
        texture.format = THREE.RedFormat;
        texture.type = THREE.FloatType;
        texture.minFilter = texture.magFilter = THREE.LinearFilter;
        texture.unpackAlignment = 1;
        texture.needsUpdate = true;

        this.setUniform("volume", texture);
        this.setUniform("volume_dims", new THREE.Vector3(volume.width, volume.height, volume.depth));
        this.setUniform("volume_scale", new THREE.Vector3(volume.width/volume.max, volume.height/volume.max, volume.depth/volume.max));


    }
}