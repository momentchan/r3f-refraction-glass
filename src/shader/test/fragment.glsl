varying vec2 vUv;
uniform float uAlpha;
uniform vec2 uResolution;
uniform sampler2D uSceneFBO;

void main() {
    vec2 screenUV = gl_FragCoord.xy / uResolution;

    vec4 color = texture2D(uSceneFBO, screenUV);
    // color.rg = screenUV;
    // color.b = 0.;
    gl_FragColor = vec4(color.rgb, 1.);
}
