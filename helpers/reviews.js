const Review = require('@pbnj-xintern/xintern-commons/models/Review')
const Status = require('@pbnj-xintern/xintern-commons/util/status')
const User = require('@pbnj-xintern/xintern-commons/models/User')
const Rating = require('@pbnj-xintern/xintern-commons/models/Rating')
const Comment = require('@pbnj-xintern/xintern-commons/models/Comment')
const Company = require('@pbnj-xintern/xintern-commons/models/Company')
const db = require('@pbnj-xintern/xintern-commons/util/db')

const mongoose = require('mongoose')

const MONGO_URL = process.env.MONGO_URL

//--------------- FUNCTIONS ---------------

//Returns user ID
const findUserId = async (eventBody) => {
    try {
        let foundUser = await db(MONGO_URL, () => {
            return User.find({
                _id: eventBody.user_id
            })
        })
        console.log('foundUser:\n', foundUser)
        return foundUser[0]._id
    } catch (err) {
        console.error('user does not exist:\n', err.message)
    }
}

//Creates a new Rating obj and saves to db. Returns rating ID
const createRatingAndSave = async (eventBody) => {
    let newRating = Rating({
        _id: new mongoose.Types.ObjectId(),
        culture: eventBody.culture,
        mentorship: eventBody.mentorship,
        impact: eventBody.impact,
        interview: eventBody.interview
    })
    try {
        let result = await db(MONGO_URL, () => {
            return newRating.save().catch(err => {
                console.log('caught err when trying to save Rating to db:\n')
                console.error(err.message)
            })
        })
        console.log('New Rating Created:\n', result)
        return newRating._id
    } catch (err) {
        console.error('caught err while trying to save Rating to db:\n', err.message)
    }
}

//Returns Company obj 
const findCompanyByName = async (eventBody) => {
    try { 
        let foundCompany = await db(MONGO_URL, () => {
            return Company.find({ name: eventBody.company_name.toLowerCase().trim() })
        })
        console.log('Company Found:\n', foundCompany)
        if (foundCompany.length > 0) {
            foundCompany = foundCompany[0]
        } else {
            return Status.createErrorResponse(404, "Company does not exist.")
        }
        return foundCompany
    } catch (err) {
        console.error('caught err while trying to find Company:\n', err.message)
    }
}   

//Returns a Review obj
const getReviewById = async (reviewId) => {
    try {
        let foundReview = await db(MONGO_URL, () => {
            return Review.find({ _id: reviewId }).populate("rating user company")
        })
        console.log('foundReview:\n', foundReview)
        return foundReview[0]
    } catch (err) {
        console.error('review does not exist:\n', err.message)
    }
}

const addCommentToReview = async (reviewId, commentId) => {
    try {
        //grab existing comments from review obj
        let review = await getReviewById(reviewId)
        let existingComments = review.comments
        console.log("commentsList count:", existingComments.length)
        //add new comment to list
        existingComments.push(commentId)
        console.log("added comment, commentsList count:", existingComments.length)
        //update review obj
        let result = await db(MONGO_URL, () => {
            return Review.findByIdAndUpdate(reviewId, {
                comments: existingComments
            }, { new: true })
        })
        if (result)
            return Status.createSuccessResponse(200, {
                message: "Comment successfully added to Review."
            })
    } catch (err) {
        console.error('add comment to review caught error:', err.message)
        return Status.createErrorResponse(400, err.message)
    }
}

const getAllComments = async (reviewId) => {
    try {
        let review = await getReviewById(reviewId)
        return review.comments
    } catch (err) {
        console.error('get all comments caught error:', err.message)
        return Status.createErrorResponse(400, err.message) 
    }
}

//--------------- EXPORTED FUNCTIONS ---------------

//013_FEAT_CRUD-REVIEW
    //createReview 1.0
module.exports.createReview = async (payload) => {
    console.log('payload:\n', payload)
    let foundUserId = await findUserId(payload)
    let newRatingId = await createRatingAndSave(payload) 
    let foundCompany = await findCompanyByName(payload)
    console.log('foundCompany:\n', foundCompany)
    //Create new Review and save
    let newReview = Review({
        _id: new mongoose.Types.ObjectId(),
        salary: payload.salary,
        content: payload.content,
        rating: newRatingId,
        position: payload.position,
        user: foundUserId,
        company: foundCompany._id,
        upvotes: [],
        downvotes: [],
        comments: []
    })
    try {
        let result = await db(MONGO_URL, () => {
            return newReview.save()
        })
        console.log('createReview save status:\n', result)
        return Status.createSuccessResponse(201, { 
            review_id: newReview._id,
            message: "Review successfully CREATED." 
        })
    } catch (err) {
        console.error('caught err while trying to create Review to db:\n', err.message)
    }
}

    //updateReview 2.1
