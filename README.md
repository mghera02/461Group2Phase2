Repo for ECE461 ACME Project Phase 2

Group 2 Members
Matthew Ghera, Atharva Patil, Gabi Mazion, Christopher Louly, Neha Sharma

This project is a package manager. It is comprised of several API endpoints and an ADA compliant web interface that contains the same functionality as the endpoints. The API and web server are run on AWS on an EC2. The endpoints utilize S3 and RDS to store data.

We also made an ADA compliant web browswer where you can enact each endpoint located here: http://3.145.64.121/

The endpoints are as follows along with how to invoke them via their endpoints and an example output:

1. Reset (DELETE /reset)
   Description: Reset the registry to a system default state.
   How to invoke: curl -X DELETE "http://3.145.64.121:8080/reset"
   Example output: "Registry is reset."
   
2. List Packages: (POST /packages)
   Description: Get any packages fitting the query. Search for packages satisfying the indicated query. If you want to enumerate all packages, provide an array with a single PackageQuery whose name is "*". The response is paginated; the 
   response header includes the offset to use in the next query. In the Request Body below, "Version" has all the possible inputs. The "Version" cannot be a combination of the all the possibilities.
   How to invoke: curl -X POST "http://3.145.64.121:8080/packages" -H "Content-Type: application/json" -d '[{"Version":"*", "Name": "*"}]'
   Example output: [{"Version":"1.0.6","Name":"copee","ID":"copee1.0.6"},{"Version":"4.3.4","Name":"debug","ID":"debug4.3.4"}] 

3. Return Package: (GET /package/{id}) - Not working in the frontend
   Description: Return this package.
   How to invoke: curl -X GET "http://3.145.64.121:8080/package/copee1.0.6/" -H "Content-Type:application/json"
   Example output:{"metadata":{"Name":"copee","ID":"copee1.0.6","Version":"1.0.6"},"data":{"Content":"UEsDBAoAAAAAAGKbYVcAAAAAAAAAAAAAAAALAAkAY29wZWUtbWFpbi9VVAUAAfkIQ2VQSwMECgAAAAgAYpthV/a+8/SnAAAAegEAABkACQBjb3BlZS1tYWluLy5naXRhdHRyaWJ1dGVzVVQFAAH5

4. Update Package: (PUT /package/{id})
   Description: Return this package.
   How to invoke: curl -X PUT "http://3.145.64.121:8080/package/copee1.0.6/" -H "Content-Type:application/json" -d '{"metadata":{"Name": "copee", "Version": "1.0.6", "ID":"copee1.0.6"}, "data":{"URL":"https://github.com/debug-js/debug"}}'
   Example output: Version is updated.

5. Upload a package via zip file (POST /package)
   Description: Upload a new package via a zip file. Packages that are uploaded may have the same name but a new version.
   How to invoke:
   Example output: {
    "metadata": {
        "Name": "copee",
        "Version": "1.0.6",
        "ID": "copee1.0.6"
    },
    "data": {
         "Content": "UEsDBAoAAAAAAGKbYVc...",
         "JSProgram": "Not Implementing"
      }
   }

6. Upload a package via url to a npm or github package (POST /package)
   Description: Upload a new package via a zip file. Packages that are uploaded may have the same name but a new version.
   How to invoke: curl -X POST "http://3.145.64.121:8080/package" -H "Content-Type: application/json" -d '{"URL": "https://www.npmjs.com/package/axios"}'
   Example output: {
  "metadata": {
    "Name": "axios",
    "Version": "0.27.2",
    "ID": "axios0.27.2"
  },
  "data": {
    "Content": "cy90cmltLnNwZWMuanNQSwEC...",
         "JSProgram": "Not Implementing"
      }
   }

7. Rate a package (GET /paclage/{ID}/rate)
   Description: Given a package ID, retrieve the ratings for the package (BusFactor, RampUp, LicenseScore, Correctness, ResponsiveMaintainer, PullRequest, GoodPinningPractice, NetScore)
   How to invoke: curl -X GET "http://3.145.64.121:8080/package/copee1.0.6/rate" -H "Content-Type: application/json"
   Example Output:    {"BusFactor":"0.19882","RampUp":"0.94343","LicenseScore":"1.00000","Correctness":"0.57113","ResponsiveMaintainer":"0.97520","PullRequest":"0.00000","GoodPinningPractice":"1.00000","NetScore":"0.67812"}

8. Search a package using regex (POST /package/byRegEx)
   Description: Given a regex string, retrieve all matching packages
   How to invoke: curl -X POST "http://3.145.64.121:8080/package/byRegEx" -H "Content-Type: application/json" -d '{"RegEx": "co"}'
   Example output: [{"Version":"1.0.6","Name":"copee"}]


