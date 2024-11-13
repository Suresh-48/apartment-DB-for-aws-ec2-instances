import mongoose from "mongoose";
const { Schema, model } = mongoose;

const queryDetailsSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    question: {
        type: String,
        required: [true, "Question is Required"],
        maxlength: [2000, "Question cannot exceed 2000 characters"]
    },
    status: {
        type: String,
        default: "request"
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
    deletedAt: {
        type: Date,
    }
},
    {
        timestamps: true,
    }
);

queryDetailsSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const query = model("Query", queryDetailsSchema);
export default query;