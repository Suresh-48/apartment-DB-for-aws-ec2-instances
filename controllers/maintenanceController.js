import moment from "moment";
import Maintenance from "../models/maintenanceModels.js";

export async function createMaintenance(req, res, next) {
    try {
        const { shortName, description, startDate, months } = req.body;

        if (!shortName || !description || !startDate || !months) {
            return res.status(400).json({
                status: false,
                message: "All fields are required"
            });
        }
        let month = Number(months);

        if (isNaN(month) || month <= 0) {
            return res.status(400).json({
                status: false,
                message: "Months must be a positive number"
            });
        }

        const date = Date.now();
        const createdAt = moment(date).format("lll");

        const start = moment(startDate);
        if (!start.isValid()) {
            return res.status(400).json({
                status: false,
                message: "Invalid start date"
            });
        }

        const endDate = moment(start).add(months, 'months').format("lll");

        const newData = {
            shortName,
            description,
            startDate,
            months,
            endDate,
            userId: req.userId,
            createdAt,
        };

        await Maintenance.create(newData);

        res.status(201).json({
            status: true,
            message: "Maintenance details created successfully",
            data: newData
        });
    } catch (err) {
        res.status(422).json({
            status: false,
            message: err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message)[0] : "Server side issue"
        });
        next(err);
    }
};


export async function getAllMaintenance(req, res, next) {
    try {
        const maintenances = await Maintenance.aggregate([
            {
                $lookup: {
                    from: "maintenancedatas",
                    localField: "_id",
                    foreignField: "maintenanceId",
                    as: "maintenanceData"
                }
            },
            // {
            //     $unwind: {
            //         path: "$maintenanceData",
            //         preserveNullAndEmptyArrays: true
            //     }
            // },
        ]).exec();
        res.status(200).json({ status: true, data: maintenances });
    } catch (err) {
        res.status(422).json({
            status: false,
            message: err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message)[0] : "Server side issue"
        });
        next(err);
    }
};

export async function getMaintenanceById(req, res, next) {
    try {
        const maintenanceId = req.params.id;
        if (!maintenanceId) {
            return res.status(400).json({ status: false, message: "Required Maintenance Id" });
        }

        const maintenance = await Maintenance.findById(maintenanceId);
        if (!maintenance) {
            return res.status(400).json({ status: false, message: "Maintenance details not found" });
        }
        res.status(200).json({ status: true, data: maintenance });
    } catch (err) {
        res.status(422).json({
            status: false,
            message: err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message)[0] : "Server side issue"
        });
        next(err);
    }
};


export async function updateMaintenanceById(req, res, next) {
    try {
        const maintenanceId = req.params.id;
        if (!maintenanceId) {
            return res.status(400).json({ status: false, message: "Required Maintenance Id" });
        }

        const maintenance = await Maintenance.findById(maintenanceId);
        if (!maintenance) {
            return res.status(400).json({ status: false, message: "Maintenance details not found" });
        }

        const { shortName, description, startDate, months } = req.body;
        let newData = {
            shortName: shortName || maintenance.shortName,
            description: description || maintenance.description,
        };

        // Validate months if provided
        if (months !== undefined) {
            const month = Number(months);
            if (isNaN(month) || month <= 0) {
                return res.status(400).json({
                    status: false,
                    message: "Months must be a positive number"
                });
            }
            newData.months = month;
        }

        // Validate startDate if provided
        if (startDate) {
            const start = moment(startDate);
            if (!start.isValid()) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid start date"
                });
            }
            newData.startDate = startDate;

            // Recalculate endDate if startDate or months are provided
            const endDate = moment(newData.startDate || maintenance.startDate).add(newData.months || maintenance.months, 'months').format("lll");
            newData.endDate = endDate;
        }

        // Set updatedAt timestamp
        const date = Date.now();
        newData.updatedAt = moment(date).format("lll");

        // Perform the update operation
        const maintenanceUpdate = await Maintenance.findByIdAndUpdate(maintenanceId, newData, { new: true, runValidators: true });
        if (!maintenanceUpdate) {
            return res.status(422).json({ status: false, message: "Maintenance not found" });
        }

        res.status(201).json({
            status: true,
            message: "Maintenance details updated successfully",
            data: maintenanceUpdate
        });
    } catch (err) {
        res.status(422).json({
            status: false,
            message: err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message)[0] : "Server side issue"
        });
        next(err);
    }
};



export async function deleteMaintenanceById(req, res, next) {

    try {
        const maintenanceId = req.params.id;
        if (!maintenanceId) {
            return res.status(400).json({ status: false, message: "Required Maintenance Id" });
        }

        const maintenance = await Maintenance.findById(maintenanceId);
        if (!maintenance) {
            return res.status(400).json({ status: false, message: "Maintenance details not found" });
        }

        await Maintenance.findByIdAndDelete(maintenanceId);
        return res.status(200).json({ status: true, message: "Maintenance details deleted successfully" });
    } catch (err) {
        res.status(422).json({
            status: false,
            message: err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message)[0] : "Server side issue"
        });
        next(err);
    }
};
