import User from '../models/userModal.js';
import Maintenance from '../models/maintenanceModels.js';
import { MaintenanceConfiguration, MaintenanceData } from '../models/maintenanceConfigurationModel.js';
import Association from '../models/associationModel.js';
import mongoose from 'mongoose';
import { APP_URL } from '../config.js';
import { sendEMail } from '../constants/mailservices.js';
import moment from 'moment';
import Block from '../models/blockModel.js';

export async function createMaintenanceConfiguration(req, res) {
    try {
        const { configurations, rateOfAmount, type, shortName, grandTotal } = req.body;

        if (!rateOfAmount || !type || !shortName || !grandTotal < 0) {
            return res.status(400).json({ message: 'Required amount, short name, grand total and type' });
        }

        if (!configurations || !Array.isArray(configurations) || configurations.length === 0) {
            return res.status(400).json({ message: 'Configurations array is required and cannot be empty.' });
        }

        for (const config of configurations) {
            const { floorName, squareFeet, maintenanceAmount } = config;
            if (!floorName) {
                return res.status(400).json({ message: 'The "floorName" field is required.' });
            }

            if (!squareFeet) {
                return res.status(400).json({ message: 'The "squareFeet" field is required.' });
            }

            if (maintenanceAmount < 0) {
                return res.status(400).json({ message: 'The "maintenanceAmount" field is required.' });
            }
        }


        const maintenance_Data = await Maintenance.findOne({ "shortName": shortName });

        if (!maintenance_Data) {
            return res.status(400).json({ message: 'Maintenance data not found for the given short name.' });
        }

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        let allRecordsExist = true;
        const recordsToInsert = [];

        for (const config of configurations) {
            const { flatId, blockId, maintenanceAmount } = config;
            if (!flatId || !blockId || maintenanceAmount < 0) {
                return res.status(400).json({ message: 'Flat ID, block ID, and maintenance amount are required in each configuration.' });
            }

            const existingRecord = await MaintenanceConfiguration.findOne({
                maintenanceId: maintenance_Data._id,
                flatId,
                blockId,
                createdAt: {
                    $gte: new Date(currentYear, currentMonth - 1, 1),
                    $lt: new Date(currentYear, currentMonth, 1),
                }
            });

            if (!existingRecord) {
                // If the record doesn't exist, prepare to insert it
                allRecordsExist = false;
                recordsToInsert.push({
                    maintenanceId: maintenance_Data._id,
                    flatId,
                    blockId,
                    maintenanceAmount,
                    createdBy: req.userId
                });
            }
        }


        const newRecords = await Promise.all(configurations.map(config =>
            MaintenanceConfiguration.create({
                maintenanceId: maintenance_Data.id,
                floorName: config.floorName,
                squareFeet: config.squareFeet,
                gst: config.gst,
                maintenanceAmount: config.maintenanceAmount,
                createdBy: req.userId
            })
        ));

        if (allRecordsExist) {
            return res.status(400).json({ message: 'All data already exists for the current month.' });
        }

        if (recordsToInsert.length > 0) {
            await MaintenanceConfiguration.insertMany(recordsToInsert);
        }

        await MaintenanceData.create({
            maintenanceId: maintenance_Data._id,
            rateOfAmount,
            grandTotal,
            type
        });

        res.status(201).json({ status: true, message: "Maintenance data saved successfully" });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
}

export const getMaintenanceConfigurationByMonthYear = async (req, res) => {
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
                    squareFeet: "$flatsData.squareFeet",
                    maintenanceAmount: 1,
                    shortName: "$maintenanceData.shortName",
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


export async function getMaintenanceWithFlats(req, res, next) {
    try {

        const { shortName } = req.query;
        const currentMonth = moment().month() + 1;
        const currentYear = moment().year();

        const isMaintenance = await Maintenance.findOne({ shortName: shortName.trim() });

        if (!isMaintenance) {
            return res.status(404).json({
                status: false, message: "Maintenance details not found"
            });
        }

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
                $unwind: {
                    path: "$flats",
                    preserveNullAndEmptyArrays: true
                },
            },
            {
                $lookup: {
                    from: "maintenanceconfigurations",
                    let: {
                        flatId: "$flats._id",
                        currentMonth: currentMonth,
                        currentYear: currentYear
                    },
                    pipeline: [
                        {
                            $match: {
                                maintenanceId: isMaintenance._id,
                                $expr: {
                                    $and: [
                                        { $eq: ["$flatId", "$$flatId"] },
                                        { $eq: [{ $month: "$createdAt" }, "$$currentMonth"] },
                                        { $eq: [{ $year: "$createdAt" }, "$$currentYear"] }
                                    ]
                                }
                            }
                        },
                    ],
                    as: "maintenanceData",
                },
            },
            {
                $group: {
                    _id: {
                        blockId: "$_id",
                        blockName: "$blockName",
                    },
                    flats: {
                        $push: {
                            flatId: "$flats._id",
                            flatName: "$flats.flatName",
                            floorName: "$flats.floorName",
                            isBooked: "$flats.isBooked",
                            squareFeet: "$flats.squareFeet",
                            maintenanceAmount: {
                                $ifNull: [
                                    { $arrayElemAt: ["$maintenanceData.maintenanceAmount", 0] },
                                    0
                                ],
                            },
                            gst: {
                                $ifNull: [
                                    { $arrayElemAt: ["$maintenanceData.gst", 0] },
                                    0
                                ],
                            },
                            maintenanceId: {
                                $ifNull: [{ $arrayElemAt: ["$maintenanceData.maintenanceId", 0] }, null],
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    blockId: "$_id.blockId",
                    blockName: "$_id.blockName",
                    flats: 1,
                },
            },
        ]);

        const result = data.map(block => ({
            blockName: block.blockName,
            blockId: block.blockId,
            flats: block.flats.map(flat => ({
                flatId: flat.flatId,
                flatName: flat.flatName,
                floorName: flat.floorName,
                squareFeet: flat.squareFeet,
                isBooked: flat.isBooked,
                maintenanceAmount: flat.maintenanceAmount || 0,
                gst: flat.gst || 0,
                maintenanceId: flat.maintenanceId || null,
            })),
        }));

        var flatId = null;

        for (let i = 0; i < data?.length; i++) {
            const element = data[i];
            for (let j = 0; j < element?.flats?.length; j++) {
                const flat = element?.flats[j];
                if (flat.maintenanceId) {
                    flatId = flat.maintenanceId;
                    break;
                }
            }
            if (flatId) break;
        }

        const maintenanceData = flatId ? await MaintenanceData.findOne({ maintenanceId: isMaintenance._id }, { grandTotal: 1, type: 1, rateOfAmount: 1 }) : null;

        return res.status(200).json({
            status: true,
            data: result,
            maintenanceData: maintenanceData,
        });

    } catch (err) {
        next(err);
    }
}

export const sendBulkMail = async (req, res) => {
    try {
        const { date } = req.body;
        if (!date) {
            res.status(400).json({ status: false, message: 'Required year and month' });
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
                    },
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
                    userName: "$userData.name",
                    email: "$userData.email",
                    isPaid: 1
                }
            }
        ]).exec();
        const association = await Association.findOne({})

        response?.forEach(async (element) => {
            if (!element.isPaid && element.email) {
                await sendUnpaidEmail(element.userName, element.email, association?.name, date);
            }
        });
        res.status(201).json({ status: true, message: "Email sent successfully" });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Error creating configuration' });
    }
};

