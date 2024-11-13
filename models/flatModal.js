import { timeStamp } from "console";
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const apartmentFlatSchema = new Schema(
  {
    // flatId:{
    //     type: String,
    //     required:[true, "Flat Id is Required"]
    // },
    blockId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Block Id is Required"],
      ref: "Block",
    },
    flatName: {
      type: String,
      required: [true, "Flat Name is Required"],
    },
    squareFeet:{
      type: Number,
      required: [true, "Flat Square feet is required"],
    },
    floorName: {
      type: String,
      required: [true, "Floor Name is Required"],
    },
    apartmentType: {
      type: String,
      required: [false, "Apartment Type is Required"],
    },
    rentalBooked: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
    },
    isBooked: {
      type: Boolean,
      default: false,
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

apartmentFlatSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Flat = model("Flat", apartmentFlatSchema);
export default Flat;
