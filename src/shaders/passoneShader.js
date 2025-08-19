const passoneShader =`#version 300 es
precision highp float;
out vec4 fragColor;

// our basic uniforms
uniform vec4 u_mouse;
uniform vec4 u_gui;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_frame;
uniform sampler2D iChannel0;
  
#define R           u_resolution
#define T           u_time
#define M           u_mouse

#define TIMESTEP 1.

#define F u_gui.x
#define K u_gui.y
#define Da u_gui.z
#define Db u_gui.w

vec4 tx(in vec2 p){ return texture(iChannel0, p); }

void formula(in vec2 p, out vec2 val, out vec2 laplacian){
    vec3 e = vec3(1, 0, -1);
    vec2 px = 1./u_resolution.xy;
    val = tx(p*px).xy;

    laplacian  = tx((p + e.xy)*px ).xy * .2;
    laplacian += tx((p + e.yx)*px ).xy * .2;
    laplacian += tx((p + e.yz)*px ).xy * .2;
    laplacian += tx((p + e.zy)*px ).xy * .2;
    
    laplacian += tx((p + e.xx)*px ).xy * .05;
    laplacian += tx((p + e.xz)*px ).xy * .05;
    laplacian += tx((p + e.zx)*px ).xy * .05;
    laplacian += tx((p + e.zz)*px ).xy * .05;

    laplacian += -.9975 * val;   
}
  
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec3 colour = vec3(0);
    
    if (u_frame < 2.) {
        colour = vec3(.0);
    } else {
        vec2 val, laplacian, delta;
        formula(gl_FragCoord.xy+vec2(0,0), val, laplacian);

        delta.x = Da * laplacian.x - val.x * val.y * val.y + F * (1.01 - val.x);
        delta.y = Db * laplacian.y + val.x * val.y * val.y - (K + F) * val.y;

        colour = vec3(val + delta * TIMESTEP, .0);
    }

    fragColor = vec4(colour,1.);
}
`;

export default passoneShader;