module.exports.updateReviewFields = async (reviewId, payload) => {
    try {
        let result = await db(MONGO_URL, () => {
            return Review.findByIdAndUpdate(reviewId, {
                salary: payload.salary,
                content: payload.content,
                position: payload.position
            }, { new: true })
        })
        console.log('Updated review obj:\n', result)
        if (result) 
            return Status.createSuccessResponse(200, { 
                review_id: reviewId,
                company_id: result.company._id,
                rating_id: result.rating._id,
                message: "Review fields successfully UPDATED." 
            })
    } catch (err) {
        console.error('review does not exist:\n', err.message)
    }
}

    //updateReview 2.2
module.exports.updateReviewRating = async (ratingId, payload) => {
    try {
        let result = await db(MONGO_URL, () => {
            return Rating.findByIdAndUpdate(ratingId, { //rating _id
                culture: payload.culture,
                mentorship: payload.mentorship,
                impact: payload.impact,
                interview: payload.interview
            }, { new: true })
        })
        console.log('Updated Rating obj:\n', result)
        if (result)
            return Status.createSuccessResponse(204, { 
                rating_id: ratingId,
                message: "Rating successfully UPDATED." 
            })
    } catch (err) {
        console.error('rating does not exist:\n', err.message)
    }
}
    //updateReview 2.3
module.exports.updateReviewCompany = async (companyId, payload) => {
    try {
      let result = await db(MONGO_URL, () => {
          return Company.findByIdAndUpdate(companyId, { //company _id
              name: payload.name,
              logo: payload.logo
          }, { new: true })
      })
      console.log('Updated Company obj:\n', result)
      if (result)
        return Status.createSuccessResponse(204, { 
            company_id: companyId,
            message: "Company successfully UPDATED." 
        })
    } catch (err) {
        console.error('company does not exist:\n', err.message)
    }
  }
    //deleteReview 3.1
module.exports.deleteRating = async (ratingId) => {
    try {
        let result = await db(MONGO_URL, () => {
            return Rating.findOneAndDelete({
                _id: ratingId
            })
        })
        if (result) 
            return Status.createSuccessResponse(200, { 
                rating_id: ratingId,
                message: "Rating successfully DELETED." 
            })
    } catch (err) {
        console.error('delete rating caught error:', err.message)
        return Status.createErrorResponse(400, err.message)
    }
}
    //deleteReview 3.2
module.exports.deleteAllComments = async (payload) => {
    try {
        let commentsList = await getAllComments(payload.review_id)
        let result = await db(MONGO_URL, () => {
            return Comment.deleteMany({
                _id: {
                    $in: commentsList //array of comments
                }
            })
        })
        if (result) 
            return Status.createSuccessResponse(200, { 
                message: "All comments successfully DELETED." 
            })
    } catch (err) {
        console.error('delete all comments caught error:', err.message)
        return Status.createErrorResponse(400, err.message)
    }
}
    //deleteReview 3.3
module.exports.deleteReview = async (reviewId) => {
    try {
        let result = await db(MONGO_URL, () => {
            return Review.findOneAndDelete({
                _id: reviewId
            })
        })
        if (result) 
            console.log('Deleted Review obj:\n', result)
            return Status.createSuccessResponse(200, { 
                review_id: reviewId,
                message: "Review successfully DELETED." 
            })
    } catch (err) {
        console.error('delete review caught error:', err.message)
        return Status.createErrorResponse(400, err.message)
    }
}

//014_FEAT_CRUD_COMMENT
    //createComment + link to Review
module.exports.createComment = async (payload) => {
    let reviewId = payload.review_id
    let newComment = Comment({
        _id: new mongoose.Types.ObjectId(),
        content: payload.content,
        upvotes: [],
        downvotes: [],
        parentComment: (Boolean(payload.parent_comment_id)) ? payload.parent_comment_id : null
    })
    try {
        let result = await db(MONGO_URL, () => {
            return newComment.save().catch(err => {
                console.error('caught err when trying to save to db:\n', err.message)
            })
        })
        console.log('new comment:\n', result)
        let newCommentId = result._id
        let response = await addCommentToReview(reviewId, newCommentId) 
        if (response.statusCode === 200)
            return Status.createSuccessResponse(201, { 
                comment_id: newComment._id,
                message: "Comment successfully CREATED." 
            })
    } catch (err) {
        console.error('create comment caught error:', err.message)
        return Status.createErrorResponse(400, err.message)
    }
}
    //deleteComment
module.exports.deleteComment = async (commentId) => {
    try {
        let result = await db(MONGO_URL, () => {
            return Comment.findOneAndDelete({
                _id: commentId
            })
        })
        if (result) 
            return Status.createSuccessResponse(200, { 
                comment_id: commentId,
                message: "Comment successfully DELETED." 
            })
    } catch (err) {
        console.error('delete comment caught error:', err.message)
        return Status.createErrorResponse(400, err.message)
    }
}
    //updateComment
module.exports.updateComment = async (commentId, payload) => {
    try {
        let result = await db(MONGO_URL, () => {
            return Comment.findByIdAndUpdate(commentId, {
                content: payload.content
            }, { new: true })
        })
        if (result)
            return Status.createSuccessResponse(204, {
                message: "Comment successfully UPDATED."
            })
    } catch (err) {
        console.error('update comment caught error:', err.message)
        return Status.createErrorResponse(400, err.message)
    }
}