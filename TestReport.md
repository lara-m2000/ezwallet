# Test Report

<The goal of this document is to explain how the application was tested, detailing how the test cases were defined and what they cover>

# Contents

- [Dependency graph](#dependency-graph)

- [Integration approach](#integration-approach)

- [Tests](#tests)

- [Coverage](#Coverage)





# Dependency graph 

![Dependency_graph](./images/dependency_graph.jpg)
     
# Integration approach
We adopted a bottom-up approach, we started from testing utils.js module, on which the 3 main modules controller.js, users.js, auth.js depend on.
Then we tested the 3 main modules, and, as a consequence of testing the previous ones, also other secondary util modules (validate.js, group.utils.js, array.utils.js) were covered.

Step 1: unit testing of utils.js
Step 2: integration testing of utils.js
Step 3: unit testing of controller.js, users.js, auth.js
Step 4: integration testing of controller.js, users.js, auth.js
Step 5: API testing using Postman

# Tests

   <in the table below list the test cases defined For each test report the object tested, the test level (API, integration, unit) and the technique used to define the test case  (BB/ eq partitioning, BB/ boundary, WB/ statement coverage, etc)>   <split the table if needed>


| Test case name | Object(s) tested | Test level | Technique used |
|--|--|--|--|
|||||





# Coverage



## Coverage of FR

<Report in the following table the coverage of  functional requirements (from official requirements) >

| Functional Requirements covered |   Test(s) | 
| ------------------------------- | ----------- | 
| FRx                             |             |             
| FRy                             |             | 
| ... ||



## Coverage white box

![Test_coverage](./images/coverage.PNG)






