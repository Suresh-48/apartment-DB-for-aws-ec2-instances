
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const petsSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "User ID is required"],
        ref: "User"
    },
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"],
        maxlength: [50, "Name can't exceed 50 characters"]
    },
    age: {
        type: Number,
        required: [true, "Age is required"],
        min: [0, "Age can't be negative"],
        max: [150, "Age can't exceed 150 years"]
    },
    petType: {
        type: String,
        required: [false, "Pet type is required"],
    },
    breed: {
        type: String,
        required: [false, "Breed type is required"],
        trim: true
    },

    identityMarks: {
        type: String,
        required: [false, "Identification Marks is required"],
        trim: true
    },
    isVaccinated: {
        type: Boolean,
        required: [false, "Vaccinated is required"],
    },
    weight: {
        type: String,
        required: [false, "Weight is required"],
        trim: true
    },
    comments: {
        type: String,
        required: [false, "Comments is required"],
        trim: true
    },
    color: {
        type: String,
        required: [false, "Color is required"],
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    deletedAt: {
        type: Date,
    }
},
    {
        timestamps: true,
    });


petsSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const Pets = model("pets", petsSchema);

export default Pets;