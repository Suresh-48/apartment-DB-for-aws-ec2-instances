import mongoose from "mongoose";
const { Schema, model } = mongoose;

const onwerDocumentSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    documentName: {
      type: String,
      // required: [true, "Document name is required"],
    },
    documentPath: {
      type: String,
      // required: [true, "Document path is required"],
    },
    documentType:{
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'requested','accepted', 'rejected'],
      default: 'pending',  // Default value is 'pending'
    },
    comments: {
      type: String,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);
onwerDocumentSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const OnwerDocument = model(
  "OwnerDocument",
  onwerDocumentSchema
);

export default OnwerDocument;
