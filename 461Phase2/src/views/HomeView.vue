<style lang="css" src="../assets/css/search.css"></style>

<script setup>
  import SearchBar from '../components/searchBar.vue'
  import PackageContainer from '../components/packageContainer.vue'
</script>

<template>
  <main>
    <SearchBar @search-bar-val="getSearchBarVal"/>
    <div id="packages" v-for="packageContent in packages">
      <PackageContainer :packageContent="packageContent"/>
    </div>
  </main>
</template>

<script>
    export default {
        name: 'SearchBar',
        data() {
            return {
              searchBarVal: "",
              pastSearchBarVal: "",
              packages: []
            }
        },
        methods: {
          getSearchBarVal(x) {
            this.searchBarVal = x;
          },
          getMatchingPackages() {
            this.packages = [{packageName: "NodeJs", metric1: .2, metric2: .4, metric3: .2, metric4: .8, metric5: .1, totalMetric: .5},
                            {packageName: "TensorFlow", metric1: .2, metric2: .4, metric3: .2, metric4: .8, metric5: .1, totalMetric: .5},
                            {packageName: "Random Package", metric1: .2, metric2: .4, metric3: .2, metric4: .8, metric5: .1, totalMetric: .5},
                            {packageName: "New Pacakge", metric1: .2, metric2: .4, metric3: .2, metric4: .8, metric5: .1, totalMetric: .5}] // temporary placeholder
          }
        },
        props: {
        },
        computed: {
        },
        mounted: function () {
        },
        watch: {
          '$data': {
            handler: function(newValue) {
              if(newValue.searchBarVal != this.pastSearchBarVal) {
                this.getMatchingPackages()
                this.pastSearchBarVal = this.searchBarVal
              }
            },
            deep: true
          }
        }
    }
</script>
