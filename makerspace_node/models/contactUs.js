const mongoose = require('mongoose');

const contactQuestions = new mongoose.Schema({
    Name: { type: String, required: true},
    email: { type: String, required: true },
    question: {type: String, required: true}, 
    uniqueId: { type: String, required: true, immutable: true },  
    response:  { type: String }, 
    status: { type:String, default: "new"} 
  }, { timestamps: true });

  const contactUsModel = mongoose.model('contactUsModel', contactQuestions);
  module.exports = contactUsModel;

