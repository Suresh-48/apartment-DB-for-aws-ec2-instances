import Block from "../models/blockModel.js";
import Flat from "../models/flatModal.js";
import { getAll } from "../controllers/baseController.js";
import moment from "moment";

export async function createBlocks(req, res, next) {
  try {
    const { blockName, createdBy } = req.body;

    const blockNameRegExp = new RegExp(
      `^${blockName.replace(/\s+/g, "\\s*")}$`,
      "i"
    );
    

    const existingBlock = await Block.findOne({ blockName: blockNameRegExp });

    if (!blockName) {
      const errors = {};
      if (!blockName) errors.blockName = "Block Name is required.";
      return res.status(400).json({ error: "Validation Error", errors });
    }

    if (existingBlock) {
      return res.status(400).json({
        message: "Block Name already exists.",
      });
    } else {
      const date = Date.now();
      const createAt = moment(date).format("lll");
      const createData = await Block.create({
        blockName: blockName,
        createdBy: createdBy,
        createdAt: createAt,
      });

      res.status(201).json({
        status: true,
        data: createData,
        message: "Blocks name created successfully",
      });
    }
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
    next(err);
  }
}

export async function createMultipleBlocks(req, res, next) {
  try {
    const blocks = req.body;

    if (!Array.isArray(blocks)) {
      return res
        .status(400)
        .json({ error: "Request body must be an array of blocks." });
    }

    const errors = [];
    const createdBlocks = [];

    for (const block of blocks) {
      const { blockId, blockName, createdBy } = block;

      const existingBlock = await Block.findOne({ blockId: blockId });

      if (!blockId || !blockName) {
        const validationErrors = {};
        if (!blockId) validationErrors.blockId = "Block Id is required.";
        if (!blockName) validationErrors.blockName = "Block Name is required.";
        errors.push({ blockId, errors: validationErrors });
        continue;
      }

      if (existingBlock) {
        errors.push({ blockId, error: "Block Id already exists." });
        continue;
      }

      const date = Date.now();
      const createAt = moment(date).format("lll");

      const newBlock = await Block.create({
        blockId: blockId,
        blockName: blockName,
        isActive: false,
        createdBy: createdBy,
        createdAt: createAt,
      });

      createdBlocks.push(newBlock);
    }

    if (errors.length > 0) {
      return res
        .status(400)
        .json({ error: "Some blocks could not be created.", errors });
    }

    res.status(201).json({
      status: true,
      data: createdBlocks,
      message: "Apartment blocks created successfully",
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

export async function getAllBlockandFlats(req, res, next) {
  try {
    const data = await Block.aggregate([
      {
        $lookup: {
          from: "flats",
          localField: "_id",
          foreignField: "blockId",
          as: "flats",
        },
      },
      {
        $project: {
          _id: 0,
          blockId: "$_id",
          blockName: 1,
          flats: {
            $map: {
              input: "$flats",
              as: "flat",
              in: {
                isBooked: "$$flat.isBooked",
                flatId: "$$flat._id",
                flatName: "$$flat.flatName",
                floorName: "$$flat.floorName",
                squareFeet: "$$flat.squareFeet",
              },
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Get Blocks Details Successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteBlocks(req, res, next) {
  try {
    const blockId = req.params.id;

    // Find all flats associated with the blockId
    const flatData = await Flat.find({ blockId });

    // Delete all flats associated with the blockId
    await Flat.deleteMany({ blockId });

    // Delete the block itself
    const deletedBlock = await Block.findByIdAndDelete(blockId);

    if (!deletedBlock) {
      return res.status(404).json({
        status: false,
        message: 'Block not found.',
      });
    }

    res.status(200).json({
      status: true,
      message: 'Blocks deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllBlockList(req, res, next) {
  Block.find({}, { blockName: 1 })
    .then(docs => {
      if (docs) {
        return res.status(200).json({
          status: true,
          data: docs,
        });
      }
    })
    .catch(err => next(err));
}

export const getAllBlocks = getAll(Block);
