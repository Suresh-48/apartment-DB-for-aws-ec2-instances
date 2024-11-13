import Flat from "../models/flatModal.js";
import { getAll } from "../controllers/baseController.js";
import moment from "moment";
import Block from "../models/blockModel.js";
import mongoose from "mongoose";

export async function createFlat(req, res, next) {
  try {
    const { blockId, flats, createdBy } = req.body;


    // Check if the block exists
    const blockData = await Block.findById(blockId);

    if (!blockData) {
      return res.status(404).json({
        status: false,
        message: "Block not found",
      });
    }

    const createdFlats = [];
    const errors = [];

    // Handle all flats in parallel
    const promises = flats.map(async (flat) => {

      try {
        const existingFlat = await Flat.findOne({
          blockId: blockId,
          flatName: flat.flatName,
          floorName: flat.floorName,
        }); // check Flat is exist or not
        if (!existingFlat) {
          const date = Date.now();
          const createAt = moment(date).format("lll");
          const createData = await Flat.create({
            flatName: flat.flatName,
            blockId: blockId,
            squareFeet: flat.squareFeet,
            floorName: flat.floorName,
            createdBy: createdBy,
            createdAt: createAt,
          });

          createdFlats.push(createData);
        }
      } catch (err) {
        errors.push(`Error creating flat ${flat}: ${err.message}`);
      }
    });

    await Promise.all(promises);

    res.status(201).json({
      status: true,
      data: createdFlats,
      message: "Flats created successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      const firstValidationErrorField = Object.keys(validationErrors)[0];
      const errorMessage = validationErrors[firstValidationErrorField];

      return res.status(422).json({
        status: false,
        message: errorMessage,
      });
    }

    // Pass other errors to the default error handler
    next(error);
  }
}

export async function createMultipleFlats(req, res, next) {
  try {
    const flats = req.body;

    if (!Array.isArray(flats)) {
      return res
        .status(400)
        .json({ error: "Request body must be an array of blocks." });
    }

    const errors = [];
    const createdFlats = [];

    for (const flat of flats) {
      const { flatId, flatName, blockId, createdBy } = flat;

      const existingFlat = await Flat.findOne({
        blockId: blockId,
        flatId: flatId,
      });

      if (!flatId || !flatName) {
        const validationErrors = {};
        if (!flatId) validationErrors.flatId = "Flat Id is required.";
        if (!flatName) validationErrors.flatName = "Flat Name is required.";
        errors.push({ flatId, errors: validationErrors });
        continue;
      }

      if (existingFlat) {
        errors.push({ flatId, error: "Flat Id already exists in same Block." });
        continue;
      }

      const date = Date.now();
      const createAt = moment(date).format("lll");

      const newFlat = await Flat.create({
        blockId: blockId,
        flatId: flatId,
        flatName: flatName,
        isActive: false,
        createdBy: createdBy,
        createdAt: createAt,
      });

      createdFlats.push(newFlat);
    }

    if (errors.length > 0) {
      return res
        .status(400)
        .json({ error: "Some flats could not be created.", errors });
    }

    res.status(201).json({
      status: true,
      data: createdFlats,
      message: "Apartment flats created successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      const firstValidationErrorField = Object.keys(validationErrors)[0];
      const errorMessage = validationErrors[firstValidationErrorField];

      return res.status(422).json({
        status: false,
        message: errorMessage,
      });
    }
    next(error);
  }
}

export async function getAllSquareFeetbyFlat(req, res, next) {
  try {
    const flat = await Flat.find({ isBooked: true }, { flatName: 1, floorName: 1, squareFeet: 1 });
    res.status(200).json(flat);
  } catch (err) {
    res.status(422).json({
      status: false,
      message: err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message)[0] : "Server side issue"
    });
    next(err);
  }
};

export async function getBlockFlatList(req, res, next) {
  try {
    const { blockId, residentType } = req.body;

    var filter = { blockId: blockId, isBooked: false };

    if (residentType == "Rental") {
      filter.isBooked = true;
      filter.apartmentType = "C";  // C is rental
      filter.rentalBooked = false
    }
    const getFlatData = await Flat.find(filter);

    res.status(201).json({
      status: true,
      data: getFlatData,
      message: "Get block flat list successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentDetails(req, res, next) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "Required user id",
      });
    }
    const userData = await User.findById(userId)
      .populate("flatId");
    return res.status(201).json({
      status: true,
      data: userData
    });
  }
  catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

export async function getApartmentSquareFeet(req, res, next) {
  try {
    const result = await Flat.aggregate([
      {
        $group: {
          _id: null,
          totalSquareFeet: { $sum: "$squareFeet" }
        }
      }
    ]);
    const totalSquareFeet = result.length > 0 ? result[0].totalSquareFeet : 0;

    return res.status(200).json({
      status: true,
      totalSquareFeet: totalSquareFeet
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message
    });
  }
}


export async function deleteFlats(req, res, next) {
  try {
    const id = req.params.id;

    const checkData = await Flat.findById(id);
    if (!checkData) {
      return res.status(400).json({
        status: false,
        message: "No flats found this Id",
      });
    }

    const deleteData = await Flat.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Flat deleted successFully",
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllFlatList(req, res, next) {
  Flat.find({}, { flatName: 1 })
    .then((docs) => {
      if (docs) {
        return res.status(400).json({
          status: true,
          data: docs,
        });
      }
    })
    .catch((err) => next(err));
}

export async function getEntireByFlats(req, res, next) {
  try {
    if (!req.body.flatId) {
      return res.status(422).json({
        status: false,
        message: "Flat id is required",
      });
    }
    Flat.aggregate([
      // Match the specific flat document based on flatId
      {
        $match: { _id: new mongoose.Types.ObjectId(req.body.flatId) },
      },
      {
        $lookup: {
          from: "blocks",
          localField: "blockId",
          foreignField: "_id",
          as: "blockDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "flatId",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "ownerdocuments",
          localField: "userDetails._id",
          foreignField: "userId",
          as: "ownerDocuments",
        },
      },
      {
        $lookup: {
          from: "familymembers",
          localField: "userDetails._id",
          foreignField: "userId",
          as: "familyMembers",
        },
      },
      {
        $lookup: {
          from: "owners",
          localField: "userDetails._id",
          foreignField: "userId",
          as: "ownerDetails",
        },
      },
      {
        $lookup: {
          from: "pets",
          localField: "userDetails._id",
          foreignField: "userId",
          as: "petsDetails",
        },
      },
      {
        $project: {
          _id: 1,
          flatId: 1,
          flatName: 1,
          blockDetails: { $arrayElemAt: ["$blockDetails", 0] },
          userDetails: 1,
          ownerDocuments: 1,
          familyMembers: 1,
          ownerDetails: 1,
          petsDetails: 1,
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
  } catch (err) {
    next(err);
  }
}

export const getAllFlat = getAll(Flat);
