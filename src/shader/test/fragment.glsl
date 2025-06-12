#include <common>

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vPosition;

uniform float uAlpha;
uniform vec2 uResolution;
uniform sampler2D uSceneFBO;

void main() {
    vec2 screenUV = gl_FragCoord.xy / uResolution;

    vec4 color = texture2D(uSceneFBO, screenUV);

    float iorRatio = 1.0 / 1.31;

    // eye vector
    vec3 viewVector = normalize(cameraPosition - vWorldPosition);

    // refracted vector
    vec3 refractedVector = refract(viewVector, vWorldNormal, iorRatio);

    vec3 refractedRayExit = vWorldPosition + refractedVector * 0.03;

    vec4 ndcPos = projectionMatrix * viewMatrix * vec4(refractedRayExit, 1.0);
    vec2 refractionCoords = ndcPos.xy / ndcPos.w;
    refractionCoords = (refractionCoords + 1.0) / 2.0;
    refractionCoords.y = 1.0 - refractionCoords.y;

    vec2 refractedUV = screenUV + refractedVector.xy * 0.03;

    color = texture2D(uSceneFBO, refractedUV);
    color = texture2D(uSceneFBO, refractionCoords);
    
    // color.rg = refractionCoords;
    // color.b = 0.;

    gl_FragColor = vec4(color.rgb, 1.);

    // gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

    gl_FragColor = linearToOutputTexel(gl_FragColor);

}
