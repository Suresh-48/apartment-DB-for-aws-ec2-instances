import mongoose from "mongoose";

const productWarrantySchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        productName: {
            type: String,
            required: [true, 'Product name is required'],
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
        },
        brand: {
            type: String,
            required: [true, 'Brand/Manufacturer is required'],
        },
        model: {
            type: String,
            required: [true, 'Model/Version is required'],
        },
        serialNumber: {
            type: String,
            required: false,
        },
        installationDate: {
            type: Date,
            required: [true, 'Installation date is required'],
        },
        location: {
            type: String,
            required: [true, 'Location is required'],
        },
        description: {
            type: String,
            required: false,
        },
        warranty: {
            startDate: {
                type: Date,
                required: [true, 'Warranty start date is required'],
            },
            endDate: {
                type: Date,
                required: [true, 'Warranty end date is required'],
            },
            terms: {
                type: String,
                required: [false, 'Warranty terms are required'],
            },
            contactInfo: {
                type: String,
                required: [false, 'Contact information is required'],
            },
        },
        serviceContract: {
            type: String,
            required: false,
        },
        vendor: {
            name: {
                type: String,
                required: [false, 'Vendor name is required'],
            },
            contactInfo: {
                type: String,
                required: [false, 'Vendor contact information is required'],
            },
            invoiceNumber: {
                type: String,
                required: [false, 'Invoice number is required'],
            },
        },
        handoverDate: {
            type: Date,
            required: [false, 'Handover date is required'],
        },
        condition: {
            type: String,
            required: [false, 'Condition at handover is required'],
        },
        adminNotes: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

const ProductWarranty = mongoose.model('ProductWarranty', productWarrantySchema);

export default ProductWarranty;
