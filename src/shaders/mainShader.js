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
uniform float u_tone;
uniform float u_const;
uniform sampler2D iChannel0;

#define R           u_resolution
#define T           u_time
#define M           u_mouse

#define MIN 0.1
#define MAX 0.95

vec4 tx(in vec2 p){ return texture(iChannel0, p); }

float getGradient(vec2 uv) {return (MAX - tx(uv).y) / (MAX - MIN);}
float getOff(vec2 uv) {return (MAX - tx(uv).x) / (MAX - MIN);}


//@iq of hsv2rgb
vec3 hsv( in vec3 c ) {
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
	return c.z * mix( vec3(1.0), rgb, c.y);
}
  
void main() {
  
  vec3 color=vec3(0);
	vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    if (u_frame < 3.) {
        color = vec3(0,0,0);
    } else {
        float v = getGradient(uv);
        float z = getOff(uv);
        float px = fwidth(uv.x);
        v = smoothstep(u_const-px,-px,v);
        color = vec3(v,v,v)*hsv(vec3((z*1.1)+u_tone,.9,.4));
    }
    
    color = pow(color,vec3(.4545));
    fragColor = vec4(color,1);
}`;

export default mainShader;
