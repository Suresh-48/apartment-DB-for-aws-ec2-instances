import mongoose from "mongoose";
const { Schema, model } = mongoose;

const associationSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
        },
        address: {
            type: String,
            required: [true, "Address is required"],
        },
        registrationNumber: {
            type: String,
            required: [true, "Registration number is required"],
        },
        pan: {
            type: String,
            required: [true, "PAN number is required"],
            match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"], // Example PAN validation: ABCDE1234F
            minlength: [10, "PAN number must be at least 10 characters"],
            maxlength: [10, "PAN number must not exceed 10 characters"]
        },
        contactName: {
            type: String,
            required: [true, "Contact name is required"],
            minlength: [3, "Contact name must be at least 3 characters"],
            maxlength: [50, "Contact name must not exceed 50 characters"],
        },
        contactNumber: {
            type: String,
            required: [true, "Contact number is required"],
            match: [/^[0-9]{10}$/, "Invalid contact number format"], // Validates 10-digit numbers
        },
        moa: {
            type: String,
            maxlength: [5000, "MOA can't exceed 5000 characters"]
        },
        logo:{
            type: String,
        },
        logoName: {
            type: String,
        },
        logoType:{
            type: String,
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

associationSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const Association = model("association", associationSchema);
export default Association;
