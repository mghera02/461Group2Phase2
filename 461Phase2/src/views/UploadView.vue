<style lang="css" src="../assets/css/uploadDownload.css"></style>

<template>
    <router-link :to="{ name: 'home', params: {} }" class="goToBtn">Back to search page</router-link>
    <h1 class="title">
        Upload a package 
    </h1>
   <input ref="file" v-on:change="handleFileUpload()"  type="file">
</template>

<script>
    import { ref} from "vue"
    import axios from "axios"

    export default{
        name:'Add',
        setup() {
            const file = ref(null)

            const handleFileUpload = async() => {
                // debugger;
                console.log("selected file",file.value.files)
                //Upload to server
                const selectedFile = file.value.files[0]
                const formData = new FormData();
                formData.append("file", selectedFile);
                try {
                    const response = await axios.post("http://18.188.4.253:3000/upload", formData, {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    });
                    console.log("File uploaded successfully.", response.data);
                } catch (error) {
                    console.error("Error uploading the file.", error);
                }
            }

            return {
            handleFileUpload,
            file
        }
        }
    }
</script>
