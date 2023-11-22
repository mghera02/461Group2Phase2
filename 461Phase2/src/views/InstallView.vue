<template>
    <router-link :to="{ name: 'home', params: {} }" class="goToBtn">Back to search page</router-link>
     <h1 class="title">
         Download a package 
     </h1>
    {{ this.$route.params.packageName }}
    <a :href=downloadLink download>DOWNLOAD</a>
 </template>
 
 <script>
     import axios from "axios"
 
     export default {
         name: 'Install',
         data() {
             return {
                 downloadLink: "/files/test.zip"
             }
         },
         methods: {
             async getPackageZip(packageName) {
                 packageName = 27; // temp hardcoded
                 try {
                     const response = await axios.get(`http://3.142.91.53:3000/download/${packageName}`, {
                         headers: {
                         "Content-Type": "application/zip",
                         },
                     });
                     console.log("Zip received successfuly:", response.data);
                     this.downloadLink = response.data;
                     return response.data;
                 } catch (error) {
                     console.error("Error retrieving the zip file.", error);
                     return null;
                 }
             }
         },
         props: {
             packageName: String
         },
         computed: {
         },
         mounted: function () {
             let packageZipFile = this.getPackageZip(this.packageName);
         },
         watch: {
         }
     }
 </script>
