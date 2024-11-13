import mongoose from "mongoose";
const { Schema, model } = mongoose;

const associationAmountSchema = new Schema(
    {
        accountBalance: {
            type: Number,
            required: [true, "Account balance is required"],
            validate: {
                validator: function (v) {
                    return !isNaN(v);
                },
                message: props => `${props.value} is not a valid number!`
            }
        },
        pettyCash: {
            type: Number,
            required: [true, "Petty cash is required"],
            validate: {
                validator: function (v) {
                    return !isNaN(v);
                },
                message: props => `${props.value} is not a valid number!`
            }
        },
        depositAmount: {
            type: Number,
            required: [true, "Deposit amount is required"],
            validate: {
                validator: function (v) {
                    return !isNaN(v);
                },
                message: props => `${props.value} is not a valid number!`
            }
        },
        limitAmount: {
            type: Number, default: 10000
        },
        isCreated: {
            type: Boolean
        },
        includeInBalance: {
            type: Boolean,
            required: [true, "Options are required"],
        },
        createdBy: {
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
    }
);

associationAmountSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const AssociationAmount = model("associationamount", associationAmountSchema);
export default AssociationAmount;
