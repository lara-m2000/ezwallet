# Requirements Document - current EZWallet

Date: 2023-04-26

Version: V6 - description of EZWallet in CURRENT form

| Version number | Change |
| -------------- | :----- |
|1.0|Added stakeholders, context diagram and stories and personas|
|1.1|Added interfaces|
|2.0|Added FR and NF     |
|3.0|Added Glossary, System design and Deployment diagram|
|4.0|Added use cases|
|5.0|Added use case diagram|
|6.0|Added defects|

# Contents

- [Requirements Document - current EZWallet](#requirements-document---current-ezwallet)
- [Contents](#contents)
- [Informal description](#informal-description)
- [Stakeholders](#stakeholders)
- [Context Diagram and interfaces](#context-diagram-and-interfaces)
	- [Context Diagram](#context-diagram)
	- [Interfaces](#interfaces)
- [Stories and personas](#stories-and-personas)
	- [Persona1](#persona1)
		- [Story](#story)
	- [Persona2](#persona2)
		- [Story](#story-1)
	- [Persona3](#persona3)
		- [Story](#story-2)
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
		- [Registration, UC4](#registration-uc4)
				- [Scenario 4.1](#scenario-41)
				- [Scenario 4.2](#scenario-42)
		- [Login, UC5](#login-uc5)
				- [Scenario 5.1](#scenario-51)
				- [Scenario 5.2](#scenario-52)
		- [Logout, UC6](#logout-uc6)
				- [Scenario 6.1](#scenario-61)
		- [Add category, UC7](#add-category-uc7)
				- [Scenario 7.1](#scenario-71)
		- [Show categories, UC8](#show-categories-uc8)
				- [Scenario 8.1](#scenario-81)
				- [Scenario 8.2](#scenario-82)
		- [Show users, UC9](#show-users-uc9)
				- [Scenario 9.1](#scenario-91)
		- [Get info about account, UC10](#get-info-about-account-uc10)
				- [Scenario 10.1](#scenario-101)
- [Glossary](#glossary)
- [System Design](#system-design)
- [Deployment Diagram](#deployment-diagram)
- [Defects](#defects)

# Informal description

EZWallet (read EaSy Wallet) is a software application designed to help individuals and families keep track of their expenses. Users can enter and categorize their expenses, allowing them to quickly see where their money is going. EZWallet is a powerful tool for those looking to take control of their finances and make informed decisions about their spending.

# Stakeholders

| Stakeholder name |                      Description                       |
| ---------------- | :----------------------------------------------------: |
| Users            |                Individuals and families                |
| Developers       |                Testers and programmers                 |
| Competitors      | Satispay/Postepay (functionality that tracks expenses) |
| Admin            |              User with special privileges              |

# Context Diagram and interfaces

## Context Diagram

```plantuml
@startuml

usecase EzWallet
actor User

User -- EzWallet

@enduml
```

## Interfaces

| Actor |  Logical Interface  | Physical Interface |
| ----- | :-----------------: | -----------------: |
| User  | GUI (to be defined) |   Keyboard, Screen |

# Stories and personas

## Persona1

Persona1: male, middle-age, low income, father, married with children

Persona1, work day: wake up, breakfast, drive children to school, return home for smart working

Persona1, week end day: wake up, prepare breakfast for family, go out with its family, hang out with friends at night

### Story

He finds out he is spending too much money than expected, need an easy to use app to keep track of his expenses, in order to be able to maintain his family and keep on having fun with his hobbies.

## Persona2

Persona2: female, young, just graduated, high income, no children, no husband.

Persona2, work day: wakes up, breakfast, drives to work, lunch break, returns to work, returns home at 7 pm

### Story

Finds herself with a high income just after graduation, needs a way to manage the great unexpected amount of money she is gaining.

## Persona3

Persona3: male, old, retired, low income, children and grandchildren, married

Persona3: day: wake up, breakfast, read newspaper, walk to a bar, head back home

### Story

He does not spend a lot of money on himself, but likes to help his children and give presents to his grandchildren on special occasions. Because of his low pension, he needs to keep an eye on his spending.
His limited knowledge of technology does not allow him to use services that are too complex.

# Functional and non functional requirements

## Functional Requirements

| ID      |         Description         |
| ------- | :-------------------------: |
| FR1     |     Manage user account     |
| FR1.1   |            Login            |
| FR1.2   |           Logout            |
| FR1.3   |          Authorize          |
| FR1.4   | Register (name, email, pwd) |
| FR1.5   |    Show registered users    |
| FR1.5.1 | Get info about user account |
| FR2     |      Manage categories      |
| FR2.1   |        Add category         |
| FR2.2   |       Show categories       |
| FR3     |     Manage transactions     |
| FR3.1   |       Add transaction       |
| FR3.2   |     Delete transaction      |
| FR3.3   |      Show transactions      |
| FR3.4   | Show labelled transactions  |

## Non Functional Requirements

| ID   | Type (efficiency, reliability, ..) |                                                      Description                                                      |   Refers to |
| ---- | :--------------------------------: | :-------------------------------------------------------------------------------------------------------------------: | ----------: |
| NFR1 |             Usability              |               Should be used with no training by users with at least 6 months experience with computers               | FR1,FR2,FR3 |
| NFR2 |             Efficiency             |                                  Response time lower than 100ms in optimal condition                                  | FR1,FR2,FR3 |
| NFR3 |            Availability            |                                          Available for the 99.999% in a year                                          | FR1,FR2,FR3 |
| NFR4 |            Reliability             |       Less than 4 minor/medium defects per month. Less than 1 severe defect per year. 0 killer defects per year       | FR1,FR2,FR3 |
| NFR5 |              Security              | GDPR. Legislative requirements of the country in which the application will be used. Only authorized users can access | FR1,FR2,FR3 |

# Use case diagram and use cases

## Use case diagram

```plantuml
@startuml
left to right direction

actor User

rectangle "EzWallet System" as System {
	usecase "Add, Delete, Show, Show labelled transaction" as Transaction

	usecase Register
	usecase Login
	usecase Logout

	usecase "Add, Show category" as Category

	usecase "Show Users" as SUsers
	usecase "Get info about account" as UUsers
}

User --> Transaction
User --> Category
User --> Register
User --> Login
User --> Logout
User --> SUsers
User --> UUsers


@enduml
```

### Add transaction, UC1

| Actors Involved  |            User             |
| ---------------- | :-------------------------: |
| Precondition     |      User is logged in      |
| Post condition   |    Transaction is added     |
| Nominal Scenario | User adds a new transaction |
| Variants         |                             |
| Exceptions       |                             |

##### Scenario 1.1

| Scenario 1.1   |              Add transaction (nominal)               |
| -------------- | :--------------------------------------------------: |
| Precondition   |                  User is logged in                   |
| Post condition |               New transaction is added               |
| Step#          |                     Description                      |
| 1              | User creates new transaction with certain attributes |
| 2              |             System adds new transaction              |

### Delete transaction, UC2

| Actors Involved  |                  User                   |
| ---------------- | :-------------------------------------: |
| Precondition     |            User is logged in            |
| Post condition   |         Transaction is deleted          |
| Nominal Scenario |  User deletes an existing transaction   |
| Variants         |                                         |
| Exceptions       | User deletes a non-existing transaction |

##### Scenario 2.1

| Scenario 2.1   |            Delete transaction (nominal)            |
| -------------- | :------------------------------------------------: |
| Precondition   |                 User is logged in                  |
| Post condition |               Transaction is deleted               |
| Step#          |                    Description                     |
| 1              |        User deletes an existing transaction        |
| 2              | System deletes the transaction decided by the user |

##### Scenario 2.2

| Scenario 2.2   |     Delete transaction (exception)      |
| -------------- | :-------------------------------------: |
| Precondition   |            User is logged in            |
| Post condition |         Transaction is deleted          |
| Step#          |               Description               |
| 1              | User deletes a non existing transaction |
| 2              |     System does not delete anything     |

### Show transactions, UC3

| Actors Involved  |                     User                     |
| ---------------- | :------------------------------------------: |
| Precondition     |              User is logged in               |
| Post condition   |      Transactions are shown to the user      |
| Nominal Scenario |     Transactions are showed to the user      |
| Variants         | Labelled transactions are showed to the user |
| Exceptions       |    There are no transactions inserted yet    |

##### Scenario 3.1

| Scenario 3.1   |               Show transactions (nominal)               |
| -------------- | :-----------------------------------------------------: |
| Precondition   |                    User is logged in                    |
| Post condition |           Transaction are showed to the user            |
| Step#          |                       Description                       |
| 1              |      User asks the system to show the transactions      |
| 2              | System retrieves and shows the transactions to the user |

##### Scenario 3.2

| Scenario 3.2   |             Show transactions (exception1)             |
| -------------- | :----------------------------------------------------: |
| Precondition   |    User is logged in, no transactions inserted yet     |
| Post condition |    Empty list of transaction if showed to the user     |
| Step#          |                      Description                       |
| 1              |     User asks the system to show the transactions      |
| 2              | System shows an empty list of transactions to the user |

##### Scenario 3.3

| Scenario 3.3   |                 Show transactions (variant1)                 |
| -------------- | :----------------------------------------------------------: |
| Precondition   |                      User is logged in                       |
| Post condition |         Labelled transactions are showed to the user         |
| Step#          |                         Description                          |
| 1              |    User asks the system to show the labelled transactions    |
| 2              | System retrieves and shows labelled transactions to the user |

### Registration, UC4

| Actors Involved  |                     User                      |
| ---------------- | :-------------------------------------------: |
| Precondition     |                                               |
| Post condition   |       User is registerd and authorized        |
| Nominal Scenario | User wants to register to the EzWallet system |
| Variants         |                                               |
| Exceptions       |    A User with the same credentials exists    |

##### Scenario 4.1

| Scenario 4.1   |                       (Nominal)                        |
| -------------- | :----------------------------------------------------: |
| Precondition   |                                                        |
| Post condition |                   User is registered                   |
| Step#          |                      Description                       |
| 1              |            User asks the system to register            |
| 2              |            System asks for his credentials             |
| 3              |                User inserts credentials                |
| 4              | System checks if (username, password, email) are valid |
| 5              |                   User is registered                   |

##### Scenario 4.2

| Scenario 4.2   |                      (Exception)                       |
| -------------- | :----------------------------------------------------: |
| Precondition   |                   User is registered                   |
| Post condition |              New User registration failed              |
| Step#          |                      Description                       |
| 1              |            User asks the system to register            |
| 2              |            System asks for his credentials             |
| 3              |                User inserts credentials                |
| 4              | System checks if (username, password, email) are valid |
| 5              | Email is already used, an error is showed to the user  |

### Login, UC5

| Actors Involved  |                    User                    |
| ---------------- | :----------------------------------------: |
| Precondition     |             User is registered             |
| Post condition   |      User is logged in and authorized      |
| Nominal Scenario | User wants to login to the EzWallet System |
| Variants         |                                            |
| Exceptions       |     The login credentials are invalid      |

##### Scenario 5.1

| Scenario 5.1   |                        (Nominal)                         |
| -------------- | :------------------------------------------------------: |
| Precondition   |                    User is registered                    |
| Post condition |             User is logged in and authorized             |
| Step#          |                       Description                        |
| 1              |              User asks the system to login               |
| 2              |             System asks for his credentials              |
| 3              |                 User inserts credentials                 |
| 4              | System checks if (username, password, email) are correct |
| 5              |                    User is logged in                     |

##### Scenario 5.2

| Scenario 5.2   |                       (Exception)                        |
| -------------- | :------------------------------------------------------: |
| Precondition   |           User is registered or not registered           |
| Post condition |                  User is not logged in                   |
| Step#          |                       Description                        |
| 1              |              User asks the system to login               |
| 2              |             System asks for his credentials              |
| 3              |                 User inserts credentials                 |
| 4              | System checks if (username, password, email) are correct |
| 5              |       Credentials not correct, system rejects User       |

### Logout, UC6

| Actors Involved  |                     User                     |
| ---------------- | :------------------------------------------: |
| Precondition     |       User is logged id and authorized       |
| Post condition   |              User is logged out              |
| Nominal Scenario | User wants to logout fom the EzWallet System |
| Variants         |                                              |
| Exceptions       |                                              |

##### Scenario 6.1

| Scenario 6.1   |            (Nominal)             |
| -------------- | :------------------------------: |
| Precondition   |        User is registered        |
| Post condition | User is logged in and authorized |
| Step#          |           Description            |
| 1              |       User asks to logout        |
| 2              |        User is logged out        |

### Add category, UC7

| Actors Involved  |          User           |
| ---------------- | :---------------------: |
| Precondition     |    User is logged in    |
| Post condition   |     Category added      |
| Nominal Scenario | A new category is added |
| Variants         |                         |
| Exceptions       |                         |

##### Scenario 7.1

| Scenario 7.1   |                      Add category (nominal)                       |
| -------------- | :---------------------------------------------------------------: |
| Precondition   |                         User is logged in                         |
| Post condition |                          Category added                           |
| Step#          |                            Description                            |
| 1              |               User inserts category type and color                |
| 2              | System creates the new category with the specified type and color |

### Show categories, UC8

| Actors Involved  |                       User                       |
| ---------------- | :----------------------------------------------: |
| Precondition     |             User has to be logged in             |
| Post condition   |                List of categories                |
| Nominal Scenario | A list with all available categories is returned |
| Variants         |                                                  |
| Exceptions       |              No categories inserted              |

##### Scenario 8.1

| Scenario 8.1   |        Show categories (nominal)        |
| -------------- | :-------------------------------------: |
| Precondition   |            User is logged in            |
| Post condition |           List of categories            |
| Step#          |               Description               |
| 1              |          User request the list          |
| 2              | System retrieves the list of categories |
| 3              |   The list of categories is returned    |

##### Scenario 8.2

| Scenario 8.2   |   Show categories (exception)    |
| -------------- | :------------------------------: |
| Precondition   |        User is logged in         |
| Post condition |            Empty list            |
| Step#          |           Description            |
| 1              |      User request the list       |
| 2              |    No categories are present     |
| 3              | The system returns an empty list |

### Show users, UC9

WARNING: this use case is actually a defect of the app, since this should be an only-admin usecase, but can be done not only by normal logged users,
but also by non logged users.

| Actors Involved  |                           User                           |
| ---------------- | :------------------------------------------------------: |
| Precondition     |                                                          |
| Post condition   |            List of registered users is showed            |
| Nominal Scenario | A list with all registered users is returned to the user |
| Variants         |                                                          |
| Exceptions       |                                                          |

##### Scenario 9.1

| Scenario 9.1   |            Show users (nominal)             |
| -------------- | :-----------------------------------------: |
| Precondition   |                                             |
| Post condition |     List of registered users is showed      |
| Step#          |                 Description                 |
| 1              |       User requests the list of users       |
| 2              | System retrieves users and returns the list |

### Get info about account, UC10

| Actors Involved  |                         User                          |
| ---------------- | :---------------------------------------------------: |
| Precondition     |                   User is logged in                   |
| Post condition   |                Account info are showed                |
| Nominal Scenario | Info of the account of the requesting user are showed |
| Variants         |                                                       |
| Exceptions       |                                                       |

##### Scenario 10.1

| Scenario 10.1  |          Get info about account (nominal)           |
| -------------- | :-------------------------------------------------: |
| Precondition   |                  User is logged in                  |
| Post condition |               Filtered user is showed               |
| Step#          |                     Description                     |
| 1              | User asks the system information about his profile  |
| 2              | System retrieves and returns info about the profile |

# Glossary

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

note top of Transaction
Money transaction created by a User.
endnote


class Category {
	+ type
	+ color
}

note top of Category
Category that can refer to many
transactions.
endnote


Transaction "0..*" -- "0..1" Category : labelled >


' User --- "0..*" Transaction
' User --- "0..*" Category



@enduml
```

# System Design

```plantuml
@startuml

class EzWalletSystem
class EzWalletServer

EzWalletSystem o-- EzWalletServer
EzWalletSystem o-- DataBaseServer


@enduml
```

# Deployment Diagram

```plantuml
@startuml


artifact EzWalletServer
artifact DataBaseServer
node ServerMachine

EzWalletServer ..> ServerMachine : deploy
DataBaseServer ..> ServerMachine : deploy


node UserMachine


UserMachine - ServerMachine : internet link


@enduml
```

# Defects

- No admin implementation
- Transactions and categories are not tied to the users who created them, everyone can see all transactions and categories
- GetLabels does not return transaction with attached category color
- GetUsers can be done also by users who are not logged in
