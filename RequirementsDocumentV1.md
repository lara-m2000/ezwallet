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
		- [Add transaction, UC1](#add-transaction-uc1)
				- [Scenario 1.1](#scenario-11)
		- [Delete transaction, UC2](#delete-transaction-uc2)
				- [Scenario 2.1](#scenario-21)
				- [Scenario 2.2](#scenario-22)
		- [Show transactions, UC3](#show-transactions-uc3)
				- [Scenario 3.1](#scenario-31)
				- [Scenario 3.2](#scenario-32)
				- [Scenario 3.3](#scenario-33)
		- [User Registration, UC4](#user-registration-uc4)
				- [Scenario 4.1](#scenario-41)
			- [Scenario 4.2](#scenario-42)
		- [User Login, UC5](#user-login-uc5)
				- [Scenario 5.1](#scenario-51)
				- [Scenario 5.2](#scenario-52)
		- [User Logout, UC6](#user-logout-uc6)
				- [Scenario 6.1](#scenario-61)
		- [Add category, UC7](#add-category-uc7)
				- [Scenario 7.1](#scenario-71)
				- [Scenario 7.2](#scenario-72)
		- [Show categories, UC8](#show-categories-uc8)
				- [Scenario 8.1](#scenario-81)
				- [Scenario 8.2](#scenario-82)
				- [Scenario 8.3](#scenario-83)
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
|User|GUI (to be defined)|Keyboard, Screen|

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

```plantuml
@startuml
left to right direction

actor User

rectangle "EzWallet System" as System {
	usecase "Add, Delete, Show Transaction" as Transaction

	usecase Register
	usecase Login
	usecase Logout
	usecase "Show labelled transaction" as Labelled

	usecase "Add, Show Category" as Category
}

User --> Transaction
User --> Register
User --> Login
User --> Category
User --> Logout
Transaction .> Labelled : include

@enduml
```


\<next describe here each use case in the UCD>
### Add transaction, UC1
| Actors Involved        |User|
| ------------- |:-------------:| 
|  Precondition     |User is logged in|
|  Post condition     |Transaction is added|
|  Nominal Scenario     |User adds a new transaction|
|  Variants     ||
|  Exceptions     ||

##### Scenario 1.1 

| Scenario 1.1 |Add transaction (nominal)|
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     | New transaction is added |
| Step#        | Description  |
|1|User creates new transaction with certain attributes|  
|2|System adds new transaction for the user|


### Delete transaction, UC2
| Actors Involved        |User|
| ------------- |:-------------:| 
|  Precondition     |User is logged in|
|  Post condition     |Transaction is deleted|
|  Nominal Scenario     |User deletes an existing transaction|
|  Variants     ||
|  Exceptions     |User deletes a non-existing transaction|

##### Scenario 2.1 

| Scenario 2.1 |Delete transaction (nominal)|
| ------------- |:-------------:| 
|  Precondition     |User is logged in|
|  Post condition     |Transaction is deleted|
| Step#        | Description  |
|1|User deletes an existing transaction|  
|2|System deletes the transaction decided by the user|

##### Scenario 2.2 

| Scenario 2.2 |Delete transaction (exception)|
| ------------- |:-------------:| 
|  Precondition     |User is logged in|
|  Post condition     |Transaction is deleted|
| Step#        | Description  |
|1|User deletes a non existing transaction|  
|2|System does not delete anything|

### Show transactions, UC3
| Actors Involved        |User|
| ------------- |:-------------:| 
|  Precondition     |User is logged in|
|  Post condition     |Transactions are shown to the user|
|  Nominal Scenario     |Transactions are showed to the user|
|  Variants     |Labelled transactions are showed to the user|
|  Exceptions     |There are no transactions in the DB|

##### Scenario 3.1 

| Scenario 3.1 |Show transactions (nominal)|
| ------------- |:-------------:| 
|  Precondition     |User is logged in|
|  Post condition     |Transaction are showed to the user|
| Step#        | Description  |
|1|User asks the system to show the transactions|  
|2|System retrieves and shows the transactions to the user|

##### Scenario 3.2

| Scenario 3.2 |Show transactions (exception1)|
| ------------- |:-------------:| 
|  Precondition     |User is logged in|
|  Post condition     |Empty list of transaction if showed to the user|
| Step#        | Description  |
|1|User asks the system to show the transactions|  
|2|System shows an empty list of transactions to the user|

##### Scenario 3.3

| Scenario 3.3 |Show transactions (variant1)|
| ------------- |:-------------:| 
|  Precondition     |User is logged in|
|  Post condition     |Labelled transactions are showed to the user|
| Step#        | Description  |
|1|User asks the system to show the labeled transactions|  
|2|System retrieves and shows labelled transactions to the user|

### User Registration, UC4

| Actors Involved        |User |
| ------------- |:-------------:| 
|  Precondition     | |
|  Post condition     | User is registerd and authorized |
|  Nominal Scenario     | User want's to register to the EzWallet system |
|  Variants     | |
|  Exceptions     | Server is not available, A User with the same credentials exists |

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

### Add category, UC7
| Actors Involved        |User|
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     | Category added |
|  Nominal Scenario     | A new category is added in the database |
|  Variants     |  |
|  Exceptions     ||

##### Scenario 7.1 

| Scenario 7.1 | Add category (nominal) |
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     | Category added |
| Step#        | Description  |
|  1     | User inserts category type and color |  
|  2     | System creates the new category with the specified type and color|
|3| System saves the created category in the database|


### Show categories, UC8
| Actors Involved        |User|
| ------------- |:-------------:| 
|  Precondition     | User has to be logged in |
|  Post condition     | List of categories |
|  Nominal Scenario     | A list with all available categories is returned |
|  Variants     |  |
|  Exceptions     | No categories in the database |

##### Scenario 8.1 

| Scenario 8.1 | Get categories (nominal) |
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     | List of categories |
| Step#        | Description  |
|  1     | User request the list |  
|  2     | System retrieves the list of categories from the database|
|3|The list of categories is returned|

##### Scenario 8.2

| Scenario 8.2| Get categories (exception) |
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     | Empty list |
| Step#        | Description  |
|  1     | User request the list |  
|  2     | No categories are present in the database|
|3| The system returns an empty list|


# Glossary

\<use UML class diagram to define important terms, or concepts in the domain of the application, and their relationships> 

\<concepts must be used consistently all over the document, ex in use cases, requirements etc>

```plantuml
@startuml


class User {
	+ usename
	+ email
	+ password
}

note top of User
User who wants to use the app
managing his transaction and categories.
endnote



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


' User --- "0..*" Transaction
' User --- "0..*" Category



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
  - Aggiungere eccezioni dovute al fatto che server/db hanno qualche errore ?
  - Glossario, lo scrivo come penso che debba essere fatto, o come è nel codice ?


  ---DEFECTS:
  -No admin implementation
  -Transactions and categories are not tied to the users, everyone can see all transactions and categories
  -Get label does not return transaction with attached label
  -Getusers can be done also by users who are not logged in
  -Getuserbyusername works only if done on the user that is the same of the one who is performing the research
  - -->