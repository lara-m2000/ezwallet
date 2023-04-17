# Requirements Document - current EZWallet

Date: 

Version: V1 - description of EZWallet in CURRENT form (as received by teachers)

 
| Version number | Change |
| ----------------- |:-----------|
| | | 


# Contents

- [Requirements Document - current EZWallet](#requirements-document---current-ezwallet)
- [Contents](#contents)
- [Informal description](#informal-description)
- [Stakeholders](#stakeholders)
- [Context Diagram and interfaces](#context-diagram-and-interfaces)
	- [Context Diagram](#context-diagram)
	- [Interfaces](#interfaces)
- [Stories and personas](#stories-and-personas)
- [Functional and non functional requirements](#functional-and-non-functional-requirements)
	- [Functional Requirements](#functional-requirements)
	- [Non Functional Requirements](#non-functional-requirements)
- [Use case diagram and use cases](#use-case-diagram-and-use-cases)
	- [Use case diagram](#use-case-diagram)
		- [Use case 1, UC1](#use-case-1-uc1)
				- [Scenario 1.1](#scenario-11)
				- [Scenario 1.2](#scenario-12)
				- [Scenario 1.x](#scenario-1x)
		- [Use case 2, UC2](#use-case-2-uc2)
		- [Use case x, UCx](#use-case-x-ucx)
		- [User Registration, UC4](#user-registration-uc4)
				- [Scenario 4.1](#scenario-41)
			- [Scenario 4.2](#scenario-42)
		- [User Login, UC5](#user-login-uc5)
				- [Scenario 5.1](#scenario-51)
				- [Scenario 5.2](#scenario-52)
		- [User Logout, UC6](#user-logout-uc6)
				- [Scenario 6.1](#scenario-61)
- [Glossary](#glossary)
- [System Design](#system-design)
- [Deployment Diagram](#deployment-diagram)

# Informal description
EZWallet (read EaSy Wallet) is a software application designed to help individuals and families keep track of their expenses. Users can enter and categorize their expenses, allowing them to quickly see where their money is going. EZWallet is a powerful tool for those looking to take control of their finances and make informed decisions about their spending.



# Stakeholders


| Stakeholder name  | Description | 
| ----------------- |:-----------:|
|Users|Individuals and families| 
|Developers|Testers and programmers|
|CEO|Head of the startup company|
|Competitors|Satispay/Postepay (functionality that tracks expenses)|
|??DB admin??||
|Admin|User with special privileges|
|COO|Manages analytics and market analyis|



# Context Diagram and interfaces

## Context Diagram
\<Define here Context diagram using UML use case diagram>

\<actors are a subset of stakeholders>

```plantuml
@startuml

usecase EzWallet
actor User

User -- EzWallet

@enduml
```

## Interfaces
\<describe here each interface in the context diagram>

\<GUIs will be described graphically in a separate document>

| Actor | Logical Interface | Physical Interface  |
| ------------- |:-------------:| -----:|
|User|GUI or shell/API|Keyboard, Screen|

# Stories and personas
\<A Persona is a realistic impersonation of an actor. Define here a few personas and describe in plain text how a persona interacts with the system>

\<Persona is-an-instance-of actor>

\<stories will be formalized later as scenarios in use cases>


# Functional and non functional requirements

## Functional Requirements

\<In the form DO SOMETHING, or VERB NOUN, describe high level capabilities of the system>

\<they match to high level use cases>

| ID        | Description  |
| ------------- |:-------------:| 
|FR1|Manage user account|
|FR1.1|Login|
|FR1.2|Logout|
|FR1.3|Authorize|
|FR1.4|Register (name, email, pwd)|
|FR1.5|Show registered users|
|FR1.5.1|Filter by username|
|FR2|Manage categories|
|FR2.1|Add category|
|FR2.2|Show categories|
|FR3|Manage transactions|
|FR3.1|Add transaction|
|FR3.2|Delete transaction|
|FR3.3|Show transactions|
|FR3.4|Show labelled transactions|

## Non Functional Requirements

\<Describe constraints on functional requirements>

| ID        | Type (efficiency, reliability, ..)           | Description  | Refers to |
| ------------- |:-------------:| :-----:| -----:|
|NFR1|Usability|Should be used with no training by users with at least 6 months experience with computers|FR1,FR2,FR3|
|NFR2|Efficiency|Response time lower than 100ms in optimal condition|FR1,FR2,FR3|
|NFR3|Availability|Available for the 99.999% in a year|FR1,FR2,FR3|
|NFR4|Reliability|Less than 4 minor/medium defects per month. Less than 1 severe defect per year. 0 killer defects per year|FR1,FR2,FR3|
|NFR5|Security|GDPR. Legislative requirements of the country in which the application will be used. Only authorized users can access|FR1,FR2,FR3|



# Use case diagram and use cases


## Use case diagram
\<define here UML Use case diagram UCD summarizing all use cases, and their relationships>


\<next describe here each use case in the UCD>
### Use case 1, UC1
| Actors Involved        |  |
| ------------- |:-------------:| 
|  Precondition     | \<Boolean expression, must evaluate to true before the UC can start> |
|  Post condition     | \<Boolean expression, must evaluate to true after UC is finished> |
|  Nominal Scenario     | \<Textual description of actions executed by the UC> |
|  Variants     | \<other normal executions> |
|  Exceptions     | \<exceptions, errors > |

##### Scenario 1.1 

\<describe here scenarios instances of UC1>

\<a scenario is a sequence of steps that corresponds to a particular execution of one use case>

\<a scenario is a more formal description of a story>

\<only relevant scenarios should be described>

| Scenario 1.1 | |
| ------------- |:-------------:| 
|  Precondition     | \<Boolean expression, must evaluate to true before the scenario can start> |
|  Post condition     | \<Boolean expression, must evaluate to true after scenario is finished> |
| Step#        | Description  |
|  1     |  |  
|  2     |  |
|  ...     |  |

##### Scenario 1.2

##### Scenario 1.x

### Use case 2, UC2
..

### Use case x, UCx
..


### User Registration, UC4

| Actors Involved        |User |
| ------------- |:-------------:| 
|  Precondition     | |
|  Post condition     | User is registerd and authorized |
|  Nominal Scenario     | User want's to register to the EzWallet system |
|  Variants     | |
|  Exceptions     | Server is not available, A User with the credentials exists |

##### Scenario 4.1 

| Scenario 4.1 | (Nominal) |
| ------------- |:-------------:| 
|  Precondition     | |
|  Post condition     |User is registerd |
| Step#        | Description  |
|1|User goes on the EzWallet System |  
|2|Enters the register page |
|3|System asks for his credentials |
|4|System checks if (username, password, email) are correct |
|5|User is registerd |

#### Scenario 4.2

| Scenario 4.2 | (Exception) |
| ------------- |:-------------:| 
|  Precondition     |User registered |
|  Post condition     |New User registration failed |
| Step#        | Description  |
|1|User goes on the EzWallet System |  
|2|Enters the register page |
|3|System asks for his credentials |
|4|System checks if (username, password, email) are correct |
|5|Email is already used, User alreay registered |


### User Login, UC5

| Actors Involved        |User |
| ------------- |:-------------:| 
|  Precondition     | User is registerd |
|  Post condition     | User is logged in and authorized |
|  Nominal Scenario     | User want's to login to the EzWallet System |
|  Variants     | |
|  Exceptions     | The login creadentials are invalid |

##### Scenario 5.1 

| Scenario 5.1 | (Nominal) |
| ------------- |:-------------:| 
|  Precondition     |User is registered |
|  Post condition     | User is logged in and authorized |
| Step#        | Description  |
|1|User goes on the EzWallet System |  
|2|Enters the login page |
|3|System asks for his credentials |
|4|System checks if (username, password, email) are correct |
|5|User is logged in |

##### Scenario 5.2

| Scenario 5.2 | (Exception) |
| ------------- |:-------------:| 
|  Precondition     |User is registered or not registered |
|  Post condition     | User is not logged in |
| Step#        | Description  |
|1|User goes on the EzWallet System |  
|2|Enters the login page |
|3|System asks for his credentials |
|4|System checks if (username, password, email) are correct |
|5|System rejects User |



### User Logout, UC6

| Actors Involved        |User |
| ------------- |:-------------:| 
|  Precondition     | User is logged id and authorized |
|  Post condition     | User is logged out  |
|  Nominal Scenario     | User want's to logout fom the EzWallet System |
|  Variants     | |
|  Exceptions     | |

##### Scenario 6.1 

| Scenario 6.1 | (Nominal) |
| ------------- |:-------------:| 
|  Precondition     |User is registered |
|  Post condition     | User is logged in and authorized |
| Step#        | Description  |
|1|User goes on the EzWallet System |  
|2|User ask to logout |
|2|User is logged out |


# Glossary

\<use UML class diagram to define important terms, or concepts in the domain of the application, and their relationships> 

\<concepts must be used consistently all over the document, ex in use cases, requirements etc>

```plantuml
@startuml


class Account {
	+ usename
	+ email
	+ password
}

class User {
}

note top of User
User who wants to use the app
managing his transaction and categories.
endnote


User - Account : has >





class Transaction {
	+ name
	+ amount
	+ date
}

note bottom of Transaction
Money transaction created by a User.
endnote


class Category {
	+ type
	+ color
}

note bottom of Category
Category that can link together many
transactions.
endnote


Transaction "0..*" - "0..1" Category : labelled >


User --- "0..*" Transaction
User --- "0..*" Category



@enduml
```

# System Design
\<describe here system design>

\<must be consistent with Context diagram>

```plantuml
@startuml

class EzWalletSystem

class EzWalletServer

EzWalletSystem o-- EzWalletServer
EzWalletSystem o-- DataBaseServer


@enduml
```

# Deployment Diagram 

\<describe here deployment diagram >

```plantuml
@startuml


artifact EzWalletServer
node ServerMachine

EzWalletServer ..> ServerMachine : deploy


artifact DataBaseServer
node DBMachine

DataBaseServer ..> DBMachine



ServerMachine - DBMachine : internet


node UserMachine

UserMachine - ServerMachine : internet link


@enduml
```



<!-- CHIDERE:
  - DB admin negli stakerholder
  - Specializzazione User in Admin, COO (in Glossario)
  - Come specificare il tipo di Transaction e Category 
  - Client nel system design?
  - Table of rights?
  - Version Number?
  - Add something about defects found in the project
  - -->