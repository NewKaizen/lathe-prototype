import {s as s$1,a,a6 as o$1,n,f as a$1,a7 as n$1,g,d as n$2,o as o$2,b as a$2}from'./chunk-BmCVHGrQ.js';import'./main-3TEPA7KO.js';var o="gpuRenderParticlesPixelShader",p=`var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;varying vUV: vec2f;varying vColor: vec4f;
#include<clipPlaneFragmentDeclaration>
#include<imageProcessingDeclaration>
#include<logDepthDeclaration>
#include<helperFunctions>
#include<imageProcessingFunctions>
#include<fogFragmentDeclaration>
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#include<clipPlaneFragment>
let textureColor: vec4f=textureSample(diffuseSampler,diffuseSamplerSampler,input.vUV);var baseColor: vec4f=textureColor*input.vColor;
#ifdef BLENDMULTIPLYMODE
let alpha: f32=input.vColor.a*textureColor.a;baseColor=vec4f(baseColor.rgb*alpha+vec3f(1.0)*(1.0-alpha),baseColor.a);
#endif
#include<logDepthFragment>
#include<fogFragment>(color,baseColor)
#ifdef IMAGEPROCESSINGPOSTPROCESS
baseColor=vec4f(toLinearSpaceVec3(baseColor.rgb),baseColor.a);
#else
#ifdef IMAGEPROCESSING
baseColor=vec4f(toLinearSpaceVec3(baseColor.rgb),baseColor.a);baseColor=applyImageProcessing(baseColor);
#endif
#endif
fragmentOutputs.color=baseColor;}
`;s$1.ShadersStoreWGSL[o]||(s$1.ShadersStoreWGSL[o]=p);var S=[a,o$1,n,a$1,n$1,g,n$2,o$2,a$2];for(let r of S)s$1.IncludesShadersStoreWGSL[r.name]||(s$1.IncludesShadersStoreWGSL[r.name]=r.shader);var F={name:o,shader:p};export{F as gpuRenderParticlesPixelShaderWGSL};