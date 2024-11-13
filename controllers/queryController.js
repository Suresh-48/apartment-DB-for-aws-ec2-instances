import Query from "../models/queryModel.js";
import QueryDocument from "../models/queryDocumentModel.js";
import QueryConversation from "../models/queryConversationModel.js";
import moment from "moment";
import { getPublicImageUrl, uploadBase64File } from "../utils/s3.js";
import mongoose from "mongoose";

export async function createQuery(req, res, next) {
  try {
    const { question, files } = req.body;
    const date = Date.now();
    const createdAt = moment(date).format("lll");
    // Create the query
    const newData = {
      question,
      userId: req.userId,
      createdAt,
    };
    const query = await Query.create(newData);

    if (files && files.length > 0) {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          if (!file.fileName || !file.fileData) {
            throw new Error("Missing file name or data");
          }
          const base64Data = file.fileData;
          const fileType = base64Data.split(";")[0].split("/")[1];
          const newFileName = file.fileName;
          const newFilePath = newFileName;

          return new Promise((resolve, reject) => {
            uploadBase64File(base64Data, newFilePath, (err, mediaPath) => {
              if (err) {
                return reject(err);
              }
              var newobj = {
                userId: req.userId,
                documentName: newFileName,
                documentPath: getPublicImageUrl(mediaPath),
                documentType: fileType,
                createdAt: new Date(),
                queryId: query._id,
              };
              resolve(newobj);
            });
          });
        })
      );
      await QueryDocument.insertMany(uploadedFiles);
    }

    res.status(201).json({
      status: true,
      message: "Query created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "An error occurred while creating query or uploading files",
      error: error.message,
    });
  }
}

export async function getAllMessageById(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const queries = await QueryConversation.find({ queryId: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .populate("userId", "name _id")
      .exec();

    const totalQueries = await Query.countDocuments();

    res.status(200).json({
      status: true,
      data: queries,
      totalPages: Math.ceil(totalQueries / limitNumber),
      currentPage: pageNumber,
      totalQueries,
    });
  } catch (error) {
    console.error("Error fetching queries with pagination:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while fetching queries",
      error: error.message,
    });
  }
}

export async function getAllQueryAndMessageByUser(req, res, next) {
  const userId = req.userId;

  const queryStatus = req.query;
  const queryDateStr = queryStatus.status; 
  let queryDate = new Date(queryDateStr);
  

  if (isNaN(queryDate.getTime())) {
    queryDate = new Date();
  }
  
  const matchStage = {};

  // Apply date filter
  matchStage.createdAt = {
    $gte: new Date(queryDate.setUTCHours(0, 0, 0, 0)), 
    $lte: new Date(queryDate.setUTCHours(24, 0, 0, 0)), 
  };
  if (!userId) {
    res.status(400).json({
      status: true,
      message: "Required user id",
    });
  }
  Query.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        ...matchStage,
      }
    },
    {
      $lookup: {
        from: "queryconversations",
        localField: "_id",
        foreignField: "queryId",
        as: "queryConversation",
      },
    },
    {
      $lookup: {
        from: "querydocuments",
        localField: "_id",
        foreignField: "queryId",
        as: "queryDocuments",
      },
    },
  ])
    .then((result) => {
      res.status(201).json({
        status: true,
        data: result,
      });
    })
    .catch((error) => {
      console.log(error);
    });
}

export async function updateResponseForQuery(req, res, next) {
  try {
    const { files, message } = req.body;
    const date = Date.now();
    const createdAt = moment(date).format("lll");
    const updatedAt = moment(date).format("lll");

    // Create the new conversation entry
    const newData = {
      message,
      userId: req.userId,
      queryId: req.params.id,
      createdAt,
    };

    const query = await QueryConversation.create(newData);

    const update = {
      status: "closed",
      updatedAt,
      updatedBy: req.userId,
    };

    const updatedDocument = await Query.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).populate("userId");

    res.status(201).json({
      status: true,
      data: query,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.log("Error occurred:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while creating the query or uploading files",
      error: error.message,
    });
  }
}

export async function getQueryListForAdmin(req, res, next) {
  
  const queryStatus = req.query;
  const queryDateStr = queryStatus.status; 
  let queryDate = new Date(queryDateStr);
  

  if (isNaN(queryDate.getTime())) {
    queryDate = new Date();
  }
  
  const matchStage = {};

  // Apply date filter
  matchStage.createdAt = {
    $gte: new Date(queryDate.setUTCHours(0, 0, 0, 0)), 
    $lt: new Date(queryDate.setUTCHours(24, 0, 0, 0)), 
  };
  

  const pipeline = [
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: "queryconversations",
        localField: "_id",
        foreignField: "queryId",
        as: "queryConversation",
      },
    },
    {
      $unwind: {        
        path: "$queryConversation",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        // Lookup user data from 'users' collection
        from: "users",
        localField: "queryConversation.userId",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: {
        // Unwind user details
        path: "$userDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        // Add user details to conversation object
        "queryConversation.userDetails": "$userDetails",
      },
    },
    {
      $group: {
        // Group back to reassemble the query documents and conversations
        _id: "$_id",
        status: { $first: "$status" },
        question: { $first: "$question" },
        createdAt: { $first: "$createdAt" },
        queryDocuments: { $first: "$queryDocuments" },
        queryConversation: { $push: "$queryConversation" }, // Rebuild queryConversation array
      },
    },
    {
      $lookup: {
        from: "querydocuments", // Lookup query documents
        localField: "_id",
        foreignField: "queryId",
        as: "queryDocuments",
      },
    },
  ];

  Query.aggregate(pipeline)
    .then((result) => {      
      res.status(200).json({
        status: true,
        data: result,
      });
    })
    .catch((err) => {
      console.error("Error in getQueryListForAdmin:", err); // Log the error for debugging
      next(err); // Pass the error to the custom error-handling middleware
    });
}

export async function updateStatus(req, res, next) {
  if (!req.body.status) {
    return res.status(422).json({ status: false, message: "Required status" });
  }
  const update = { status: req.body.status, updatedBy: req.userId };

  try {
    const updatedDocument = await Query.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).populate("userId");
    if (!updatedDocument) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.status(200).json({
      status: true,
      message: "Query status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error updating document",
      error: error.message,
    });
  }
}

export async function reopenStatus(req, res, next) {
  const update = { status: "request", updatedBy: req.userId };

  try {
    const updatedDocument = await Query.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).populate("userId");
    if (!updatedDocument) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.status(200).json({
      status: true,
      message: "Query re-opened successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error updating document",
      error: error.message,
    });
  }
}
