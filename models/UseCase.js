const mongoose=require("mongoose");
module.exports=mongoose.model("UseCase",new mongoose.Schema({
 titel:String,
 beschreibung:String,
 nutzen:Number,
 aufwand:Number,
 score:Number,
 branche:String,
 problemtyp:String,
 risiko:{type:String,enum:['Niedrig','Mittel','Hoch'],default:'Mittel'}
}));