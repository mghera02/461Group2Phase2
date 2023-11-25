<style lang="css" src="../assets/css/search.css"></style>

<script setup>
  import SearchBar from '../components/searchBar.vue'
  import PackageContainer from '../components/packageContainer.vue'
</script>

<template>
  <router-link :to="{ name: 'upload', params: {} }" class="goToBtn">Upload a package</router-link>
  <div @click="resetSystem" class="goToBtn">Reset System</div>
  <h1 class="title">461 Group 2 Phase 2 Package Manager User Interface</h1>
  <main>
    <SearchBar @search-bar-val="getSearchBarVal"/>
    <div id="packages" v-for="packageContent in packages">
      <PackageContainer :packageContent="packageContent"/>
    </div>
  </main>
</template>

<script>
    import axios from "axios"

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
          async resetSystem() {
            const url = 'http://3.142.50.181:8080/reset';
            fetch(url, {
              method: 'POST'
            })
              .then(response => {
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                console.log('Reset request successful');
              })
              .catch(error => {
                console.error('There was a problem with the request:', error);
              });
          },
          async getMatchingPackages() {
            
            let packageNames = ["NodeJs", "TensorFlow", "Random Package", "New Package"] // temp hardcoded

            axios.get(`http://3.142.50.181:8080/search`, {
              params: {
                q: this.searchBarVal,
              }
            }).then(response => {
              console.log('Search Results:', response.data);
              packageNames = response.data;
            })
            .catch(error => {
              console.error('Error searching:', error.message);
            });

            for (let packageName of packageNames) {
              let ratings = await this.getPackageRatings(packageName);
              (this.packages).push({
                packageName: packageName, 
                metric1: ".2", // temp hardcoded
                metric2: ".4", // temp hardcoded
                metric3: ".2", // temp hardcoded
                metric4: ".8", // temp hardcoded
                metric5: ".1", // temp hardcoded
                totalMetric: ".1" // temp hardcoded
              });
            } 
          },
          async getPackageRatings(packageName) {
            try {
              const response = await axios.get(`http://localhost:4000/rate/:${packageName}`, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              });
              console.log("Rate received successfuly", response.data);
              return response.data;
            } catch (error) {
              console.error("Error retrieving the rate.", error);
              return null;
            }
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
