/* empty css                                                                */import{_ as h,r as u,o as k,c as w,b as f,w as _,a as c,t as b,F as y,d as C}from"./index-928df4e3.js";const $={name:"Install",data(){return{ip:"3.145.64.121"}},methods:{async getPackageZip(){let l=this.$route.params.packageId;const n=`http://${this.ip}:8080/package/${l}`;try{const e=await fetch(n,{method:"GET"});if(!e.ok)throw new Error("Network response was not ok.");const i=e.headers.get("Content-Disposition"),d=i?i.split("filename=")[1]:"yourPackage.zip",a=await e.json();console.log(`response: ${JSON.stringify(e)}`);const s=a.data.Content;console.log(`content: ${s}`);const t=atob(s),p=new Uint8Array(t.length);for(let r=0;r<t.length;r++)p[r]=t.charCodeAt(r);const m=new Blob([p],{type:contentType}),g=window.URL.createObjectURL(m),o=document.createElement("a");o.href=g,o.setAttribute("download",d),document.body.appendChild(o),o.click(),document.body.removeChild(o)}catch(e){console.error("Error downloading file:",e)}}},props:{},computed:{},mounted:function(){},watch:{}},N=c("h1",{class:"title"}," Download a package ",-1),B={id:"inline"};function x(l,n,e,i,d,a){const s=u("router-link");return k(),w(y,null,[f(s,{to:{name:"home",params:{}},class:"goToBtn"},{default:_(()=>[C("Back to search page")]),_:1}),N,c("span",B,[c("h2",null,b(this.$route.params.packageName)+": ",1),c("button",{class:"btn",onClick:n[0]||(n[0]=(...t)=>a.getPackageZip&&a.getPackageZip(...t))},"DOWNLOAD")])],64)}const E=h($,[["render",x]]);export{E as default};
