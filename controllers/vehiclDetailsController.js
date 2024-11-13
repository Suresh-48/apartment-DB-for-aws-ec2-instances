import mongoose from "mongoose";
import VehicleDetails from "../models/vehicleDetailsModel.js";
import moment from "moment";

export async function createVehicleDetails(req, res, next) {
    try {
        req.body.userid = new mongoose.Types.ObjectId(req.body.userid);
        const data = req.body;
        const date = Date.now();
        const createAt = moment(date).format("lll");
        const newData = {
            userId: data.userid,
            type: data.type,
            createdAt: createAt,
            registrationNumber: data.vehicleRegistrationNumber,
            makeAndModel: data.makeAndModel,
            parkingNumber: data.parkingNumber,
            recievedParkingSticker: data.receivedSticker
        }
        const vehicle = await VehicleDetails.create(newData);

        res.status(201).json({
            status: true,
            message: "Vehicle details created successfully"
        });
    } catch (err) {
        res.status(422).json({
            status: false,
            message: err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message)[0] : "Server side issue"
        });
        next(err);
    }
};

export async function getAllVehicleDetails(req, res, next) {
    try {
        const vehicle = await VehicleDetails.find({ "userId": new mongoose.Types.ObjectId(req.params.id) });
        res.status(200).json(vehicle);
    } catch (error) {
        next(error);
    }
};

export async function getUserByVehicleNumber(req, res, next) {
    try {
        VehicleDetails.aggregate([
            {
                $match: {
                    "registrationNumber": req.body.registrationNumber
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userData"
                }
            },
            {
                $unwind: "$userData"
            },
            {
                $lookup: {
                  from: "blocks",
                  localField: "userData.blockId",
                  foreignField: "_id",
                  as: "blockdata"
                }
              },
              {
                $unwind: "$blockdata"
              },
              {
                $lookup: {
                  from: "flats",
                  localField: "userData.flatId",
                  foreignField: "_id",
                  as: "flatdata"
                }
              },
              {
                $unwind: "$flatdata"
              },
              {
                $project: {
                  name: "$userData.name",
                  blockName: "$blockdata.blockName",
                  flatNumber: "$flatdata.blockName"
                }
              },
        ])
            .then(result => {
                res.status(201).json({
                    status: true,
                    data: result
                });
            }).catch(error => {
                console.log(error)
            })

    } catch (error) {
        next(error);
    }
};

export async function getVehicleDetailsById(req, res, next) {
    try {
        const vehicle = await VehicleDetails.findById(req.params.id);
        if (!vehicle) {
            return res.status(422).json({ status: false, message: "Vehicle Details details not found" });
        }
        res.status(200).json(vehicle);
    } catch (error) {
        next(error);
    }
};


export async function updateVehicleDetailsById(req, res, next) {
    try {
        req.body.updatedAt = new Date();
        const vehicle = await VehicleDetails.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!vehicle) {
            return res.status(422).json({ status: false, message: "Vehicle Details not found" });
        }
        res.status(201).json({
            status: true,
            message: "Vehicle Details updated successfully"
        });
    } catch (err) {
        res.status(422).json({
            status: false,
            message: err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message)[0] : "Server side issue"
        });
        next(err);
    }
};


export async function deleteVehicleDetailsById(req, res, next) {
    try {
        const vehicle = await VehicleDetails.findByIdAndDelete(req.params.id);
        if (!vehicle) {
            return res.status(422).json({ status: true, message: "VehicleDetails details not found" });
        }
        res.status(200).json({ status: true, message: "VehicleDetails details deleted successfully" });
    } catch (error) {
        next(error);
    }
};
