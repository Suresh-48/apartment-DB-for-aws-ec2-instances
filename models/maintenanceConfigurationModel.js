import mongoose from "mongoose";
const { Schema, model } = mongoose;

const maintenanceConfigurationSchema = new Schema(
    {
        maintenanceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "maintenances",
        },

        flatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "flats",
        },
        blockId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "blocks",
        },
        maintenanceAmount: {
            type: Number,
            required: [true, 'MonthlyAmount is required'],
        },
        gst: {
            type: Number,
            required: [false, 'GST is required'],
        },
        isPaid: {
            type: Boolean,
            default: false,
        },
        paidAt: {
            type: Date,
            default: null
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        paymentType:{
            type: String,
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

const maintenanceDataSchema = new Schema(
    {
        maintenanceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "maintenance",
        },
        grandTotal: {
            type: Number,
            required: [true, 'Grand total is required'],
            min: [0, 'Grand total cannot be negative'],
        },
        rateOfAmount: {
            type: Number,
            required: [true, 'Rate of amount is required'],
            min: [0, 'Rate of amount cannot be negative'],
        },
        type: {
            type: String,
            required: [true, 'Type is required'],
        },
    },
    {
        timestamps: true,
    }
);

const MaintenanceConfiguration = model("maintenanceConfiguration", maintenanceConfigurationSchema);
const MaintenanceData = model("maintenanceData", maintenanceDataSchema);

export { MaintenanceConfiguration, MaintenanceData };
