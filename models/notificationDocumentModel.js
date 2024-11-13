import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const NotificationDocumentSchema = new Schema(
    {
        notificationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'notifications',
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
    },
    {
        timestamps: true,
    }
);

NotificationDocumentSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const NotificationDocument = model('NotificationDocument', NotificationDocumentSchema);

export default NotificationDocument;
