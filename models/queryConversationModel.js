import mongoose from "mongoose";
const { Schema, model } = mongoose;

const QueryConversationSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    queryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "queries"
    },
    message: {
        type: String,
        maxlength: [2000, "Answer cannot exceed 2000 characters"]
    },
    createdAt: {
        type: Date,
        default: new Date().now
    },
    updatedAt: {
        type: Date,
    },
    deletedAt: {
        type: Date,
    }
},
    {
        timestamps: true,
    }
);

QueryConversationSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const query = model("QueryConversation", QueryConversationSchema);
export default query;