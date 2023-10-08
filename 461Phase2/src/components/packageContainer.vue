<style lang="css" src="../assets/css/packageContainer.css"></style>

<template>
    <div class="packageContainer">
        {{packageContent.packageName}}
    </div>
</template>
  
<script>
    export default {
        name: 'packageContainer',
        data() {
            return {
            }
        },
        methods: {
        },
        props: {
            packageContent: String
        },
        computed: {
        },
        mounted: function () {
        },
        watch: {
          '$data': {
            handler: function(newValue) {
              console.log(newValue.packageContent)
            },
            deep: true
          }
        }
    }
</script>