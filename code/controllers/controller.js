import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import { handleDateFilterParams, handleAmountFilterParams, verifyAuth } from "./utils.js";

/**
 * Create a new category
  - Request Body Content: An object having attributes `type` and `color`
  - Response `data` Content: An object having attributes `type` and `color`
 */
export const createCategory = (req, res) => {
    try {
        const cookie = req.cookies
        if (!cookie.accessToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        const { type, color } = req.body;
        const new_categories = new categories({ type, color });
        new_categories.save()
            .then(data => res.json(data))
            .catch(err => { throw err })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Edit a category's type or color
  - Request Body Content: An object having attributes `type` and `color` equal to the new values to assign to the category
  - Response `data` Content: An object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type
  - Optional behavior:
    - error 401 returned if the specified category does not exist
    - error 401 is returned if new parameters have invalid values
 */
export const updateCategory = async (req, res) => {
    try {

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Delete a category
  - Request Body Content: An array of strings that lists the `types` of the categories to be deleted
  - Response `data` Content: An object with parameter `message` that confirms successful deletion and a parameter `count` that is equal to the count of affected transactions (deleting a category sets all transactions with that category to have `investment` as their new category)
  - Optional behavior:
    - error 401 is returned if the specified category does not exist
 */
export const deleteCategory = async (req, res) => {
    try {

    } catch (error) {
        res.status(400).json({ error: error.message })
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
        const cookie = req.cookies
        if (!cookie.accessToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        let data = await categories.find({})

        let filter = data.map(v => Object.assign({}, { type: v.type, color: v.color }))

        return res.json(filter)
    } catch (error) {
        res.status(400).json({ error: error.message })
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
        const cookie = req.cookies
        if (!cookie.accessToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        const { username, amount, type } = req.body;
        const new_transactions = new transactions({ username, amount, type });
        new_transactions.save()
            .then(data => res.json(data))
            .catch(err => { throw err })
    } catch (error) {
        res.status(400).json({ error: error.message })
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
        const cookie = req.cookies
        if (!cookie.accessToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        /**
         * MongoDB equivalent to the query "SELECT * FROM transactions, categories WHERE transactions.type = categories.type"
         */
        transactions.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" }
        ]).then((result) => {
            let data = result.map(v => Object.assign({}, { _id: v._id, username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
            res.json(data);
        }).catch(error => { throw (error) })
    } catch (error) {
        res.status(400).json({ error: error.message })
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
        const cookie = req.cookies
        if (!cookie.accessToken || !cookie.refreshToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        const username = req.params.username;
        let matchObj = {username: username};
        //Distinction between route accessed by Admins or Regular users for functions that can be called by both
        //and different behaviors and access rights
        if (req.url.indexOf("/transactions/users/") >= 0) {
            //ADMIN
            //TODO: auth type
            const user = await User.findOne({username: username });
            if (!user) 
                return res.status(401).json({ message: "User not found" });
                
        } else {
            //SIMPLE USER
            //TODO: auth type
            const user = await User.findOne({ refreshToken: cookie.refreshToken });
            if (!user) return res.status(401).json({ message: "User not found" });
            if (user.username !== username) // the requested user is not the one logged in
                return res.status(401).json({ message: "Unauthorized" });
            const dateFilter=handleDateFilterParams(req);
            const amountFilter=handleAmountFilterParams(req);
            Object.assign(matchObj, dateFilter, amountFilter);
        }
        transactions.aggregate([
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
        ]).then((result) => {
            let data = result.map(v => Object.assign({}, { _id: v._id, username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
            res.json(data);
        }).catch(error => { throw (error) })
    } catch (error) {
        res.status(400).json({ error: error.message })
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
        const {username, category}=req.params;
        const cookie = req.cookies
        if (!cookie.accessToken || !cookie.refreshToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        const user = await User.findOne({ refreshToken: cookie.refreshToken });
        if (!user) 
            return res.status(401).json({ message: "User not found" });
        if (user.username !== username) // the requested user is not the one logged in
            return res.status(401).json({ message: "Unauthorized" });
        const cat = await categories.findOne({type: category});
        if (!cat) 
            return res.status(401).json({ message: "Category not found" });
            transactions.aggregate([
                {
                    $match: {
                        username:username,
                        type:category
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
            ]).then((result) => {
                let data = result.map(v => Object.assign({}, { _id: v._id, username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
                res.json(data);
            }).catch(error => { throw (error) })
    } catch (error) {
        res.status(400).json({ error: error.message })
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
        const group= await Group.findOne({name:req.params.name});
        if(!group){
            res.status(401).json({error: "Group not found"})
        }
        // Array with group members' usernames
        const groupMembers=await findGroupUsernames(req.params.name);
        transactions.aggregate([
            {
                $match: {
                    username:{$in: groupMembers}
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
        ]).then((result) => {
            let data = result.map(v => Object.assign({}, { _id: v._id, username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
            res.json(data);
        }).catch(error => { throw (error) })
    } catch (error) {
        res.status(400).json({ error: error.message })
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
        const group= await Group.findOne({name:req.params.name});
        if(!group){
            res.status(401).json({error: "Group not found"})
        }
        const cat= await categories.findOne({type:req.params.category});
        if(!cat){
            res.status(401).json({error: "Category not found"})
        }
        // Array with group members' usernames
        const groupMembers=await findGroupUsernames(req.params.name);
        transactions.aggregate([
            {
                $match: {
                    username:{$in: groupMembers},
                    type:req.params.category
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
        ]).then((result) => {
            let data = result.map(v => Object.assign({}, { _id: v._id, username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
            res.json(data);
        }).catch(error => { throw (error) })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Delete a transaction made by a specific user
  - Request Body Content: The `_id` of the transaction to be deleted
  - Response `data` Content: A string indicating successful deletion of the transaction
  - Optional behavior:
    - error 401 is returned if the user or the transaction does not exist
 */
export const deleteTransaction = async (req, res) => {
    try {
        const cookie = req.cookies
        if (!cookie.accessToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        let data = await transactions.deleteOne({ _id: req.body._id });
        return res.json("deleted");
    } catch (error) {
        res.status(400).json({ error: error.message })
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
        const cookie = req.cookies
        if (!cookie.accessToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        const ids=req.body._ids;
        let count= await transactions.countDocuments({_id: {$in: ids}});
        if(count!==ids.length){
            return res.status(401).json({error: "Not every ids could be found"});
        }

        let data = await transactions.deleteMany({_id: {$in: ids}});
        return res.json("deleted");
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}
/** Retrieves the usernames of the members of a group
 * 
 * @param {String} groupName the name of the group
 * @returns {string[]} an array of the usernames 
 */
const findGroupUsernames= async(groupName)=>{
    const members=await Group.aggregate([
        {
            $match: {name:groupName}
        },
        {
            $unwind:"$members"
        },
        {
            $project:{'_id':0,
                'user_id': '$members.user'}
        },
        {
            $lookup: {
              from: 'users',
              localField: "user_id",
              foreignField: "_id",
              as:"user_info"
            }
        },
        {
            $unwind:"$user_info"
        },
        {
            $project: {
              'username': '$user_info.username'
            }
        }
    ])
    return members.map(m=>m.username)
}