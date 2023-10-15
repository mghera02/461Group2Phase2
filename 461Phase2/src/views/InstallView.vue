<template>
   {{ this.$route.params.packageName }}
   <a href="/files/test.zip" download>DOWNLOAD</a>
</template>

<script>
    export default {
        name: 'Install',
        data() {
            return {
            }
        },
        methods: {
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
