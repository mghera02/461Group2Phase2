<!--This is the frontend page to use the download endpoint and install the packages-->
<style lang="css" src="../assets/css/uploadDownload.css"></style>

<template>
    <router-link :to="{ name: 'home', params: {} }" class="goToBtn">Back to search page</router-link>
    <h1 class="title">
        Download a package 
    </h1>
    <span id="inline">
        <h2>
            {{ this.$route.params.packageName }}:
        </h2>
        <button class="btn" @click="getPackageZip">DOWNLOAD</button>
    </span>
 </template>
 
 <script>
     // Importing Axios library for HTTP requests
    import axios from "axios";

    export default {
        // Component name
        name: 'Install',

        // Data properties for the component
        data() {
            return {
                // IP address for server connection
                ip: "3.145.64.121"
            }
        },

        // Methods defined in the component
        methods: {
            // Method to fetch and download package ZIP file
            async getPackageZip() {
                // Extracting package ID from route parameters
                let id = this.$route.params.packageId;
                const endpoint = `http://${this.ip}:8080/package/${id}`;

                try {
                    // Fetch package ZIP file
                    const response = await fetch(endpoint, {
                        method: 'GET',
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok.');
                    }

                    // Retrieve filename from response headers or set default name
                    const filenameHeader = response.headers.get('Content-Disposition');
                    const package_name = filenameHeader ? filenameHeader.split('filename=')[1] : 'yourPackage.zip';

                    // Create blob from response and generate URL
                    const jsonResponse = await response.json();

                    // Retrieve Content from data object
                    const content = jsonResponse.data.Content;

                    // Create blob from content and generate URL
                    const blob = new Blob([content]);
                    const url = window.URL.createObjectURL(blob);

                    // Create link element for downloading
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', package_name);

                    // Append link to the DOM, trigger download, and clean up after download
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (error) {
                    console.error('Error downloading file:', error);
                }
            }
        },

        // Props for the component
        props: {},

        // Computed properties for the component
        computed: {},

        // Mounted lifecycle hook for the component
        mounted: function () {},

        // Watchers to track changes in data properties
        watch: {}
    }
 </script>
