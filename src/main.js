import './style.css'

import * as twgl from "twgl.js";
import dat from "dat.gui";
import Mouse from "./mouse.js";

import vertexShader from "./shaders/vertexShader.js";
import mainShader from "./shaders/mainShader.js";
import passtwoShader from "./shaders/passtwoShader.js";

/**

F is the feed rate of A.
K is the kill rate of B.

Diffusion Coefficients (Da and Db):
These values are constants that determine the rate of diffusion for each chemical species. A higher diffusion coefficient means the substance diffuses faster.

*/


let then = 0;
let frameCount = 0;
let demo = 0;

const settings = {
  // main RD shader
  bF: 0.054, //0.0438
  bK: 0.064, //values low
  bDa: 1,
  bDb: 0.232,
  tone: 0.51,
  const: 1.1,
  clearFrameCount: function () {
    frameCount = 0;
  },
  demoMode: function () {
    if (demo == 0) {
      demo = 1;
    } else {
      demo = 0;
    }
  }
};

const gui = new dat.GUI();

const shaderB = gui.addFolder("Shader B");
shaderB.add(settings, "bF", 0.0, 0.15).step(0.0001).name("F");
shaderB.add(settings, "bK", 0.0, 0.15).step(0.0001).name("K");
shaderB.add(settings, "bDa", 0.0, 1.0).step(0.0001).name("Da");
shaderB.add(settings, "bDb", 0.0, 1.0).step(0.0001).name("Db");
shaderB.add(settings, "const", 0, 4).step(0.0001).name("Constrast");
shaderB.add(settings, "tone", 0.0, 1.0).step(0.0001).name("Hue");
gui.add(settings, "clearFrameCount").name("Clear Screen");
gui.add(settings, "demoMode").name("Demo Mode");
shaderB.close();

let viewWidth = window.innerWidth;
let viewHeight = window.innerHeight;

const glcanvas = document.getElementById("canvas");
const gl = glcanvas.getContext("webgl2");

// Resize the canvas to match
glcanvas.width = viewWidth;
glcanvas.height = viewHeight;

const mouse = new Mouse(glcanvas);
let umouse = [gl.canvas.width / 2, gl.canvas.height / 2, 0, 0];
let tmouse = umouse;

// --- Compile Shaders ---
const simInfoA = twgl.createProgramInfo(gl, [vertexShader, passtwoShader]);
const simInfoB = twgl.createProgramInfo(gl, [vertexShader, passtwoShader]);
const displayInfo = twgl.createProgramInfo(gl, [vertexShader, mainShader]);

const arrays = {
  position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
  texcoord: { numComponents: 2, data: [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1] }
};
const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
const fbufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

// Ping-pong buffers
const attachments = [
  {
    format: gl.RGBA,
    type: gl.UNSIGNED_BYTE,
    min: gl.LINEAR,
    wrap: [gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE]
  }
];

let fbA = twgl.createFramebufferInfo(gl, attachments, viewWidth, viewHeight);
let fbB = twgl.createFramebufferInfo(gl, attachments, viewWidth, viewHeight);
let readBuffer = fbA;
let writeBuffer = fbB;

twgl.resizeCanvasToDisplaySize(gl.canvas);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

// Handle resize
window.addEventListener("resize", () => {
  viewWidth = window.innerWidth;
  viewHeight = window.innerHeight;

  glcanvas.width = viewWidth;
  glcanvas.height = viewHeight;

  twgl.resizeFramebufferInfo(gl, fbA, attachments, viewWidth, viewHeight);
  twgl.resizeFramebufferInfo(gl, fbB, attachments, viewWidth, viewHeight);

  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
});

function render(time) {
  time *= 0.001;
  const deltaTime = time - then;
  then = time;

  // --- PASS 1: Simulation ---
  twgl.bindFramebufferInfo(gl, writeBuffer);

  const factor = 0.15;
  umouse = [mouse.x, mouse.y, 0];
  tmouse[0] = tmouse[0] - (tmouse[0] - umouse[0]) * factor;
  tmouse[1] = tmouse[1] - (tmouse[1] - umouse[1]) * factor;
  tmouse[2] = mouse.drag ? 1 : -1;

 const simUniforms = {
    u_resolution: [viewWidth, viewHeight],
    iChannel0: readBuffer.attachments[0], // previous state
    u_time: time * 0.5,
    u_frame: frameCount,
    u_mouse: tmouse,
    u_demo: demo,
    u_gui: [settings.bF, settings.bK, settings.bDa, settings.bDb],
    iDate: [0, 0, 0, time] // simple fallback
  };


  // Alternate Shader A / Shader B
  const simProgram = frameCount % 2 === 0 ? simInfoA : simInfoB;
  const simGUI = frameCount % 2 === 0 ? [settings.aF, settings.aK, settings.aDa, settings.aDb] : [settings.bF, settings.bK, settings.bDa, settings.bDb];
  gl.useProgram(simProgram.program);
  twgl.setBuffersAndAttributes(gl, simProgram, bufferInfo);
  twgl.setUniforms(simProgram, simUniforms);
  twgl.drawBufferInfo(gl, bufferInfo);

  // --- Swap buffers ---
  [readBuffer, writeBuffer] = [writeBuffer, readBuffer];

  // --- PASS 2: Display ---
  twgl.bindFramebufferInfo(gl, null);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const displayUniforms = {
    u_resolution: [viewWidth, viewHeight],
    iChannel0: readBuffer.attachments[0], // latest sim state
    u_time: time * 0.5,
    u_mouse: tmouse,
    u_tone: settings.tone,
    u_const: settings.const,
    u_frame: frameCount
  };

  gl.useProgram(displayInfo.program);
  twgl.setBuffersAndAttributes(gl, displayInfo, fbufferInfo);
  twgl.setUniforms(displayInfo, displayUniforms);
  twgl.drawBufferInfo(gl, fbufferInfo);

  frameCount++;
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
