const mainShader = `#version 300 es
#if __VERSION__ < 130
#define TEXTURE2D texture2D
#else
#define TEXTURE2D texture
#endif
precision highp float;
out vec4 fragColor;

uniform vec3 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_frame;
uniform sampler2D iChannel0;

#define R           u_resolution
#define T           u_time
#define M           u_mouse

#define MIN 0.1
#define MAX 0.95

vec4 tx(in vec2 p){ return texture(iChannel0, p); }

float getGradient(vec2 uv) {return (MAX - tx(uv).y) / (MAX - MIN);}
float getOff(vec2 uv) {return (MAX - tx(uv).x) / (MAX - MIN);}

//@iq
vec3 hue(float t){ 
    const vec3 c = vec3(2,1,0);
    return .5 + .45*cos(4.*t*(c+vec3(.075,.5,.95))); 
}

void main() {
  
  vec3 color=vec3(0);
	vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    if (u_frame < 3.) {
        color = vec3(0,0,0);
    } else {
        float v = getGradient(uv);
        float z = getOff(uv);
        v = smoothstep(.55,.9,v);
        float bv = smoothstep(.1,.5,min(v,z));
        color = vec3(v,v,v)*hue((z*.8)+uv.x*.2+(T*.08));
    }
    
    color = clamp(color,vec3(0),vec3(1));
    fragColor = vec4(color,1);
}`;

export default mainShader;
