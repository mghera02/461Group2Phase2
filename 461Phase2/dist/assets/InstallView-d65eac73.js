/* empty css                                                                */import{_ as d,r as m,o as u,c as g,b as h,w as k,a as s,t as w,F as _,d as f}from"./index-a2666fca.js";const b={name:"Install",data(){return{ip:"3.145.64.121"}},methods:{async getPackageZip(){let i=this.$route.params.packageId;const o=`http://${this.ip}:8080/package/${i}`;try{const e=await fetch(o,{method:"GET"});if(!e.ok)throw new Error("Network response was not ok.");const c=e.headers.get("Content-Disposition"),l=c?c.split("filename=")[1]:"yourPackage.zip",a=await e.json();console.log(`response: ${e}`);const n=a.data.Content;console.log(`content: ${n}`);const r=new Blob([n]),p=window.URL.createObjectURL(r),t=document.createElement("a");t.href=p,t.setAttribute("download",l),document.body.appendChild(t),t.click(),document.body.removeChild(t)}catch(e){console.error("Error downloading file:",e)}}},props:{},computed:{},mounted:function(){},watch:{}},$=s("h1",{class:"title"}," Download a package ",-1),C={id:"inline"};function y(i,o,e,c,l,a){const n=m("router-link");return u(),g(_,null,[h(n,{to:{name:"home",params:{}},class:"goToBtn"},{default:k(()=>[f("Back to search page")]),_:1}),$,s("span",C,[s("h2",null,w(this.$route.params.packageName)+": ",1),s("button",{class:"btn",onClick:o[0]||(o[0]=(...r)=>a.getPackageZip&&a.getPackageZip(...r))},"DOWNLOAD")])],64)}const x=d(b,[["render",y]]);export{x as default};
