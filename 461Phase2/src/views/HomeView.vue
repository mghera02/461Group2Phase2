<!--This is the home page, this is the landing page where endpoints like search, reset, and rate are directly. 
  And you can access the upload an download page from here too-->
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
    <div class="packages" v-for="(packageContent) in packages">
      <PackageContainer :packageContent="packageContent"/>
    </div>
  </main>
</template>

<script>
    // This script utilizes Axios for HTTP requests

  // Importing Axios library for HTTP requests
  import axios from "axios";

  export default {
      // Component name
      name: 'SearchBar',

      // Data properties for the component
      data() {
          return {
              // Input value for search bar
              searchBarVal: "",
              // Previous value of the search bar
              pastSearchBarVal: "",
              // Array to store packages
              packages: [],
              // IP address for server connection
              ip: "3.139.57.32",
              // Number of times search button pressed for all searches
              numSearchAllPress: 0,
              // Previous number of times search button pressed for all searches
              pastNumSearchAllPress: 0
          }
      },

      // Methods defined in the component
      methods: {
          // Method to update search bar value and number of search presses
          getSearchBarVal(x) {
              this.searchBarVal = x[0];
              this.numSearchAllPress = x[1];
          },
          // Method to reset the system via a DELETE request
          async resetSystem() {
              const url = `http://${this.ip}:8080/reset`;
              fetch(url, {
                  method: 'DELETE'
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
          // Method to fetch and populate matching packages based on search criteria
          async getMatchingPackages() {
              let packageNames = [];

              // Check for '*' as search criteria
              if (this.searchBarVal == "*") {
                  try {
                      // Fetch packages with '*' as criteria
                      const response = await axios.post(`http://${this.ip}:8080/packages/?offset=${this.numSearchAllPress - 1}`, [{ "Name": "*" }, { "Version": "*" }], {
                          headers: {
                              'Content-Type': 'application/json',
                          },
                      });
                      console.log('Search Results (/packages):', response.data);
                      packageNames = response.data;

                      // Fetch additional details for each package
                      for (let packageName of packageNames) {
                          let id = await this.getPackageId(packageName);
                          let ratings = await this.getPackageRatings(id);
                          this.packages.push({
                              packageName: packageName,
                              packageId: id,
                              // Ratings for various aspects of the package
                              busFactor: ratings.BusFactor,
                              rampup: ratings.RampUp,
                              license: ratings.LicenseScore,
                              correctness: ratings.Correctness,
                              maintainer: ratings.ResponsiveMaintainer,
                              pullRequest: ratings.PullRequest,
                              pinning: ratings.GoodPinningPractice,
                              score: ratings.NetScore,
                          });
                      }
                  } catch (error) {
                      console.error('Error searching:', error);
                  }
              } else {
                  try {
                      // Fetch packages based on regular expression search criteria
                      const response = await axios.post(`http://${this.ip}:8080/package/byRegEx`, { "RegEx": this.searchBarVal }, {
                          headers: {
                              'Content-Type': 'application/json',
                          }
                      });
                      console.log('Search Results:', response.data);
                      let packages = response.data;

                      // Fetch additional details for each package
                      for (let packageObj of packages) {
                          let id = await this.getPackageId(packageObj.Name, packageObj.Version);
                          let ratings = await this.getPackageRatings(id);
                          this.packages.push({
                              packageName: packageObj.Name,
                              packageVersion: packageObj.Version,
                              packageId: id,
                              // Ratings for various aspects of the package
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
                  } catch (error) {
                      console.error('Error searching:', error);
                  }
              }
          },
          // Method to fetch package ID based on name and version
          async getPackageId(packageName, packageVersion) {
              try {
                  const response = await axios.get(`http://${this.ip}:8080/packageId/${packageName}`);
                  console.log("Id received successfully", response.data.package_id[0]);
                  return response.data.package_id[0];
              } catch (error) {
                  console.error("Error retrieving the rate.", error);
                  return null;
              }
          },
          // Method to fetch package ratings based on ID
          async getPackageRatings(id) {
              try {
                  const response = await axios.get(`http://${this.ip}:8080/package/${id}/rate`, {
                      headers: {
                          "Content-Type": "multipart/form-data",
                      },
                  });
                  console.log("Rate received successfully", response.data);
                  return response.data;
              } catch (error) {
                  console.error("Error retrieving the rate.", error);
                  return null;
              }
          },
      },

    // Props for the component
    props: {},

    // Computed properties for the component
    computed: {},

    // Mounted lifecycle hook for the component
    mounted: function () {},

    // Watchers to track changes in data properties
    watch: {
      '$data': {
          handler: function (newValue) {
            // Check for changes in search criteria or number of search presses
            if (newValue.searchBarVal != this.pastSearchBarVal || newValue.numSearchAllPress != this.pastNumSearchAllPress) {
              // Trigger function to fetch matching packages
              this.getMatchingPackages();
              console.log(newValue.searchBarVal, this.pastSearchBarVal, newValue.numSearchAllPress, this.pastNumSearchAllPress);
              // Update past values for comparison in the next iteration
              this.pastSearchBarVal = this.searchBarVal;
              this.pastNumSearchAllPress = this.numSearchAllPress;
            }
          },
          // Deep watch to monitor changes deeply in the data object
          deep: true
        }
    }
  }
</script>
