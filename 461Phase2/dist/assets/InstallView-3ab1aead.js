/* empty css                                                                */import{_ as l,r as p,o as d,c as m,b as u,w as h,a as n,t as k,F as g,d as w}from"./index-65024c78.js";const _={name:"Install",data(){return{ip:"3.145.64.121"}},methods:{async getPackageZip(){let c=this.$route.params.packageId;const o=`http://${this.ip}:8080/package/${c}`;try{const t=await fetch(o,{method:"GET"});if(!t.ok)throw new Error("Network response was not ok.");const s=t.headers.get("Content-Disposition"),i=s?s.split("filename=")[1]:"yourPackage.zip",a=await t.Content.blob(),r=window.URL.createObjectURL(new Blob([a])),e=document.createElement("a");e.href=r,e.setAttribute("download",i),document.body.appendChild(e),e.click(),document.body.removeChild(e)}catch(t){console.error("Error downloading file:",t)}}},props:{},computed:{},mounted:function(){},watch:{}},f=n("h1",{class:"title"}," Download a package ",-1),b={id:"inline"};function C(c,o,t,s,i,a){const r=p("router-link");return d(),m(g,null,[u(r,{to:{name:"home",params:{}},class:"goToBtn"},{default:h(()=>[w("Back to search page")]),_:1}),f,n("span",b,[n("h2",null,k(this.$route.params.packageName)+": ",1),n("button",{class:"btn",onClick:o[0]||(o[0]=(...e)=>a.getPackageZip&&a.getPackageZip(...e))},"DOWNLOAD")])],64)}const N=l(_,[["render",C]]);export{N as default};