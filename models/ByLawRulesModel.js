import mongoose from "mongoose";
const { model } = mongoose;

const ByLawRulesSchema = new mongoose.Schema({

    documentName: {
        type: String,
        required: true
    },
    version: {
        type: Number,
        default: 1.0
    },
    description: {
        type: String,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    documentUrl: {
        type: String,
        required: true
    },
    status: {
        type: String,
    },
    visibleToMember: {
        type: Boolean,
        default: true,
    },
    uploadedBy: {
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
    });

const ByLawRules = model("ByLawRules", ByLawRulesSchema);

const byLawVersionControlSchema = new mongoose.Schema({
    currentVersion: { type: Number, default: 1 }
});

const ByLawVersionControl = model('ByLawVersionControl', byLawVersionControlSchema);

export { ByLawVersionControl, ByLawRules };
