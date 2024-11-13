import mongoose from "mongoose";
const { Schema, model } = mongoose;

const associationDetailsSchema = new Schema(
    {
        type: {
            type: String,
            required: [true, "Type is required"],
        },
        name: {
            type: String,
            required: [true, "Name is required"],
        },
        description: {
            type: String,
            required: [true, "Description is required"],
        },
        amount: {
            type: String,
            required: [true, "Type is required"],
            validate: {
                validator: function (v) {
                    return !isNaN(v);
                },
                message: props => `${props.value} is not a valid number!`
            }
        },
        mode: {
            type: String,
            required: [true, "Payment mode is required"],
        },
        date: {
            type: Date,
            required: [true, "Date is required"],
        },
        visible: {
            type: Boolean,
            required: [true, "Visibility is required"],
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

associationDetailsSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const AssociationDetailsSchema = model("associationdetails", associationDetailsSchema);
export default AssociationDetailsSchema;
