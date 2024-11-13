import mongoose from "mongoose";
const { Schema, model } = mongoose;
import { EXPENSE_TYPE_DYNAMIC, EXPENSE_TYPE_STATIC } from "../constants/expenseType.js";

const maintenanceDetailSchema = new Schema(
    {
        expenseType: {
            type: String,
            required: [true, 'Maintenance type is required'],
            enum: [EXPENSE_TYPE_DYNAMIC, EXPENSE_TYPE_STATIC]
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            minlength: [3, 'Description must be at least 3 characters long'],
        },
        frequency: {
            type: String,
            required: [true, 'Frequency is required'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount must be a positive number'],
        },
        monthlyAmount: {
            type: Number,
            required: [true, 'MonthlyAmount is required'],
            min: [0, 'MonthlyAmount must be a positive number'],
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        createdAt: {
            type: Date,
        },
        updatedAt: {
            type: Date,
        },
        deletedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const maintenanceSummarySchema = new Schema(
    {
        totalExpenses: {
            type: Number,
            required: [true, 'Total expenses is required'],
            min: [0, 'Total expenses cannot be negative'],
        },
        ratePerSquareFeet: {
            type: Number,
            required: [true, 'Rate per square feet is required'],
            min: [0, 'Rate per square feet cannot be negative'],
        },
    },
    {
        timestamps: true,
    }
);

const MaintenanceDetail = model("MaintenanceDetail", maintenanceDetailSchema);
const MaintenanceSummary = model("MaintenanceSummary", maintenanceSummarySchema);

export { MaintenanceDetail, MaintenanceSummary };
