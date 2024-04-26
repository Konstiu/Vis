

class MipShader extends Shader {
    constructor(color) {
        super("mip_vert", "mip_frag");
        this.setUniform("color",
                new  THREE.Vector4(color[0], color[1], color[2], color[3]),
            "vec4");
    }
}