const getUserDetails = async (userId) => {
    try {
        const user = await User.findById(userId).populate({
            path: 'flatId',
            populate: { path: 'blockId' }
        });

        if (!user || !user.flatId) return { message: 'User or Flat not found' };

        const maintenanceRecords = await MaintenanceConfiguration.aggregate([
            {
                $match: { flatId: user.flatId._id }
            },
            {
                $lookup: {
                    from: 'maintenances',
                    localField: 'maintenanceId',
                    foreignField: '_id',
                    as: 'maintenanceDetails'
                }
            },
            {
                $unwind: '$maintenanceDetails'
            },
            {
                $project: {
                    userId: '$maintenanceDetails.userId',
                    shortName: '$maintenanceDetails.shortName',
                    description: '$maintenanceDetails.description',
                    createdAt: '$maintenanceDetails.createdAt',
                    updatedAt: '$maintenanceDetails.updatedAt',
                    id: '$maintenanceDetails._id',
                    maintenanceAmount: '$maintenanceAmount',
                    gst: '$gst'
                }
            }
        ]);

        return {
            flat: {
                flatName: user.flatId.flatName,
                squareFeet: user.flatId.squareFeet,
                floorName: user.flatId.floorName,
            },
            maintenanceRecords: maintenanceRecords,
        };

    } catch (error) {
        return { message: 'Error fetching data: ' + error };
    }
};

