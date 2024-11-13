import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const ticketDocumentSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
    },
    ticketDetailsId: {
      type: String,
      required: true, // Make sure this field is required
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

ticketDocumentSchema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const TicketDocument = model('TicketDocument', ticketDocumentSchema);

export default TicketDocument;
