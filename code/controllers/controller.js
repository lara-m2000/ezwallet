import { Model, model } from "mongoose";
import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import { handleDateFilterParams, handleAmountFilterParams, verifyAuth } from "./utils.js";
import {getUsernameFromEmail} from "./users.utils.js";
import * as yup from "yup";
import { validateRequest } from "./validate.js";

/**
 * Create a new category
  - Request Body Content: An object having attributes `type` and `color`
  - Response `data` Content: An object having attributes `type` and `color`
 */
export const createCategory = async (req, res) => {
    try {
        //Perform control on authentication
        const adminAuth = verifyAuth(req, res, { authType: "Admin" });
        if (!adminAuth.flag) {
            return res.status(401).json({ error: adminAuth.cause });
        }

        const { type, color } = req.body;

        // Check attributes' validity
        if(typeof type !== 'string' || typeof color !== 'string' || !type.trim() || !color.trim()){
            return res.status(400).json({ error: 'Invalid attribute' });
        }

        //Check if the category already exists
        const category = await categories.findOne({ type: type });
        if (category) {
            return res.status(400).json({ error: "Category with same type already exists" });
        }

        const new_categories = new categories({ type, color });
        const data = await new_categories.save();
        return res.status(200).json({ data: { type: data.type, color: data.color }, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Edit a category's type or color
  - Request Body Content: An object having attributes `type` and `color` equal to the new values to assign to the category
  - Response `data` Content: An object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type
  - Optional behavior:
    - error 400 returned if the specified category does not exist
    - error 400 is returned if new parameters have invalid values
 */
export const updateCategory = async (req, res) => {
    try {
        //Perform control on authentication
        const adminAuth = verifyAuth(req, res, { authType: "Admin" });
        if (!adminAuth.flag) {
            return res.status(401).json({ error: adminAuth.cause });
        }

        //Retrieve from URL params the category to update
        const oldType = req.params.type;

        //Check the validity of req.params.type
        if (!oldType.trim() || typeof oldType !== 'string') {
            return res.status(400).json({ error: "Invalid parameter in request" });
        }

        //Retrieve from request Body the new fields for the category
        const { type, color } = req.body;

        // Check attributes' validity
        if(typeof type !== 'string' || typeof color !== 'string' || !type.trim() || !color.trim()){
            return res.status(400).json({ error: 'Invalid attribute' });
        }

        //Detect if the old category actually exists
        const oldCategory = await categories.findOne({ type: oldType });
        if (!oldCategory) {
            return res.status(400).json({ error: "The category does not exist" });
        }

        // Detect if the new type already exist
        const newExist = await categories.findOne({type : type});
        // If the type passed as parameter and the one passed in the body are equal
        // we can update the color
        if(newExist && type !== oldType){
            return res.status(400).json({error: 'Category type already exists'});
        }

        //Update the target category
        await categories.updateOne({ type: oldType }, { $set: { type: type, color: color } });  // Update the category

        let changes = {modifiedCount : 0};
        if(type !== oldType){// No need to update the transactions if the type is the same
            //Update all the related transactions and retrieve the number of changed transactions
            changes = await transactions.updateMany({ type: oldType }, { $set: { type: type } });
        }

        return res.status(200).json({data: {message: "Category edited successfully", count: changes.modifiedCount}, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Delete a category
  - Request Body Content: An array of strings that lists the `types` of the categories to be deleted
  - Response `data` Content: An object with parameter `message` that confirms successful deletion and a parameter `count` that is equal to the count of affected transactions (deleting a category sets all transactions with that category to have the first category as their new category)
  - Optional behavior:
    - error 400 is returned if the specified category does not exist
    
    - Implementation: 
    -   The existence of all categories is checker, if at least one the passed category does not exist nothing is deleted; 
    -   All non existent categories are specified in the error message.
 */
export const deleteCategory = async (req, res) => {
    try {
        // Validation schema
        const categorySchema = yup.object().shape({
            types: yup.array().of(
                yup.string().strict().required()
            ).strict().required()
        });

        //Perform control on authentication
        const adminAuth = verifyAuth(req, res, { authType: "Admin" });
        if (!adminAuth.flag) {
            return res.status(401).json({ error: adminAuth.cause });
        }

        //Retrieve array of types from request body and eliminate the duplicate values
        const { isValidationOk, body } = validateRequest(req, null, categorySchema);
        if (!isValidationOk) {
            return res.status(400).json({ error: "Wrong format" });
        }
        console.log(req.body, body)

        const typesArr = body.types;
        let types = [];
        for(let i=0;i<typesArr.length;i++)
            if(types.indexOf(typesArr[i])===-1)
                types.push(typesArr[i]);

        //Check validity of req.body
        if (!Array.isArray(types) || types.length === 0) {
            return res.status(400).json({ error: 'Types must be a non-void array' });
        }
        for (const type of types) {
            if (typeof type !== 'string' || !type.trim()) {
                return res.status(400).json({ error: 'Types must be an array of non-void strings' });
            }
        }

        //Get the total number of categories in the database
        const nCategories = await categories.countDocuments();
        if(nCategories <= 1)
            return res.status(400).json({error: 'Not enough categories to perform a deletion'});

        //Check for the existence of all categories, return categories in the db
        let foundCategories = (await categories.find({type: {$in: types}})) ?? [];
        foundCategories = foundCategories.map(e => e.type);
        
        //Return an error if at least one category does not exist
        if (foundCategories.length < types.length) {
            return res.status(400).json({ error: "All categories must exist" });
        }

        let typesToDelete, oldestType;
        //Check if categories to be deleted cover all the categories in the DB
        if (foundCategories.length === nCategories) {
            //Retrieve all types to delete except for the first element (the first according to creationTime)
            oldestType = await categories.find({}).sort({ _id: 1 }).limit(1);
            oldestType = oldestType[0].type;
            
            // Remove the oldest type from the types to delete
            const index = foundCategories.indexOf(oldestType);
            foundCategories.splice(index,1);
            typesToDelete = foundCategories;
            
            //Delete all categories except the first one
            await categories.deleteMany({ type: { $in: typesToDelete } });
        } else {
            //Delete all categories present in req.body.types 
            typesToDelete = types;
            await categories.deleteMany({ type: { $in: typesToDelete } });

            //Retrieve the first created category among the remaining ones
            oldestType = await categories.find({}).sort({ _id: 1 }).limit(1);
            oldestType = oldestType[0].type;
        }
        
        //Update all transactions involved with the type of the category with first creation time
        const result = await transactions.updateMany({ type: { $in: typesToDelete } }, { $set: { type: oldestType } });
        return res.status(200)
            .json({data: {message: "Categories deleted", count: result.modifiedCount,}, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all the categories
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `type` and `color`
  - Optional behavior:
    - empty array is returned if there are no categories
 */
export const getCategories = async (req, res) => {
    try {
        //Perform control on authentication
        const simpleAuth = verifyAuth(req, res, { authType: "Simple" });
        if (!simpleAuth.flag) {
            return res.status(401).json({ error: simpleAuth.cause });
        }
        
        let data = await categories.find({})
        let filter = data.map(v => Object.assign({}, { type: v.type, color: v.color }))

        return res.status(200).json({data: filter, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Create a new transaction made by a specific user
  - Request Body Content: An object having attributes `username`, `type` and `amount`
  - Response `data` Content: An object having attributes `username`, `type`, `amount` and `date`
  - Optional behavior:
    - error 401 is returned if the username or the type of category does not exist
 */
export const createTransaction = async (req, res) => {
    try {
        const auth = verifyAuth(req, res, { authType: "User", username: req.params.username });
        if (!auth.flag) {
            return res.status(401).json({ error: auth.cause })
        }
        const { username, amount, type } = req.body;
        if (!username || !amount || !type || username.trim() === "" || type.trim() === "") {
            return res.status(400).json({ error: "Missing body attributes" });
        }
        if((typeof amount==="string") && amount.trim() === "" ){
            return res.status(400).json({ error: "Missing body attributes" });
        }
        if (username !== req.params.username) {
            return res.status(400).json({ error: "Username mismatch" });
        }
        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }
        const category = await categories.findOne({ type: type });
        if (!category) {
            return res.status(400).json({ error: "Category not found" });
        }
        const checkedAmount = Number(amount);
        if (isNaN(checkedAmount))
            return res.status(400).json({ error: "Invalid 'amount' value" });
        const savedTransaction = await transactions.create({ username, amount: checkedAmount, type });
        const data={username: savedTransaction.username, amount: savedTransaction.amount, type: savedTransaction.type, date:savedTransaction.date}
        res.status(200).json({ data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by all users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - empty array must be returned if there are no transactions
 */
export const getAllTransactions = async (req, res) => {
    try {
        const auth = verifyAuth(req, res, { authType: "Admin" });
        if (!auth.flag) {
            return res.status(401).json({ error: auth.cause }) // unauthorized
        }
        /**
         * MongoDB equivalent to the query "SELECT * FROM transactions, categories WHERE transactions.type = categories.type"
         */
        const result=await transactions.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" }
        ]);
        const data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
        res.status(200).json({ data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage });
        
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by a specific user
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 401 is returned if the user does not exist
    - empty array is returned if there are no transactions made by the user
    - if there are query parameters and the function has been called by a Regular user then the returned transactions must be filtered according to the query parameters
 */
export const getTransactionsByUser = async (req, res) => {
    try {
        const username = req.params.username;
        let matchObj = { username: username };
        let auth;
        //Distinction between route accessed by Admins or Regular users for functions that can be called by both
        //and different behaviors and access rights
        if (req.url.indexOf("/transactions/users/") >= 0) {
            //ADMIN
            auth = verifyAuth(req, res, { authType: "Admin" });
        } else {
            //SIMPLE USER
            auth = verifyAuth(req, res, { authType: "User", username: username });
            const dateFilter = handleDateFilterParams(req);
            const amountFilter = handleAmountFilterParams(req);
            Object.assign(matchObj, dateFilter, amountFilter);
        }
        if (!auth.flag) {
            return res.status(401).json({ error: auth.cause })
        }
        const user = await User.findOne({ username: username });
        if (!user)
            return res.status(400).json({ error: "User not found" });

        const result = await transactions.aggregate([
            {
                $match: matchObj
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" }
        ]);
        let data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
        res.status(200).json({ data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage });

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by a specific user filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects
  - Optional behavior:
    - empty array is returned if there are no transactions made by the user with the specified category
    - error 401 is returned if the user or the category does not exist
 */
export const getTransactionsByUserByCategory = async (req, res) => {
    try {
        const { username, category } = req.params;

        let auth;
        if (req.url.indexOf("/transactions/users/") >= 0) {//Admin
            auth = verifyAuth(req, res, { authType: "Admin" });
        }
        else { //Regular user
            auth = verifyAuth(req, res, { authType: "User", username: username });
        }
        if (!auth.flag) {
            return res.status(401).json({ error: auth.cause });
        }
        const user = await User.findOne({ username: username });
        if (!user)
            return res.status(400).json({ error: "User not found" });
        const dbCategory = await categories.findOne({ type: category });
        if (!dbCategory)
            return res.status(400).json({ error: "Category not found" });
        const result = await transactions.aggregate([
            {
                $match: {
                    username: username,
                    type: category
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" }
        ]);
        let data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
        return res.status(200).json({ data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage });

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by members of a specific group
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - empty array must be returned if there are no transactions made by the group
 */
export const getTransactionsByGroup = async (req, res) => {
    try {
        const group = await Group.findOne({ name: req.params.name });
        if (!group) {
            return res.status(400).json({ error: "Group not found" });
        }
        let auth;
        if (req.url.indexOf("/transactions/groups/") >= 0) {//Admin
            auth = verifyAuth(req, res, { authType: "Admin" })
        }
        else { //Regular user
            const emails = group.members.map((m) => m.email);
            auth = verifyAuth(req, res, { authType: "Group", emails: emails });
        }
        if (!auth.flag) {
            return res.status(401).json({ error: auth.cause });
        }

        const emails = group.members.map((m) => m.email);

        const groupUsername = await getUsernameFromEmail(emails);

        const data = await transactions.aggregate([
            {
                $match: {
                    username: { $in: groupUsername }
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            {
                $unwind: "$categories_info"
            },
            {
                $project: {
                    _id: 0,
                    username: "$username",
                    amount: "$amount",
                    type: "$type",
                    date: "$date",
                    color: "$categories_info.color",
                }
            },
        ]);

        res.status(200).json({ data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by members of a specific group filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects.
  - Optional behavior:
    - error 401 is returned if the group or the category does not exist
    - empty array must be returned if there are no transactions made by the group with the specified category
 */
export const getTransactionsByGroupByCategory = async (req, res) => {
    try {
        const group = await Group.findOne({ name: req.params.name });
        if (!group) {
            return res.status(400).json({ error: "Group not found" });
        }
        const dbCategory = await categories.findOne({ type: req.params.category });
        if (!dbCategory) {
            return res.status(400).json({ error: "Category not found" });
        }
        let auth;
        if (req.url.indexOf("/transactions/groups/") >= 0) {//Admin
            auth = verifyAuth(req, res, { authType: "Admin" })
        }
        else { //Regular user
            const emails = group.members.map((m) => m.email);
            auth = verifyAuth(req, res, { authType: "Group", emails: emails });
        }
        if (!auth.flag) {
            return res.status(401).json({ error: auth.cause });
        }

        const emails = group.members.map((m) => m.email);

        const groupUsername = await getUsernameFromEmail(emails);

        const data = await transactions.aggregate([
            {
                $match: {
                    username: { $in: groupUsername },
                    type: req.params.category,
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            {
                $unwind: "$categories_info"
            },
            {
                $project: {
                    _id: 0,
                    username: "$username",
                    amount: "$amount",
                    type: "$type",
                    date: "$date",
                    color: "$categories_info.color",
                }
            },
        ]);

        res.status(200).json({ data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message })
    }
}

/**
 * Delete a transaction made by a specific user
  - Request Body Content: The `_id` of the transaction to be deleted
  - Response `data` Content: A string indicating successful deletion of the transaction
  - Optional behavior:
    - error 401 is returned if the user or the transaction does not exist
 */
export const deleteTransaction = async (req, res) => { //only called by regular users
    try {
        const username = req.params.username;
        const auth = verifyAuth(req, res, { authType: "User", username: username })
        if (!auth.flag) {
            return res.status(401).json({ error: auth.cause })
        }
        const user = await User.findOne({ username: username })
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }
        const id = req.body._id;
        if (!id || typeof id !== "string" || !id.trim())
            return res.status(400).json({ error: "Missing body attributes" });
        const transactionToDelete = await transactions.findById(id);
        if (!transactionToDelete) {
            return res.status(400).json({ error: "Transaction not found" });
        }
        if (transactionToDelete.username !== user.username) {
            return res.status(400).json({ error: "You can't delete a transaction of another user" });
        }

        let data = await transactions.deleteOne({ _id: req.body._id });
        return res.status(200).json({ data: { message: "Transaction deleted" }, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Delete multiple transactions identified by their ids
  - Request Body Content: An array of strings that lists the `_ids` of the transactions to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if at least one of the `_ids` does not have a corresponding transaction. Transactions that have an id are not deleted in this case
 */
export const deleteTransactions = async (req, res) => {
    try {
        const ids = req.body._ids;
        const auth = verifyAuth(req, res, { authType: "Admin" })
        if (!auth.flag) {
            return res.status(401).json({ error: auth.cause })
        }
        if (!ids) {
            return res.status(400).json({ error: "Missing body attributes" });
        }
        for (const id of ids){
            if(typeof id !== "string" || !id.trim())
                return res.status(400).json({ error: "Invalid transaction id" });
            const t = await transactions.findById(id);
            if (!t) {
                return res.status(400).json({ error: "Invalid transaction id" });
            }
        }

        await transactions.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({
            data: { message: "Transactions deleted" },
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        });
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
/** Retrieves the usernames of the members of a group
 * 
 * @param {String} groupName the name of the group
 * @returns {string[]} an array of the usernames 
 */
const findGroupUsernames = async (groupName) => {
    const members = await Group.aggregate([
        {
            $match: { name: groupName }
        },
        {
            $unwind: "$members"
        },
        {
            $project: {
                '_id': 0,
                'user_id': '$members.user'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: "user_id",
                foreignField: "_id",
                as: "user_info"
            }
        },
        {
            $unwind: "$user_info"
        },
        {
            $project: {
                'username': '$user_info.username'
            }
        }
    ])
    return members.map(m => m.username)
}