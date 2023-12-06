Repo for ECE461 ACME Project Phase 2

Group 2 Members
Matthew Ghera, Atharva Patil, Gabi Mazion, Christopher Louly, Neha Sharma

This project is a package manager. It is comprised of several API endpoints and an ADA compliant web interface that contains the same functionality as the endpoints. The API and web server are run on AWS on an EC2. The endpoints utilize S3 and RDS to store data.

The endpoints are as follows along with how to invoke them via their endpoints and an example output:

1. Reset (DELETE /reset)
   Description: Reset the registry to a system default state.
   How to invoke: curl -X DELETE "http://3.139.57.32:8080/reset"
   Example output: "Registry is reset."
   
2. List Packages: (POST /packages) - Not matching spec yet
   Description: Get any packages fitting the query. Search for packages satisfying the indicated query. If you want to enumerate all packages, provide an array with a single PackageQuery whose name is "*". The response is paginated; the 
   response header includes the offset to use in the next query. In the Request Body below, "Version" has all the possible inputs. The "Version" cannot be a combination of the all the possibilities.
   How to invoke: curl -X POST "http://3.139.57.32:8080/packages" -H "Content-Type: application/json" -d '[{"Version":"0.0.0", "Name": "*"}]'
   Example output: 

3. Return Package: (GET /package/{id}) - Not matching spec yet
   Description: Return this package.
   How to invoke: 
   Example output:

4. Update Package: (PUT /package/{id}) - Not matching spec yet
   Description: Return this package.
   How to invoke: 
   Example output:

5. Upload a package via zip file (POST /package)
   Description: Upload a new package via a zip file. Packages that are uploaded may have the same name but a new version.
   How to invoke:
   Example output:

    
