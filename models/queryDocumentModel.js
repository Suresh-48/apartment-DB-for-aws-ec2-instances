import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const queryDocumentSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    queryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'query',
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

queryDocumentSchema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const QueryDocument = model('QueryDocument', queryDocumentSchema);

export default QueryDocument;
