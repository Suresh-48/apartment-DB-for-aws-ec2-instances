import mongoose from "mongoose";
const { Schema, model } = mongoose;

const apartmentBlockSchema = new Schema(
  {
    blockName: {
      type: String,
      required: [true, "Block Name is Required"],
    },
    isActive: {
      type: Boolean,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt:{
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

apartmentBlockSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Block = model("Block", apartmentBlockSchema);

export default Block;
