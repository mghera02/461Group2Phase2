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
    import { ref} from "vue"
    import axios from "axios"

    export default {
        name:'Add',
        data() {
             return {
                ip: "3.139.57.32",
                uploadStatus: "",
                npmUrl: "",
                ingestStatus: "",
             }
        },
        methods: {
            async handleFileUpload() {
                const file = this.$refs.file;
                // debugger;
                console.log("selected file", file.files)
                //Upload to server
                const selectedFile = file.files[0]
                let base64Data = btoa(selectedFile);
                this.uploadStatus = "Uploading...";
                try {
                    const response = await axios.post(`http://${this.ip}:8080/package`, {"Content": formData}, {
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    console.log("File uploaded successfully.", response.data);
                    this.uploadStatus = "File uploaded successfully"
                } catch (error) {
                    console.error("Error uploading the file.", error);
                    this.uploadStatus = `Error uploading the file ${error}`;
                }
            },
            async npmIngest() {
                console.log("url: ", this.npmUrl);
                this.ingestStatus = "Ingesting...";

                try {
                    const response = await fetch(`http://${this.ip}:8080/package`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ URL: this.npmUrl }), // stringify the object
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
