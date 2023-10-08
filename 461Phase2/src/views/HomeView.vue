<style lang="css" src="../assets/css/search.css"></style>

<script setup>
  import SearchBar from '../components/searchBar.vue'
  import PackageContainer from '../components/packageContainer.vue'
</script>

<template>
  <main>
    <SearchBar @search-bar-val="getSearchBarVal"/>
    <div id="packages" v-for="packageContent in packages">
      <PackageContainer :packageContent="packageContent" />
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
            this.packages = [{packageName: "1"},{packageName: "2"},{packageName: "3"},{packageName: "4"}] // temporary placeholder
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
