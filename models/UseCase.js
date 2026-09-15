const mongoose=require("mongoose");
module.exports=mongoose.model("UseCase",new mongoose.Schema({
 titel:String,
 beschreibung:String,
 kategorie:String,
 nutzen:Number,
 aufwand:Number,
 score:Number
}));