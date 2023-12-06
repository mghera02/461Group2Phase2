Repo for ECE461 ACME Project Phase 2

Group 2 Members
Matthew Ghera, Atharva Patil, Gabi Mazion, Christopher Louly, Neha Sharma

This project is a package manager. It is comprised of several API endpoints and an ADA compliant web interface that contains the same functionality as the endpoints. The API and web server are run on AWS on an EC2. The endpoints utilize S3 and RDS to store data.

The endpoints are as follows along with how to invoke them via their endpoints and an example output:

1. Reset (/reset)
   Description: Reset the registry to a system default state.
   How to invoke: curl -X DELETE "http://3.139.57.32:8080/reset"
   Example output: "Successfully reset system to original state"

2. List Packages
