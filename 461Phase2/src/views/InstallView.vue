<template>
    <router-link :to="{ name: 'home', params: {} }" class="goToBtn">Back to search page</router-link>
     <h1 class="title">
         Download a package 
     </h1>
    {{ this.$route.params.packageName }}
    <button @click="getPackageZip">DOWNLOAD</button>
 </template>
 
 <script>
     import axios from "axios"
 
     export default {
         name: 'Install',
         data() {
             return {
                 downloadLink: ""
             }
         },
         methods: {
             async getPackageZip(id) {
                id = 1;
                const endpoint = `http://3.142.50.181:8080/download/${id}`;

                try {
                    const response = await fetch(endpoint, {
                        method: 'GET',
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok.');
                    }

                    const filenameHeader = response.headers.get('Content-Disposition');
                    const package_name = filenameHeader ? filenameHeader.split('filename=')[1] : 'yourPackage.zip';

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(new Blob([blob]));

                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', package_name);

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
         },
         watch: {
         }
     }
 </script>
