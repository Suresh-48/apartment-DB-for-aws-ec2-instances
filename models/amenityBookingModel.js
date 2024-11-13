import mongoose from "mongoose";

const { Schema, model } = mongoose;

const BookingSchema = new Schema({
    amenityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Amenity', required: true },
    bookingStartDate: { type: Date, required: true },
    amenityType: { type: String, required: true },
    startTime: { type: String, required: false }, // Optional
    endTime: { type: String, required: false },   // Optional
    timeSlot: { type: String, required: false },  // Optional
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,  // Make userId required
        ref: 'User'      // Reference to User model (if applicable)
    },
    totalFee: { type: Number, required: true },
}, { timestamps: true });

BookingSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id; // Rename _id to id for better API response
    return object;
});

const AminityBooking = model("AminityBooking", BookingSchema);
export default AminityBooking;
