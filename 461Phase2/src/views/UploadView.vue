<style lang="css" src="../assets/css/uploadDownload.css"></style>

<template>
    <router-link :to="{ name: 'home', params: {} }" class="goToBtn">Back to search page</router-link>
    <h1 class="title">
        Upload a package 
    </h1>
   <input ref="file" v-on:change="handleFileUpload()"  type="file">
   <h3>
      {{status}}  
   </h3>
</template>

<script>
    import { ref} from "vue"
    import axios from "axios"

    export default {
        name:'Add',
        data() {
             return {
                ip: "3.22.209.9",
                status: "",
             }
        },
        methods: {
            async handleFileUpload() {
                const file = this.$refs.file;
                // debugger;
                console.log("selected file", file.files)
                //Upload to server
                const selectedFile = file.files[0]
                const formData = new FormData();
                formData.append("file", selectedFile);
                this.status = "Uploading...";
                try {
                    const response = await axios.post(`http://${this.ip}:8080/upload`, formData, {
                        headers: {
                            "Content-Type": "application/zip",
                        },
                    });
                    console.log("File uploaded successfully.", response.data);
                    this.status = "File uploaded successfully"
                } catch (error) {
                    console.error("Error uploading the file.", error);
                    this.status = `Error uploading the file ${error}`;
                }
            }
        }
    }
</script>
