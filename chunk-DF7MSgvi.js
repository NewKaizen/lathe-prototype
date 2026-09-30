import {s as s$1,p as n,q as a,u as g,v as o$1,w as n$1,x as t,y as i,z as n$2}from'./chunk-BRQIevcV.js';import'./main-PYH4CLGD.js';var o="gaussianSplattingPixelShader",d=`#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
#ifdef GPUPICKER_DEPTH
layout(location=0) out highp vec4 glFragData[2];
#endif
#ifdef GPUPICKER_PACK_DEPTH
#include<packingFunctions>
#endif
varying vec4 vColor;varying vec2 vPosition;
#define CUSTOM_FRAGMENT_DEFINITIONS
#include<gaussianSplattingFragmentDeclaration>
void main () {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
vec4 finalColor=gaussianColor(vColor);
#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR
#ifdef GPUPICKER_DEPTH
glFragData[0]=finalColor;
#ifdef GPUPICKER_PACK_DEPTH
glFragData[1]=pack(gl_FragCoord.z);
#else
glFragData[1]=vec4(gl_FragCoord.z,0.0,0.0,1.0);
#endif
#else
gl_FragColor=finalColor;
#endif
#define CUSTOM_FRAGMENT_MAIN_END
}
`;s$1.ShadersStore[o]||(s$1.ShadersStore[o]=d);var m=[n,a,g,o$1,n$1,t,i,n$2];for(let e of m)s$1.IncludesShadersStore[e.name]||(s$1.IncludesShadersStore[e.name]=e.shader);var E={name:o,shader:d};export{E as gaussianSplattingPixelShader};