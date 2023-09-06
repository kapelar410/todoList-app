// these are required packages
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import path from "path"
import _ from "lodash";
import "dotenv/config";

const app = express();
const port = 3000;


app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(path.join("./public")));

// create a new database and connect to the mongodb server
mongoose.connect(process.env.mongodb_url);

// create a new schema
const itemsSchema = new mongoose.Schema({
    name: String
});

// then create a model for the schema (always capitalized)
const Item = mongoose.model("Item", itemsSchema);

// these are documents to be added
const item1 = new Item({
    name: "Welcome to your todolist"
});

const item2 = new Item({
    name: "Hit the 'Add item' button to add items"
});

const item3 = new Item({
    name: "<--- Hit this to delete an item"
});

// store the items in a variable
const defaultItems = [item1, item2, item3];

// create a schema for the custom todo lists
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

// create a model for the custom todolist
const List = mongoose.model("List", listSchema);


app.get("/", async (req, res) => {

    // to find and display all documents in itemsDB
    await Item.find({}).then((items) => {

        if (items.length === 0) {
            // insert many documents in mongoose
            Item.insertMany(defaultItems)
            .then (() => {
                console.log("successfully saved to database")
            })
            .catch((err) => {
                console.log(err)
            });
            res.redirect("/")
        } else {
            res.render("index.ejs", {listTitle: "personal", todo: items} )
        }
        
    })
    .catch((err) => {
        console.log(err)
    });
    
});


// create a parameter for the custom todolist
app.get("/:newCustomList", async (req, res) => {
    const newCustomList = _.capitalize(req.params.newCustomList)

    await List.findOne({name: newCustomList}).then((foundList) => {
        if (!foundList) {
            // create a new list(a new mongoose document)
            const list = new List({
                name: newCustomList,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + newCustomList);
        } else {
            // show an existing list(an existing mongoose document)
            res.render("index.ejs", {listTitle: foundList.name, todo: foundList.items});
        }
    })
    .catch((err) => {
        console.log(err)
    });
    
});

// add and render items to the home route
app.post("/", async (req, res) => {

    const itemName = req.body.pTask;
    const listName = req.body.list;

    // a new item
    const  item = new Item ({
        name: itemName
    });

    if (listName === "personal") {
        // save items to the database
        item.save();
        // render item to home page
         res.redirect("/");
    } else {
        await List.findOne({name: listName}).then((foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        }).catch((err) => {
            console.log(err)
        });
    }


});

// create route to remove items from list
app.post("/delete", (req, res) => {
    const checkedItem = req.body.checkbox;
    const listName = req.body.listName;
    // remove items from home route
    if (listName === "personal") {
        Item.findByIdAndRemove(checkedItem)
    .then(() => {
        console.log("successfully deleted!")
    })
    .catch((err) => {
        console.log(err)
    });
    res.redirect("/");
    } else {
        // remove items from the custom lists
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}})
        .then(() => {
            res.redirect("/" + listName)
        });
    }
    
});





const dateObject = new Date();

const date = dateObject.toUTCString();








app.listen(port, () => {
    console.log(`server is running at ${port}`)
})