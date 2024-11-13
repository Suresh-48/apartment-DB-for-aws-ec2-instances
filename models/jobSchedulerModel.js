import mongoose from "mongoose";
const { Schema, model } = mongoose;

const jobSchedulerSchema = new Schema(
  {
    name: {
      type: String,
      required: true, // Ensure 'name' is required if it's a mandatory field
    },
  },
  {
    timestamps: true, // This will automatically create 'createdAt' and 'updatedAt' fields
  }
);

jobSchedulerSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const jobScheduler = model("JobScheduler", jobSchedulerSchema);
export default jobScheduler;
