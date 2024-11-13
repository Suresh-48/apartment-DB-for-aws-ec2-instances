import mongoose from "mongoose";
const { Schema, model } = mongoose;

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is Required"],
      maxlength: [100, "Title cannot exceed 100 characters"]
    },
    description:{
      type: String,
      required: [true, "Description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"]
    },
    startDate: {
      type: String,
      required: [true, "Start date is Required"],
    },
    endDate: {
      type: String,
      required: [false, "End date is Required"],
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

eventSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Event = model("event", eventSchema);
export default Event;
