import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const ProductDocumentSchema = new Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'productwarranties',
        },
        type: {
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
    },
    {
        timestamps: true,
    }
);

ProductDocumentSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const ProductDocument = model('ProductDocument', ProductDocumentSchema);

export default ProductDocument;
