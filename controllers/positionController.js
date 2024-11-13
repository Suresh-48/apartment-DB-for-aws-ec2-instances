import Position from "../models/positionModel.js";
import moment from "moment";
import mongoose from "mongoose";


export async function createPosition(req, res, next) {
    try {

        
        const { position } = req.body;
        const userId = req.userId;

        const date = Date.now();
        const createdAt = moment(date).format("lll");

        if (!position) {
            return res.status(400).json({ message: "Position is required" });
        }

        const newData = {
            position,
            createdAt
        };

        const createData = await Position.create(newData);

        res.status(201).json({
            status: true,
            message: "Position created successfully",
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: "An error occurred while creating ticket or uploading files",
            error: error.message
        });
    }
}

export async function getPositionList(req, res, next) {
    try {
   
        const positions = await Position.find(
            {
              $or: [{ userId: null }, { userId: { $exists: false } }] // Correctly checks for userId null or not set
            },
            { position: 1 }
          ).sort({ position: 1 });
          

        res.status(200).json({
            status: true,
            data: positions
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: "An error occurred while updating the association or uploading files",
            error: error.message
        });
    }
}

export async function updateUserToPosition(req, res, next) {
    try {
        const positionId = req.params.id;
        const userId = req.userId;

        if (!positionId) {
            return res.status(400).json({
                status: false,
                message: "Position id is required",
            });
        }

        const isPositions = await Position.findById(positionId);
        if (!isPositions) {
            return res.status(404).json({
                status: false,
                message: "Cant find position data",
            });
        }
        console.log("isPositions....",isPositions)
        const positions = await Position.findByIdAndUpdate(positionId, { userId: new mongoose.Types.ObjectId(userId) });
        return res.status(200).json({
            status: true,
            message: "Position updated successfully"
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: "An error occurred while updating the association or uploading files",
            error: error.message
        });
    }
}
