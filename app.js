//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

require("dotenv").config();
const srvr = process.env.N1_KEY;
const srvrCred = process.env.N1_SECRET;
const mongoDB = "mongodb+srv://" + srvr + ":" + srvrCred + "@cluster0.57qzj.mongodb.net/todolistDB";


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

//Now using Mongoose
// mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

//using mongoDB Atlas cloud services
// mongoose.connect("mongodb+srv://Upasana_Roy:OuFFMAS1dSudDhOf@cluster0.r85zquh.mongodb.net/todolistDB");
mongoose.connect("mongodb+srv://" + srvr + ":" + srvrCred + "@cluster0.57qzj.mongodb.net/todolistDB");


//Schema
const itemsSchema = {
  name: String
};
//Model
const Item = mongoose.model("Item", itemsSchema);//(singularCollName, schemaName)

//Documents
const item1 = new Item({
  name: "Eat"
});
const item2 = new Item({
  name: "Sleep"
});
const item3 = new Item({
  name: "Be Happy"
});
//puting items in an array
const defaultItems = [item1,item2,item3];
//InsertMany
//to prevent from inserting more thhan once - check is empty
// Item.insertMany(defaultItems).then(function(items){
//   console.log("Successfully saved defaultItems to DB");
// }).catch(function(err){
//   console.log(err);
// });

//new Schema for new lists
const listSchema = {
  name : String,
  items : [itemsSchema] //array of type itemsSchema
};
//model
const List = mongoose.model("List",listSchema)

app.get("/", function(req, res) {

// const day = date.getDate();
//to simplify

//instead of passing the items array

  //Reading while w get the root route
  Item.find({}).then(function(foundItems){ //finding all so empty braces
    // console.log(foundItems);
    if(foundItems.length === 0){
      //InsertMany
      //to prevent from inserting more thhan once - check is empty
      Item.insertMany(defaultItems).then(function(items){
        console.log("Successfully saved defaultItems to DB");
      }).catch(function(err){
        console.log(err);
      });
      res.redirect("/"); //now goes to else and rendering
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});

    }

  }).catch(function(err){
    console.log(err);
  });

  // res.render("list", {listTitle: "Today", newListItems: items});

});

//dynamic routes
app.get("/:newList", function(req, res){
  // const customListName = req.params.newList;
  //to change the list title to camel case
  const customListName = _.capitalize(req.params.newList);

  // new list creation
  // const list = new List({
  //   name: customListName,
  //   items: defaultItems
  // });
  // list.save();//each time u pass the url /Home, a new list with that name is created so use conditions to check
  List.findOne({name: customListName}).then(function(foundList){
    if(!foundList){
      //create a new list
      // console.log("Doesn't exist");
      // new list creation
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    }else{
      //Show an existing list
      // console.log("Exists");
      res.render("list", {listTitle: foundList.name , newListItems: foundList.items});

    }
  }).catch(function(err){});

});//but on adding new item to the custom list it is added to the Today list so we have to modify the submit in list.ejs

app.post("/", function(req, res){

  // const item = req.body.newItem;
  //
  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }

  // //using mongoDB
  // const itemName = req.body.newItem;
  // //creating a new document with this
  // const item = new Item({
  //   name: itemName
  // });
  // item.save();
  //
  // res.redirect("/"); //to display the new item

  //using mongoDB - including custom lists
  const itemName = req.body.newItem;
  //name of the button is list which has the listName
  const listName = req.body.list;
  //creating a new document with this
  const item = new Item({
    name: itemName
  });
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}).then(function(foundList){ //accessing that list with the name
      foundList.items.push(item);//pushing the new item in the items arr of the custom list
      foundList.save();
      res.redirect("/" + listName);
    }).catch(function(err){})
  }

  // res.redirect("/"); //to display the new item

});

// //for removing items
// app.post("/delete", function(req, res){
//   // console.log(req.body);
//   const checkedItemId = req.body.checkbox;
//   Item.findByIdAndRemove(checkedItemId).then(function(){
//     console.log("Successfully deleted");
//     res.redirect("/");
//   })
//   .catch(function(err){
//     console.log(err);
//   })
// }) //when clicked to delete it is redirected to / & searches for the item. But original item is not deleted from the custom list
//so we need to know the id of the item to be deleted and from which list it is from

// //for removing items
// app.post("/delete", function(req, res){
//   // console.log(req.body);
//   const checkedItemId = req.body.checkbox;
//   Item.findByIdAndRemove(checkedItemId).then(function(){
//     console.log("Successfully deleted");
//     res.redirect("/");
//   })
//   .catch(function(err){
//     console.log(err);
//   })
// })

//for removing items - includng those from custom lists
app.post("/delete", function(req, res){
  // console.log(req.body);
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId).then(function(){
      console.log("Successfully deleted");
      res.redirect("/");
    })
    .catch(function(err){
      console.log(err);
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function(foundList){
      res.redirect("/" + listName);
    }).catch(function(err){});
  }

})

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

// app.listen(3000, function() {
//   console.log("Server started on port 3000");
// });

app.listen(process.env.PORT || 3000, function () {
console.log("Server started.");
 });
