import { timeStamp } from "console";
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ticketDetailsSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    issueType: {
        type: String,
        required: [true, "Issue Type is Required"]
    },
    location: {
        type: String,
        required: [true, "Location is Required"]
    },
    natureOfIssue: {
        type: String,
        required: [true, "Nature Of Issue is Required"]
    },
    description: {
        type: String,
        required: [false, "Description is Required"]
    },
    status: {
        type: String,
        default: "R" // [R, P C => Request, Processing, Completed]
    },
    ticketDetailsId: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    createdAt: {
        type: Date,
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

ticketDetailsSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});


ticketDetailsSchema.statics.generateTicketDetailsId = async function () {
    const now = new Date();
    const datePrefix = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}`;

    const lastTicket = await this.findOne({
        ticketDetailsId: { $regex: `^T${datePrefix}` },
    }).sort({ ticketDetailsId: -1 });

    let sequence = 1;
    if (lastTicket) {
        const lastSequence = parseInt(lastTicket.ticketDetailsId.slice(-1), 10);
        sequence = lastSequence + 1;
    }

    return `T${datePrefix}${sequence}`;
};

const Ticket = model("tickets", ticketDetailsSchema);
export default Ticket;