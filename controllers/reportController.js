import { MaintenanceConfiguration } from "../models/maintenanceConfigurationModel.js";
import User from "../models/userModal.js";
import AssociationDetails from "../models/associationDetails.js";
import { FILTER_TYPE_DATE, FILTER_TYPE_MONTH } from "../constants/expenseType.js";
import { SUPER_ADMIN } from "../constants/roles.js";

export const getSocietyDues = async (req, res) => {
    try {
        const { date } = req.body;
        if (!date) {
            return res.status(400).json({ status: false, message: 'Required year and month' });
        }

        const splitted = date.split("-");
        const year = splitted[0];
        const month = splitted[1];
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);

        const response = await MaintenanceConfiguration.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate
                    }
                }
            },
            {
                $lookup: {
                    from: "maintenances",
                    localField: "maintenanceId",
                    foreignField: "_id",
                    as: "maintenanceData"
                }
            },
            {
                $unwind: {
                    path: "$maintenanceData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "flats",
                    localField: "flatId",
                    foreignField: "_id",
                    as: "flatsData"
                }
            },
            {
                $unwind: {
                    path: "$flatsData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    flatsData: { $ne: null }
                }
            },
            {
                $lookup: {
                    from: "blocks",
                    localField: "flatsData.blockId",
                    foreignField: "_id",
                    as: "blockData"
                }
            },
            {
                $unwind: {
                    path: "$blockData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "flatsData._id",
                    foreignField: "flatId",
                    as: "userData"
                }
            },
            {
                $unwind: {
                    path: "$userData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    flatName: "$flatsData.flatName",
                    blockName: "$blockData.blockName",
                    userName: "$userData.name",
                    residentType: "$userData.residentType",
                    phoneNumber: "$userData.phoneNumber",
                    // maintenanceAmount: 1,
                    // shortName: "$maintenanceData.shortName",
                    flatType: "$flatsData.isBooked",
                    isPaid: 1,
                    paidAt: {
                        $cond: {
                            if: { $eq: ["$paidAt", null] },
                            then: null,
                            else: "$paidAt"
                        }
                    }
                }
            },
            {
                $sort: { flatName: 1 }
            }
        ]).exec();

        res.status(201).json({ status: true, data: response });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Error creating configuration' });
    }
};

export const getAssociationDetailReport = async (req, res) => {
    try {
        const { type, startDate, endDate, dateRangeType } = req.body;

        const formatDate = (dateStr) => {
            const [day, month, year] = dateStr.split('-');
            return new Date(`${year}-${month}-${day}`);
        };

        const start = formatDate(startDate);
        const end = formatDate(endDate);

        if (dateRangeType != FILTER_TYPE_DATE && dateRangeType !== FILTER_TYPE_MONTH) {
            return res.status(403).json({ status: false, message: "required valid type" });
        }

        var match = { type: type };

        if (dateRangeType == FILTER_TYPE_DATE) {
            match.createdAt = {
                $gte: start,
                $lte: end
            }
        }
        if (dateRangeType == FILTER_TYPE_MONTH) {
            match.createdAt = {
                $gte: new Date(start.getFullYear(), start.getMonth(), 1),
                $lte: new Date(end.getFullYear(), end.getMonth() + 1, 1)
            }
        }
        const response = await AssociationDetails.aggregate([
            {
                $match: match
            },
            {
                $project: {
                    createdAt: 0,
                    updatedAt: 0,
                    visible: 0,
                }
            }
        ]).exec();

        res.status(201).json({ status: true, data: response });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Error creating configuration' });
    }
};


export const getMembersReport = async (req, res) => {
    try {
        const response = await User.aggregate([
            {
                $match: {
                    role: { $ne: SUPER_ADMIN }
                }
            },
            {
                $lookup: {
                    from: "blocks",
                    localField: "blockId",
                    foreignField: "_id",
                    as: "blockDetails"
                }
            },
            {
                $unwind: {
                    path: "$blockDetails",
                    preserveNullAndEmptyArrays: true, // In case blockId is missing
                }
            },

            // Join with Flat collection to get flat details
            {
                $lookup: {
                    from: "flats",
                    localField: "flatId",
                    foreignField: "_id",
                    as: "flatDetails"
                }
            },
            {
                $unwind: {
                    path: "$flatDetails",
                    preserveNullAndEmptyArrays: true, // Handle missing flatId
                }
            },

            // Join with Vehicle collection to get user vehicles
            {
                $lookup: {
                    from: "vehicledetails",
                    localField: "_id",
                    foreignField: "userId",
                    as: "vehicles"
                }
            },

            {
                $project: {
                    name: 1,
                    phoneNumber: 1,
                    residentType: 1,
                    role: 1,
                    blockName: "$blockDetails.blockName",
                    flatName: "$flatDetails.flatName",
                    squareFeet: "$flatDetails.squareFeet",
                    vehicleNumber: { $arrayElemAt: ["$vehicles.registrationNumber", 0] },
                }
            }
        ]);

        return res.status(200).json({ status: true, data: response });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Error creating configuration' });
    }
};


