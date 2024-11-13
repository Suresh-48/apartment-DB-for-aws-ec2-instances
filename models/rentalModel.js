import mongoose from "mongoose";
const { Schema, model } = mongoose;

const rentalSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      default: null,
    },
    whatsappNumber: {
      type: String,
    },
    emergencyContactName: {
      type: String,
      required: [true, "Emergency name is required"],
    },
    emergencyContactNumber: {
      type: String,
      required: [true, "Emergency number is required"],
    },
    dob: {
      type: Date,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
    },
    bloodGroup: {
      type: String,
    },
    aadharNumber: {
      type: String,
      required: [true, "Aadhar Number is Required"],
    },
    addressProof: {
      type: String,
      required: [false, "Address proof is Required"],
    },
    photo: {
      type: String,
    },
    isDoctor: {
      type: Boolean,
    },
    specialization: {
      type: String,
    },
    maintenancePaidBy: {
      type: String,
       required: [true, "Maintenance Paid By is Required"],
    },
    typeOfGasConnection: {
      type: String,
      required: [true, "Gas Connection is Required"],
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

rentalSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Rental = model("Rental", rentalSchema);
export default Rental;
