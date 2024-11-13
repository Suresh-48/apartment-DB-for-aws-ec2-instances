import mongoose from "mongoose";
const { Schema, model } = mongoose;

const amenitySchema = new Schema({
    amenityName: { type: String, required: [true, "Amenity name is required"] },
    amenityDescription: { type: String, required: [true, "Description is required"] },
    amenityPeopleCount: { type: Number, required: [true, "Total people count is required"] },
    costType: {
        perDay: { type: Boolean, default: false },
        perHalfDay: { type: Boolean, default: false },
        perHour: { type: Boolean, default: false },
        free: { type: Boolean, default: false }
    },
    cost: {
        perDayCost: { type: Number, default: 0 },
        perHalfDayCost: { type: Number, default: 0 },
        perHourCost: { type: Number, default: 0 }
    },
    totalCost: { type: Number, required: [true, "Total cost is required"] },
    availabilityStatus: { type: String, default: "Inactive" },
    createdBy: { type: String },
}, { timestamps: true });

amenitySchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const Amenity = model("Amenity", amenitySchema);
export default Amenity;