export const getMaintenanceConfigurationByYear = async (req, res) => {
    try {
        const userId = req.userId;
        const { year } = req.body;
        if (!userId) {
            res.status(400).json({ status: false, message: 'Required user id' });
        }
        if (!year) {
            res.status(400).json({ status: false, message: 'Year is required' });
        }

        const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${parseInt(year) + 1}-01-01T00:00:00.000Z`);

        const isUser = await User.findById(userId);
        const maintenanceData = await MaintenanceConfiguration.aggregate([
            {
                $match: {
                    flatId: isUser.flatId,
                    createdAt: {
                        $gte: startOfYear,
                        $lt: endOfYear
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
                $unwind: "$maintenanceData"
            }
        ])

        res.status(200).json({ status: true, data: maintenanceData });
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: false, message: 'Error creating configuration' });
    }
};

export const updatePaymentStatus = async (req, res) => {
    try {
        const maintenanceId = req.params.id;
        const { status, type } = req.body;
        if (!maintenanceId) {
            res.status(400).json({ status: false, message: 'Required maintenance id' });
        }
        const date = Date.now();
        const updatedAt = moment(date).format("lll");

        const updateObj = { isPaid: status, paidAt: status === false ? null : updatedAt, paymentType: type }

        const updateMaintenance = await MaintenanceConfiguration.findByIdAndUpdate(maintenanceId, updateObj);
        if (updateMaintenance) {
            res.status(200).json({ status: true, message: status === true ? 'Payment added successfully' : status === false ? "Payment reverted successfully" : "" });
        }
        if (!updateMaintenance) {
            res.status(404).json({ status: true, message: 'Maintenance details not found' });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: 'Error creating configuration' });
    }
};

export const sendUnpaidEmail = async (userName, userEmail, associationName, date) => {
    try {

        var currentDate = moment();
        currentDate.month(moment(date, "YYYY-MM").month());
        currentDate.year(moment(date, "YYYY-MM").year());

        var formattedDate = currentDate.format('DD/MM/YYYY HH:mm');

        const emailContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Society ${associationName} for the ${formattedDate} - Unpaid</title>
            </head>
            <body>
                Hi ${userName},
                <p>Thanks for being part of the society, we noticed that the society dues for the ${formattedDate} seem unpaid. Kindly pay at the earliest to avoid late fee charges.</p>
     
                <br/><br/><p><strong>${APP_URL}/</strong></p>
                <br/>
                <p>Regards,</p>
                <p>Admin<br>${associationName}</p>
            </body>
            </html>
        `;

        const subject = `Society ${associationName} for the ${formattedDate} - Unpaid`;

        const emailData = await sendEMail(subject, userEmail, emailContent);
        return emailData;
    } catch (error) {
        throw new Error('Error sending email');
    }
};

export const mailForUnpaidUser = async (req, res) => {
    try {
        const { maintenanceId, date } = req.body;
        const response = await MaintenanceConfiguration.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(maintenanceId)
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
                $unwind: "$flatsData"
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
                $unwind: "$userData"
            },
        ]).exec();

        if (response.length) {
            const userEmail = response[0]?.userData?.email;
            const userName = response[0]?.userData?.name;

            if (userEmail) {
                const association = await Association.findOne({})
                await sendUnpaidEmail(userName, userEmail, association?.name, date);

                return res.status(200).json({
                    status: true,
                    message: "Mail sent successfully",
                });
            }
        } else {
            return res.status(200).json({ status: true, message: "No data found" });
        }
    } catch (error) {
        return res.status(500).json({ status: false, message: 'Error sending email' });
    }
};

export const getMaintenanceConfiguration = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(400).json({ status: false, message: 'Required user id' });
        }
        const response = await getUserDetails(userId);
        res.status(201).json({ data: response });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Error creating configuration' });
    }
};

