import {s as s$1,e as r$1,t}from'./chunk-CcDaKoGx.js';import'./main-DHVCN5OT.js';var r="volumetricLightingRenderVolumeVertexShader",s=`#include<sceneUboDeclaration>
#include<meshUboDeclaration>
attribute position : vec3f;varying vWorldPos: vec4f;@vertex
fn main(input : VertexInputs)->FragmentInputs {let worldPos=mesh.world*vec4f(vertexInputs.position,1.0);vertexOutputs.vWorldPos=worldPos;vertexOutputs.position=scene.viewProjection*worldPos;}
`;s$1.ShadersStoreWGSL[r]||(s$1.ShadersStoreWGSL[r]=s);var i=[r$1,t];for(let o of i)s$1.IncludesShadersStoreWGSL[o.name]||(s$1.IncludesShadersStoreWGSL[o.name]=o.shader);var l={name:r,shader:s};export{l as volumetricLightingRenderVolumeVertexShaderWGSL};