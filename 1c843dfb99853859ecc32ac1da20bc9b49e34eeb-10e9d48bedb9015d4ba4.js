(self.webpackChunkexample=self.webpackChunkexample||[]).push([[78],{51262:function(e){e.exports=function(e,t){for(var r=-1,n=null==e?0:e.length;++r<n&&!1!==t(e[r],r,e););return e}},98086:function(e,t,r){var n=r(61872),o=r(34075),a=Object.prototype.hasOwnProperty;e.exports=function(e,t,r){var c=e[t];a.call(e,t)&&o(c,r)&&(void 0!==r||t in e)||n(e,t,r)}},23663:function(e,t,r){var n=r(48089),o=r(77856);e.exports=function(e,t){return e&&n(t,o(t),e)}},13538:function(e,t,r){var n=r(48089),o=r(65124);e.exports=function(e,t){return e&&n(t,o(t),e)}},32659:function(e,t,r){var n=r(35028),o=r(51262),a=r(98086),c=r(23663),u=r(13538),i=r(96780),l=r(57917),s=r(67039),f=r(43119),d=r(65167),p=r(5119),m=r(93355),b=r(26578),v=r(24014),y=r(18114),g=r(99362),j=r(70162),x=r(31530),h=r(32591),E=r(76086),w=r(77856),A=r(65124),O="[object Arguments]",S="[object Function]",Z="[object Object]",M={};M[O]=M["[object Array]"]=M["[object ArrayBuffer]"]=M["[object DataView]"]=M["[object Boolean]"]=M["[object Date]"]=M["[object Float32Array]"]=M["[object Float64Array]"]=M["[object Int8Array]"]=M["[object Int16Array]"]=M["[object Int32Array]"]=M["[object Map]"]=M["[object Number]"]=M[Z]=M["[object RegExp]"]=M["[object Set]"]=M["[object String]"]=M["[object Symbol]"]=M["[object Uint8Array]"]=M["[object Uint8ClampedArray]"]=M["[object Uint16Array]"]=M["[object Uint32Array]"]=!0,M["[object Error]"]=M[S]=M["[object WeakMap]"]=!1,e.exports=function e(t,r,I,U,C,F){var k,B=1&r,T=2&r,N=4&r;if(I&&(k=C?I(t,U,C,F):I(t)),void 0!==k)return k;if(!h(t))return t;var D=g(t);if(D){if(k=b(t),!B)return l(t,k)}else{var P=m(t),L=P==S||"[object GeneratorFunction]"==P;if(j(t))return i(t,B);if(P==Z||P==O||L&&!C){if(k=T||L?{}:y(t),!B)return T?f(t,u(k,t)):s(t,c(k,t))}else{if(!M[P])return C?t:{};k=v(t,P,B)}}F||(F=new n);var G=F.get(t);if(G)return G;F.set(t,k),E(t)?t.forEach((function(n){k.add(e(n,r,I,n,t,F))})):x(t)&&t.forEach((function(n,o){k.set(o,e(n,r,I,o,t,F))}));var R=D?void 0:(N?T?p:d:T?A:w)(t);return o(R||t,(function(n,o){R&&(n=t[o=n]),a(k,o,e(n,r,I,o,t,F))})),k}},73938:function(e,t,r){var n=r(32591),o=Object.create,a=function(){function e(){}return function(t){if(!n(t))return{};if(o)return o(t);e.prototype=t;var r=new e;return e.prototype=void 0,r}}();e.exports=a},561:function(e,t,r){var n=r(93355),o=r(58745);e.exports=function(e){return o(e)&&"[object Map]"==n(e)}},46923:function(e,t,r){var n=r(93355),o=r(58745);e.exports=function(e){return o(e)&&"[object Set]"==n(e)}},29060:function(e,t,r){var n=r(32591),o=r(31452),a=r(47749),c=Object.prototype.hasOwnProperty;e.exports=function(e){if(!n(e))return a(e);var t=o(e),r=[];for(var u in e)("constructor"!=u||!t&&c.call(e,u))&&r.push(u);return r}},51309:function(e,t,r){var n=r(7399);e.exports=function(e){var t=new e.constructor(e.byteLength);return new n(t).set(new n(e)),t}},96780:function(e,t,r){e=r.nmd(e);var n=r(31171),o=t&&!t.nodeType&&t,a=o&&e&&!e.nodeType&&e,c=a&&a.exports===o?n.Buffer:void 0,u=c?c.allocUnsafe:void 0;e.exports=function(e,t){if(t)return e.slice();var r=e.length,n=u?u(r):new e.constructor(r);return e.copy(n),n}},79137:function(e,t,r){var n=r(51309);e.exports=function(e,t){var r=t?n(e.buffer):e.buffer;return new e.constructor(r,e.byteOffset,e.byteLength)}},58151:function(e){var t=/\w*$/;e.exports=function(e){var r=new e.constructor(e.source,t.exec(e));return r.lastIndex=e.lastIndex,r}},96416:function(e,t,r){var n=r(1395),o=n?n.prototype:void 0,a=o?o.valueOf:void 0;e.exports=function(e){return a?Object(a.call(e)):{}}},87198:function(e,t,r){var n=r(51309);e.exports=function(e,t){var r=t?n(e.buffer):e.buffer;return new e.constructor(r,e.byteOffset,e.length)}},57917:function(e){e.exports=function(e,t){var r=-1,n=e.length;for(t||(t=Array(n));++r<n;)t[r]=e[r];return t}},48089:function(e,t,r){var n=r(98086),o=r(61872);e.exports=function(e,t,r,a){var c=!r;r||(r={});for(var u=-1,i=t.length;++u<i;){var l=t[u],s=a?a(r[l],e[l],l,r,e):void 0;void 0===s&&(s=e[l]),c?o(r,l,s):n(r,l,s)}return r}},67039:function(e,t,r){var n=r(48089),o=r(71558);e.exports=function(e,t){return n(e,o(e),t)}},43119:function(e,t,r){var n=r(48089),o=r(89540);e.exports=function(e,t){return n(e,o(e),t)}},5119:function(e,t,r){var n=r(57957),o=r(89540),a=r(65124);e.exports=function(e){return n(e,a,o)}},62527:function(e,t,r){var n=r(73829)(Object.getPrototypeOf,Object);e.exports=n},89540:function(e,t,r){var n=r(13849),o=r(62527),a=r(71558),c=r(47386),u=Object.getOwnPropertySymbols?function(e){for(var t=[];e;)n(t,a(e)),e=o(e);return t}:c;e.exports=u},26578:function(e){var t=Object.prototype.hasOwnProperty;e.exports=function(e){var r=e.length,n=new e.constructor(r);return r&&"string"==typeof e[0]&&t.call(e,"index")&&(n.index=e.index,n.input=e.input),n}},24014:function(e,t,r){var n=r(51309),o=r(79137),a=r(58151),c=r(96416),u=r(87198);e.exports=function(e,t,r){var i=e.constructor;switch(t){case"[object ArrayBuffer]":return n(e);case"[object Boolean]":case"[object Date]":return new i(+e);case"[object DataView]":return o(e,r);case"[object Float32Array]":case"[object Float64Array]":case"[object Int8Array]":case"[object Int16Array]":case"[object Int32Array]":case"[object Uint8Array]":case"[object Uint8ClampedArray]":case"[object Uint16Array]":case"[object Uint32Array]":return u(e,r);case"[object Map]":case"[object Set]":return new i;case"[object Number]":case"[object String]":return new i(e);case"[object RegExp]":return a(e);case"[object Symbol]":return c(e)}}},18114:function(e,t,r){var n=r(73938),o=r(62527),a=r(31452);e.exports=function(e){return"function"!=typeof e.constructor||a(e)?{}:n(o(e))}},47749:function(e){e.exports=function(e){var t=[];if(null!=e)for(var r in Object(e))t.push(r);return t}},12985:function(e,t,r){var n=r(32659);e.exports=function(e){return n(e,4)}},31530:function(e,t,r){var n=r(561),o=r(9369),a=r(44816),c=a&&a.isMap,u=c?o(c):n;e.exports=u},76086:function(e,t,r){var n=r(46923),o=r(9369),a=r(44816),c=a&&a.isSet,u=c?o(c):n;e.exports=u},65124:function(e,t,r){var n=r(82602),o=r(29060),a=r(86351);e.exports=function(e){return a(e)?n(e,!0):o(e)}},63988:function(e,t,r){"use strict";r.d(t,{Z:function(){return c}});var n=r(47077),o=r(27378),a=["title","children"],c=function(e){var t=e.title,r=e.children,c=(0,n.Z)(e,a);return o.createElement("section",Object.assign({className:"codeBox-module--code-box--1ZVTT"},c),o.createElement("section",{className:"codeBox-module--code-box-title--JgJIG"},t||""),o.createElement("section",{className:"codeBox-module--code-box-description--2mMGu"},r))}},9054:function(e,t,r){"use strict";r(50425);var n=r(86946),o=(r(54924),r(10187)),a=(r(31697),r(19275)),c=r(12985),u=r.n(c),i=r(75906),l=r.n(i),s=r(81811),f=r.n(s),d=r(27378),p=r(63988),m=r(49694),b=r(97432);function v(e,t){var r="undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(r)return(r=r.call(e)).next.bind(r);if(Array.isArray(e)||(r=function(e,t){if(!e)return;if("string"==typeof e)return y(e,t);var r=Object.prototype.toString.call(e).slice(8,-1);"Object"===r&&e.constructor&&(r=e.constructor.name);if("Map"===r||"Set"===r)return Array.from(e);if("Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))return y(e,t)}(e))||t&&e&&"number"==typeof e.length){r&&(e=r);var n=0;return function(){return n>=e.length?{done:!0}:{done:!1,value:e[n++]}}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function y(e,t){(null==t||t>e.length)&&(t=e.length);for(var r=0,n=new Array(t);r<t;r++)n[r]=e[r];return n}t.Z=function(e){var t=e.type,r=e.data,c="project"===t,i=r.allTag?r.allTag.edges:[],s=f()(l()(i,(function(e){return e.node.name})),"node"),y=(0,d.useState)(new Set),g=y[0],j=y[1];return r.allMdx&&r.allMdx.edges.forEach((function(e){e.node&&e.node.fields&&e.node.fields.slug&&e.node.fields.slug.tags?e.tags=new Set(e.node.fields.slug.tags):e.tags=new Set})),d.createElement(d.Fragment,null,d.createElement(n.Z,{gutter:[20,20]},d.createElement(o.Z,{xs:24,sm:24,md:24,lg:24},d.createElement(p.Z,{title:"Filters"},d.createElement(n.Z,{gutter:[0,8],align:"middle"},d.createElement(o.Z,{xs:!0},d.createElement("h5",{style:{marginBottom:"0",marginRight:"10px"}},"Tags:")),i.map((function(e){var t=g.has(e.node.name)?e.node.color:"",r=function(){return t=e.node.name,(r=u()(g)).has(t)?r.delete(t):r.add(t),void j(r);var t,r};return d.createElement(o.Z,{xs:!0},d.createElement(a.Z,{color:t},d.createElement("a",{onClick:r,onKeyPress:r,role:"button",tabIndex:0},e.node.name)))}))))),r.allMdx&&r.allMdx.edges.map((function(e,t){for(var r,n=v(g);!(r=n()).done;){var a=r.value;if(!e.tags.has(a))return null}return c?d.createElement(o.Z,{key:t,xs:24,sm:24,md:24,lg:8},d.createElement(b.Z,{data:e,tagsMap:s})):d.createElement(o.Z,{key:t,xs:24,sm:24,md:24,lg:8},d.createElement(m.Z,{data:e,tagsMap:s}))}))))}},49694:function(e,t,r){"use strict";r.d(t,{Z:function(){return p}});r(50425);var n=r(86946),o=(r(37172),r(16348)),a=r(83981),c=r.n(a),u=r(54622),i=r(27378),l=r(68941),s=r(98730),f=r.n(s),d=r(80170),p=function(e){var t=e.data.node,r=e.tagsMap,a=t.frontmatter,s=a.title,p=a.excerpt,m=a.path,b=a.date,v=a.tags,y=a.cover,g=y?y.childImageSharp.fluid:null,j=(0,l.$)(),x=f().resolvePageUrl(m),h=f().parseMarkDown(f().trimExcerpt(p),!0);return i.createElement(o.Z,{className:c()("postCard-module--postCard--2daM1","cursor-default"),bodyStyle:{padding:"0.8rem"},hoverable:!0,cover:i.createElement("div",null,i.createElement("a",{href:f().generateFullUrl(j,x)},g?i.createElement(u.Z,{fluid:g}):i.createElement("div",{className:"postCard-module--postCardImg--3L6nd"})),i.createElement("span",{className:"postCard-module--dateHolder--xmc-b"},b?f().formatDate(b):""))},i.createElement(o.Z.Meta,{title:i.createElement("span",{className:"postCard-module--title--2FDrU"},i.createElement("a",{href:f().generateFullUrl(j,x)},s)),style:{marginBottom:"1rem"}}),i.createElement(n.Z,{align:"middle",gutter:[0,8]},v?v.map((function(e){return r[e]?i.createElement(d.Z,{key:e,tag:r[e]}):null})):null),i.createElement("a",{href:f().generateFullUrl(j,x)},i.createElement("p",{style:{marginTop:"1rem"},dangerouslySetInnerHTML:{__html:h}})))}}}]);
//# sourceMappingURL=1c843dfb99853859ecc32ac1da20bc9b49e34eeb-10e9d48bedb9015d4ba4.js.map