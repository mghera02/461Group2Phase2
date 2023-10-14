<style lang="css" src="../assets/css/packageContainer.css"></style>

<template>
    <div class="packageContainer">
        <div class="packageTitle">
          {{packageContent.packageName}}
        </div>
        <router-link :to="{ name: 'install', params: { packageName: packageContent.packageName } }">Go to install page</router-link>
        <div class="metricScores">
          <div class="metricScore">
            Metric 1: {{ packageContent.metric1 }}
          </div>
          <div class="metricScore">
            Metric 2: {{ packageContent.metric2 }}
          </div>
          <div class="metricScore">
            Metric 3: {{ packageContent.metric3 }}
          </div>
          <div class="metricScore">
            Metric 4: {{ packageContent.metric4 }}
          </div>
          <div class="metricScore">
            Metric 5: {{ packageContent.metric5 }}
          </div>
          <div class="metricScore">
            Total Score: {{ packageContent.totalMetric }}
          </div>
        </div>
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
            packageContent: Object,
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