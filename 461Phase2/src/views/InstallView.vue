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
             async getPackageZip(id) {
                const endpoint = `http://3.142.50.181:8080/download/${id}`;

                try {
                    const response = await fetch(endpoint, {
                        method: 'GET',
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok.');
                    }

                    const blob = await response.blob();

                    const url = window.URL.createObjectURL(new Blob([blob]));
                    const link = document.createElement('a');
                    link.href = url;

                    link.setAttribute('download', 'yourPackage.zip');

                    document.body.appendChild(link);
                    link.click();

                    document.body.removeChild(link);
                    } catch (error) {
                        console.error('Error downloading file:', error);
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
