import { MaintenanceDetail, MaintenanceSummary } from "../models/maintenanceCalculationModel.js";
import moment from "moment";
import { EXPENSE_TYPE_DYNAMIC, EXPENSE_TYPE_STATIC } from '../constants/expenseType.js'

const validateMaintenanceDetail = async (data) => {
    try {
        const maintenanceDetail = new MaintenanceDetail(data);
        await maintenanceDetail.validate();

        const maintenanceSummary = new MaintenanceSummary(data);
        await maintenanceSummary.validate();
        return { isValid: true };
    } catch (error) {
        return { isValid: false, errors: error.errors };
    }
};

export async function createMaintenanceCalc(req, res, next) {
    try {
        const { isValid, errors } = await validateMaintenanceDetail(req.body);
        if (!isValid) {
            return res.status(400).json({ status: false, errors });
        }

        const { description, frequency, amount, monthlyAmount, totalExpenses, ratePerSquareFeet, expenseType } = req.body;

        const date = Date.now();
        const createAt = moment(date).format("lll");

        MaintenanceDetail.create({
            description, frequency, amount, monthlyAmount, expenseType,
            createAt: createAt,
            userId: req.userId
        }).then(async (obj) => {
            await MaintenanceSummary.updateOne({},
                { totalExpenses, ratePerSquareFeet },
                { upsert: true, new: true }
            );
            return res.status(201).json({
                status: true,
                data: obj,
                message: "Calculation created successfully",
            });
        })
            .catch((error) => {
                return res.status(500).json({
                    status: false,
                    message: error,
                });
            });
    } catch (error) {
        if (error.name === "ValidationError") {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                status: false,
                message: "Validation Error",
                errors: validationErrors,
            });
        }
        next(error);
    }
}

export async function updateMaintenanceCalc(req, res, next) {
    try {
        const { isValid, errors } = await validateMaintenanceDetail(req.body);
        if (!isValid) {
            return res.status(400).json({ status: false, errors });
        }

        const maintenanceId = req.params.id;
        const { description, frequency, amount, monthlyAmount, totalExpenses, ratePerSquareFeet, expenseType } = req.body;

        const date = Date.now();
        const updatedAt = moment(date).format("lll");

        MaintenanceDetail.findByIdAndUpdate(
            maintenanceId,
            {
                description,
                frequency,
                amount,
                monthlyAmount,
                expenseType,
                updatedAt: updatedAt,
                userId: req.userId
            },
            { new: true } // Returns the updated document
        )
            .then(async (updatedObj) => {
                if (!updatedObj) {
                    return res.status(404).json({
                        status: false,
                        message: "Maintenance calculation not found",
                    });
                }

                // Optionally update the MaintenanceSummary if needed
                await MaintenanceSummary.updateOne({},
                    { totalExpenses, ratePerSquareFeet },
                    { upsert: true, new: true }
                );

                return res.status(200).json({
                    status: true,
                    data: updatedObj,
                    message: "Calculation updated successfully",
                });
            })
            .catch((error) => {
                return res.status(500).json({
                    status: false,
                    message: error.message || "Server error while updating maintenance calculation",
                });
            });
    } catch (error) {
        if (error.name === "ValidationError") {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                status: false,
                message: "Validation Error",
                errors: validationErrors,
            });
        }
        next(error);
    }
}

export async function removeMaintenanceCalc(req, res, next) {
    try {

        const { totalExpenses, ratePerSquareFeet } = req.body;
        if (!totalExpenses || !ratePerSquareFeet) {
            return res.status(400).json({
                status: false,
                message: "Required total expenses adn rate per square feet",
            });
        }
        const maintenanceId = req.params.id;

        MaintenanceDetail.findByIdAndDelete(maintenanceId)
            .then(async (updatedObj) => {
                if (!updatedObj) {
                    return res.status(404).json({
                        status: false,
                        message: "Maintenance calculation not found",
                    });
                }

                await MaintenanceSummary.updateOne({},
                    { totalExpenses, ratePerSquareFeet },
                    { upsert: true, new: true }
                );

                return res.status(200).json({
                    status: true,
                    message: "Calculation deleted successfully",
                });
            })
            .catch((error) => {
                return res.status(500).json({
                    status: false,
                    message: error.message || "Server error while updating maintenance calculation",
                });
            });
    } catch (error) {
        if (error.name === "ValidationError") {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                status: false,
                message: "Validation Error",
                errors: validationErrors,
            });
        }
        next(error);
    }
}

export async function getTotalAmountByExpenseType(req, res, next) {
    MaintenanceDetail.aggregate([
        {
            $group: {
                _id: "$expenseType",
                totalAmount: { $sum: "$amount" }
            }
        }
    ])
        .then(async (docs) => {
            if (docs) {
                var obj = {
                    dynamicAmount: 0,
                    staticAmount: 0,
                }
                docs?.forEach(element => {
                    if (element?._id == EXPENSE_TYPE_DYNAMIC) obj.dynamicAmount = element.totalAmount;
                    if (element?._id == EXPENSE_TYPE_STATIC) obj.staticAmount = element.totalAmount;
                });
                return res.status(200).json({
                    status: true,
                    data: obj,
                    summary: await MaintenanceSummary.findOne({}, { ratePerSquareFeet: 1, totalExpenses: 1 })
                });
            }
        })
        .catch(err => next(err));
}



export async function getAllMaintanance(req, res, next) {
    MaintenanceDetail.find({})
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