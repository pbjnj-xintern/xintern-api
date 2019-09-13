'use strict';
const axios = require('axios')
const mongoose = require('mongoose')
const Review = require('xintern-commons/models/Review')

const TEST_KEY = process.env.TEST_KEY

//--------------- FUNCTIONS ---------------

//Returns a success response
const sendOKResponse = (statusCode, body) => {
  return {
    statusCode: statusCode,
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  }
}

//Returns an error response
const sendErrorResponse = (statusCode, errorMessage) => {
  console.error('sendErrorRepsonse: console logging error msg:\n', errorMessage)
  return { 
    statusCode: statusCode, 
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ error: errorMessage })
  }
}

//--------------- LAMBDA FUNCTIONS ---------------

module.exports.createReview = async (event) => {
  // let author = //grab User obj from event/context

  //grab properties from event param
  let newReview = Review({
    salary: 100000,
    content: "this is great movie",
    position: "CRM Developer"
    // user: //User
  })
  try {
    //send newReview obj to db
    return sendOKResponse(201, 'Review successfully created!')
  } catch (err) {
    console.error('caught error:', err.message)
    return sendErrorResponse(400, err.message)
  }
};

// Review model
// {
//   _id: mongoose.Schema.Types.ObjectId,
//   salary: { type: Number, required: true },
//   createdAt: { type: mongoose.Schema.Types.Date, default: new Date(), required: true },
//   deletedAt: { type: mongoose.Schema.Types.Date, default: null },
//   content: { type: String, required: true },
//   position: { type: String, required: true },
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
//   flagged: { type: mongoose.Schema.Types.Boolean, default: false },
//   upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
// }