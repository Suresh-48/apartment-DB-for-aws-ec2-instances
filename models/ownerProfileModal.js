import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ownerProfileSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "User Id is Required"],
    ref: "User",
  },
  whatsappNumber: {
    type: Number,
  },
  sameAsPhone: {
    type: Boolean,
  },
  emergencyContactName: {
    type: String,
    // required: [true, "Emergency Contact Name is Required"],
  },
  emergencyMobileNumber: {
    type: Number,
    // required: [true, "Emergency Mobile Number is Required"],
  },
  dob: {
    type: Date,
  },
  bloodGroup: {
    type: String,
  },
  age: {
    type: Number
  },
  gender: {
    type: String,
    // required: [true, "Gender is Required"],
  },
  aadharNumber: {
    type: Number,
    // required: [true, "Aadhar Number is Required"],
  },
  addressProof: {
    type: String,
  },
  photo: {
    type: String,
  },
  workType: {
    type: String,
  },
  workAddress: {
    type: String,
  },
  isDoctor: {
    type: Boolean,
  },
  specialization: {
    type: String,
  },
  residentialAddress: {
    type: String,
  },
  currentAddress: {
    type: String,
  },
  apartmentType: {
    type: String,
    // required: [true, "Apartment Type is Required"],
  },
  handOverDate: {
    type: Date,
  },
  occupationDate: {
    type: Date,
  },
  maintenancePaidBy: {
    type: String,
    // required: [true, "Maintenance Paid By is Required"],
  },
  typeOfGasConnection: {
    type: String,
  },
  memberId: {
    type: String,
  },
  timestamps: {
    type: Date,
  },
});
ownerProfileSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Owner = model("Owner", ownerProfileSchema);

export default Owner;
