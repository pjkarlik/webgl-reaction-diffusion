const passstwoShader =`#version 300 es
#if __VERSION__ < 130
#define TEXTURE2D texture2D
#else
#define TEXTURE2D texture
#endif
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

#define TIMESTEP 1.01

#define F u_gui.x
#define K u_gui.y
#define Da u_gui.z
#define Db u_gui.w

float random (in vec2 p) {return fract(sin(dot(p.xy, vec2(22.9898,78.233)))*43758.5453123);}
mat2 rot (float a) { return mat2(cos(a),sin(a),-sin(a),cos(a)); }
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
  
void main()
{
    vec2 uv = gl_FragCoord.xy /  max(u_resolution.x,u_resolution.y);
    vec2 vuv = (2.*gl_FragCoord.xy-u_resolution.xy) / max(u_resolution.x,u_resolution.y);
    vec3 colour = vec3(0);

    if (u_frame < 2.) {
         colour = vec3(random((uv)));
    } else {

        vec2 val, laplacian;
        formula(gl_FragCoord.xy+vec2(.0), val, laplacian);

        vec2 delta;
        delta.x = Da * laplacian.x - val.x * val.y * val.y + F * (1.01 - val.x);
        delta.y = Db * laplacian.y + val.x * val.y * val.y - (K + F) * val.y;

        colour = vec3(val + delta * TIMESTEP, .0);
    }

     float px = fwidth(uv.x);
        float fx = .3+.1*sin(T*3.3);
     if (u_mouse.z > 0.) {
       
        vec2 mv = u_mouse.xy/ max(u_resolution.x,u_resolution.y);
        float finger = length(mv-uv)-(fx*.25);
        finger=smoothstep(px,-px,finger);
        colour.xy = mix(colour.xy, vec2(.75),finger);

     } else {
       
        vec2 mv = vec2(.6*sin(T*.43),.6*cos(T*1.21));

        float finger = length(vuv-mv)-(fx*fx);
        finger=smoothstep(px,-px,finger);
    	  colour.xy = mix(colour.xy, vec2(.75),finger);
       
     }

    fragColor = vec4(colour,1.);
}
`;

export default passstwoShader;
