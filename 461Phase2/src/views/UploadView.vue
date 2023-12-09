<!--This is the frontend page for the upload page where you can use the upload endpoint. -->
<style lang="css" src="../assets/css/uploadDownload.css"></style>

<template>
    <router-link :to="{ name: 'home', params: {} }" class="goToBtn">Back to search page</router-link>
    <h1 class="title">
        Upload a package 
    </h1>
   <input class="btn" ref="file" v-on:change="handleFileUpload()"  type="file">
   <h3>
      {{uploadStatus}}  
   </h3>

   <h2>
    or
   </h2>

   <input id="textInput" type="text" v-model="npmUrl" placeholder="Type an in npm url to ingest"/>
   <button id="ingest" class="btn" @click="npmIngest"> Ingest </button>
   <h3>
      {{ingestStatus}}  
   </h3>
</template>

<script>
    // Importing necessary modules from Vue and Axios
    import { ref } from "vue";
    import axios from "axios";

    export default {
        // Component name
        name: 'Add',

        // Data properties for the component
        data() {
            return {
                // IP address for server connection
                ip: "3.139.57.32",
                // Status for file upload process
                uploadStatus: "",
                // URL for npm ingest process
                npmUrl: "",
                // Status for npm ingest process
                ingestStatus: "",
            }
        },

        // Methods defined in the component
        methods: {
            // Method to handle file upload
            async handleFileUpload() {
                const file = this.$refs.file;
                console.log("selected file", file.files)
                this.uploadStatus = "Uploading...";

                // Access the selected file
                const selectedFile = file.files[0]
                const reader = new FileReader();

                // Read the selected file content
                reader.onload = async (event) => {
                    const fileContent = event.target.result;

                    // Extract base64 content
                    const base64String = fileContent.split(',')[1];

                    // Make a POST request using Axios to upload the file
                    try {
                        const response = await axios.post(`http://3.139.57.32:8080/package`, {"Content": base64String}, {
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        });
                        console.log("File uploaded successfully.", response.data);
                        this.uploadStatus = "File uploaded successfully.";
                    } catch (error) {
                        console.error("Error uploading the file.", error);
                        this.uploadStatus = `Error uploading the file, ${error}`;
                    }
                };

                // Read the file as a data URL (base64)
                reader.readAsDataURL(selectedFile);
            },

            // Method to perform npm ingestion
            async npmIngest() {
                console.log("url: ", this.npmUrl);
                this.ingestStatus = "Ingesting...";

                // Perform a POST request for npm ingestion using fetch API
                try {
                    const response = await fetch(`http://${this.ip}:8080/package`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ URL: this.npmUrl }),
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    this.ingestStatus = "Successfully ingested";
                } catch (error) {
                    console.error('There was a problem with the fetch operation:', error);
                    this.ingestStatus = `Failed to ingest: ${error}`;
                }
            }
        }
    }
</script>
