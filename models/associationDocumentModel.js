import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const AssociationDocumentSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    associationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'query',
    },
    field: {
      type: String,
    },
    documentName: {
        type: String,
      },
    documentPath: {
      type: String,
    },
    documentType: {
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

AssociationDocumentSchema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const AssociationDocument = model('AssociationDocument', AssociationDocumentSchema);

export default AssociationDocument;
