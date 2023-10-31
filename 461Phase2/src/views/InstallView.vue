<template>
   {{ this.$route.params.packageName }}
   <a href="/files/test.zip" download>DOWNLOAD</a>
</template>

<script>
    import axios from "axios"
    
    export default {
        name: 'Install',
        data() {
            return {
            }
        },
        methods: {
            async getPackageZip(packageName) {
                try {
                    const response = await axios.get(`http://localhost:3000/download/:${packageName}`, {
                        headers: {
                        "Content-Type": "multipart/form-data",
                        },
                    });
                    console.log("Zip received successfuly", response.data);
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
