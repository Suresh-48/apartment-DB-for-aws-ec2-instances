
import mongoose from "mongoose";
const { Schema } = mongoose;

const familyMembersSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "User Id is required"],
        ref: "User"
    },
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"],
        maxlength: [50, "Name can't exceed 50 characters"]
    },
    age: {
        type: Number,
        required: [false, "Age is required"],
        min: [0, "Age can't be negative"],
        max: [150, "Age can't exceed 150 years"]
    },

    isCoOwner: {
        type: String,
        required: [false, "Co-owner status is required"],
    },

    relationshipType: {
        type: String,
        required: [false, "Relationship type is required"],
    },
    mobile: {
        type: String,
        validate: {
            validator: function (v) {
                return !v || /^[0-9]{10}$/.test(v);
            },
            message: (props) => `${props.value} is not a valid mobile number!`
        }
    },
    email: {
        type: String,
        required: [false, "Email address is required"],
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return !v || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    deletedAt: {
        type: Date,
    }
},
    {
        timestamps: true,
    });

const FamilyMember = mongoose.model('FamilyMember', familyMembersSchema);
export default FamilyMember;
