<style lang="css" src="../assets/css/search.css"></style>

<script setup>
  import SearchBar from '../components/searchBar.vue'
  import PackageContainer from '../components/packageContainer.vue'
</script>

<template>
  <router-link :to="{ name: 'upload', params: {} }" class="goToBtn">Upload a package</router-link>
  <button @click="resetSystem" class="goToBtn">Reset System</button>
  <h1 class="title">461 Group 2 Phase 2 Package Manager User Interface</h1>
  <main>
    <SearchBar @search-bar-val="getSearchBarVal"/>
    <div id="packages" v-for="(packageContent) in packages">
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
              packages: [],
              ip: "3.139.57.32",
              numSearchAllPress: 0,
              pastNumSearchAllPress: 0
            }
        },
        methods: {
          getSearchBarVal(x) {
            this.searchBarVal = x[0];
            this.numSearchAllPress = x[1];
          },
          async resetSystem() {
            const url = `http://${this.ip}:8080/reset`;
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
            
            let packageNames = []

            console.log(`this.searchBarVal:${this.searchBarVal}`)
            console.log(`this.numSearchAllPress:${this.numSearchAllPress - 1}`)
            if(this.searchBarVal == "*") {
              try {
                const response = await axios.post(`http://${this.ip}:8080/packages/?offset=${this.numSearchAllPress - 1}`, [{ "Name": "*" }], {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });
                console.log('Search Results (/packages):', response.data);
                packageNames = response.data;
                for (let packageName of packageNames) {
                  let id = await this.getPackageId(packageName);
                  let ratings = await this.getPackageRatings(id);
                  (this.packages).push({
                    packageName: packageName, 
                    packageId: id, 
                    busFactor: ratings.busFactor, 
                    rampup: ratings.rampup,
                    license: ratings.license,
                    correctness: ratings.correctness,
                    maintainer: ratings.maintainer,
                    pullRequest: ratings.pullRequest,
                    pinning: ratings.pinning,
                    score: ratings.score,
                  });
                } 
              } catch(error) {
                console.error('Error searching:', error);
              }
            } else {
              try {
                const response = await axios.post(`http://${this.ip}:8080/package/byRegEx`, {"RegEx": this.searchBarVal},{
                  headers: {
                    'Content-Type': 'application/json',
                  }
                })
                console.log('Search Results:', response.data);
                packageNames = response.data;
                for (let packageName of packageNames) {
                  let id = await this.getPackageId(packageName);
                  let ratings = await this.getPackageRatings(id);
                  (this.packages).push({
                    packageName: packageName, 
                    packageId: id, 
                    busFactor: ratings.busFactor, 
                    rampup: ratings.rampup,
                    license: ratings.license,
                    correctness: ratings.correctness,
                    maintainer: ratings.maintainer,
                    pullRequest: ratings.pullRequest,
                    pinning: ratings.pinning,
                    score: ratings.score,
                  });
                } 
              } catch(error) {
                console.error('Error searching:', error);
              }
            }
          },
          async getPackageId(packageName) {
            try {
              const response = await axios.get(`http://${this.ip}:8080/packageId/${packageName}`);
              console.log("Id received successfuly", response.data.package_id[0]);
              return response.data.package_id[0];
            } catch (error) {
              console.error("Error retrieving the rate.", error);
              return null;
            }
          },
          async getPackageRatings(id) {
            try {
              const response = await axios.get(`http://${this.ip}:8080/rate/${id}`, {
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
              if(newValue.searchBarVal != this.pastSearchBarVal || newValue.numSearchAllPress != this.pastNumSearchAllPress) {
                this.getMatchingPackages()
                console.log(newValue.searchBarVal, this.pastSearchBarVal, newValue.numSearchAllPress,this.pastNumSearchAllPress)
                this.pastSearchBarVal = this.searchBarVal
                this.pastNumSearchAllPress = this.numSearchAllPress
              }
            },
            deep: true
          }
        }
    }
</script>
