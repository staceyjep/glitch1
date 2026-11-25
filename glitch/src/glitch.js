export const GlitchShader = {
  uniforms: {
    tDiffuse: { value: null },   // the rendered frame, filled in by ShaderPass
    uTime: { value: 0 }
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      gl_FragColor = texture2D(tDiffuse, vUv); // pass-through; glitch goes here next
    }
  `
};