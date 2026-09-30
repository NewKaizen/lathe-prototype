import {s as s$1,a as a$1,n,g,r,o,b as a$2,c as a$3,d as n$1}from'./chunk-BRQIevcV.js';import'./main-PYH4CLGD.js';var a="gaussianSplattingPixelShader",s=`#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
#ifdef GPUPICKER_PACK_DEPTH
#include<packingFunctions>
#endif
varying vColor: vec4f;varying vPosition: vec2f;
#define CUSTOM_FRAGMENT_DEFINITIONS
#include<gaussianSplattingFragmentDeclaration>
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
var finalColor: vec4f=gaussianColor(input.vColor,input.vPosition);
#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR
#ifdef GPUPICKER_DEPTH
fragmentOutputs.fragData0=finalColor;
#ifdef GPUPICKER_PACK_DEPTH
fragmentOutputs.fragData1=pack(fragmentInputs.position.z);
#else
fragmentOutputs.fragData1=vec4f(fragmentInputs.position.z,0.0,0.0,1.0);
#endif
#else
fragmentOutputs.color=finalColor;
#endif
#define CUSTOM_FRAGMENT_MAIN_END
}
`;s$1.ShadersStoreWGSL[a]||(s$1.ShadersStoreWGSL[a]=s);var c=[a$1,n,g,r,o,a$2,a$3,n$1];for(let e of c)s$1.IncludesShadersStoreWGSL[e.name]||(s$1.IncludesShadersStoreWGSL[e.name]=e.shader);var _={name:a,shader:s};export{_ as gaussianSplattingPixelShaderWGSL};