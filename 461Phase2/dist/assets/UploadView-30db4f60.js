import{_ as u,e as d,r as c,o as h,c as g,b as f,w as m,a as s,t as r,f as _,v as y,F as w,d as S}from"./index-e89f9b99.js";const U={name:"Add",data(){return{ip:"3.22.209.9",uploadStatus:"",npmUrl:"",ingestStatus:""}},methods:{async handleFileUpload(){const e=this.$refs.file;console.log("selected file",e.files);const t=e.files[0],a=new FormData;a.append("file",t),this.uploadStatus="Uploading...";try{const o=await d.post(`http://${this.ip}:8080/upload`,a,{headers:{"Content-Type":"application/zip"}});console.log("File uploaded successfully.",o.data),this.uploadStatus="File uploaded successfully"}catch(o){console.error("Error uploading the file.",o),this.uploadStatus=`Error uploading the file ${o}`}},async npmIngest(){console.log("url: ",this.npmUrl),this.ingestStatus="Ingesting...",fetch(`http://${this.ip}:8080/ingest`,{method:"POST",headers:{"Content-Type":"application/json"},body:{url:this.npmUrl}}).then(e=>{if(!e.ok)throw new Error("Network response was not ok")}).then(e=>{console.log(e),this.ingestStatus="Successfully ingested"}).catch(e=>{console.error("There was a problem with the fetch operation:",e),this.ingestStatus=`Failed to ingest: ${e}`})}}},k=s("h1",{class:"title"}," Upload a package ",-1);function x(e,t,a,o,n,i){const p=c("router-link");return h(),g(w,null,[f(p,{to:{name:"home",params:{}},class:"goToBtn"},{default:m(()=>[S("Back to search page")]),_:1}),k,s("input",{ref:"file",onChange:t[0]||(t[0]=l=>i.handleFileUpload()),type:"file"},null,544),s("h3",null,r(n.uploadStatus),1),_(s("input",{id:"textInput",type:"text","onUpdate:modelValue":t[1]||(t[1]=l=>n.npmUrl=l),placeholder:"Type an in npm url to ingest"},null,512),[[y,n.npmUrl]]),s("button",{id:"ingest",onClick:t[2]||(t[2]=(...l)=>i.npmIngest&&i.npmIngest(...l))}," Ingest "),s("h3",null,r(n.ingestStatus),1)],64)}const T=u(U,[["render",x]]);export{T as default};
