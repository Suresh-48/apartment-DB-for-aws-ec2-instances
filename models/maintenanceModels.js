import mongoose from "mongoose";
const { Schema, model } = mongoose;

const maintenanceSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "User ID is required"],
            ref: "User"
        },
        shortName: {
            type: String,
            trim: true,
            required: [true, "Short Name is Required"],
        },
        description: {
            type: String,
            required: [true, "Description is Required"],
        },
        startDate: {
            type: Date,
            required: [true, "Start Date is Required"],
        },
        endDate: {
            type: Date,
            required: [true, "End Date is Required"],
        },
        months: {
            type: Number,
            required: [true, "Month is Required"],
        },
        model: {
            type: String,
            required: [false, "Model is Required"],
        },
        createdBy: {
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

maintenanceSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const Maintenance = model("maintenance", maintenanceSchema);

export default Maintenance;
