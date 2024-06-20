uniform sampler2D uTexture;
uniform vec3 uColor;

void main() {

// * use texture
    // vec4 textureColor = texture(uTexture, gl_PointCoord);
    //? we only need 1 channel R,G or B to set the color
    float textureAlpha = texture(uTexture, gl_PointCoord).r;

// Final color
// ? we cannot use the uv attribute cause it is inside the particle we'll use 'gl_PointCoord'
    gl_FragColor = vec4(uColor, textureAlpha);
    // gl_FragColor = vec4(gl_PointCoord, 1.0, 1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}