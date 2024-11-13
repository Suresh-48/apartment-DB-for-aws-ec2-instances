import mongoose from "mongoose";
const { Schema, model } = mongoose;

const positionSchema = new Schema(
    {
        position: {
            type: String,
            required: [true, "Position is required"],
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

positionSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const Position = model("position", positionSchema);
export default Position;
