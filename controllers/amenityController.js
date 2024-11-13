import moment from "moment";
import Amenity from "../models/amenityModel.js";
import { AMENITY_STATUS_ACTIVE } from "../constants/AmenityStatus.js";

export async function createAmenity(req, res, next) {
    try {
        const {
            amenityName, amenityDescription, amenityPeopleCount,
            costType, cost, availabilityStatus
        } = req.body;

        // Calculate total cost
        const totalCost = (cost.perDayCost || 0) + (cost.perHalfDayCost || 0) + (cost.perHourCost || 0);

        const newData = {
            amenityName,
            amenityDescription,
            amenityPeopleCount,
            costType,
            cost,
            totalCost,
            availabilityStatus,
            createdBy: req.userId,
        };

        await Amenity.create(newData);

        res.status(201).json({
            status: true,
            message: "Amenity details created successfully",
        });
    } catch (err) {
        res.status(422).json({
            status: false,
            message:
                err.name === 'ValidationError'
                    ? Object.values(err.errors).map((val) => val.message)[0]
                    : "Server-side issue",
        });
        next(err);
    }
}

export async function getAllAmenity(req, res, next) {
    try {
        const amenities = await Amenity.find({}, { "amenityName": 1, "amenityPeopleCount": 1, "availabilityStatus": 1 });
        res.status(200).json({ status: true, data: amenities });
    } catch (error) {
        next(error);
    }
}

export async function getAllAmenityForMember(req, res, next) {
    try {
        const amenities = await Amenity.find({ "availabilityStatus": AMENITY_STATUS_ACTIVE }, { "amenityName": 1, "amenityDescription": 1, "amenityPeopleCount": 1, "availabilityStatus": 1 });
        res.status(200).json({ status: true, data: amenities });
    } catch (error) {
        next(error);
    }
}

export async function getAllAmenityById(req, res, next) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ status: false, message: "Amenity ID is required" });
        }

        const amenity = await Amenity.findById(id);
        if (amenity) {
            res.status(200).json({ status: true, data: amenity });
        } else {
            res.status(404).json({ status: false, message: "Amenity details not found" });
        }
    } catch (error) {
        next(error);
    }
}

export async function updateAmenity(req, res, next) {
    try {
        const { id } = req.params;
        const {
            amenityName, amenityDescription, amenityPeopleCount,
            costType, cost, availabilityStatus
        } = req.body;

        if (!id) {
            return res.status(400).json({
                status: false,
                message: "Amenity ID is required",
            });
        }

        const existingAmenity = await Amenity.findById(id);
        if (!existingAmenity) {
            return res.status(404).json({
                status: false,
                message: "Amenity details not found",
            });
        }

        const totalCost = (cost?.perDayCost || 0) + (cost?.perHalfDayCost || 0) + (cost?.perHourCost || 0);

        const updatedData = {
            amenityName: amenityName || existingAmenity.amenityName,
            // amenityDescription: amenityDescription || existingAmenity.amenityDescription,
            amenityPeopleCount: amenityPeopleCount || existingAmenity.amenityPeopleCount,
            // costType: costType || existingAmenity.costType,
            // cost: cost || existingAmenity.cost,
            // totalCost,
            availabilityStatus: availabilityStatus || existingAmenity.availabilityStatus,
        };

        await Amenity.findByIdAndUpdate(id, updatedData, { new: true });

        res.status(200).json({
            status: true,
            message: "Amenity details updated successfully",
        });
    } catch (err) {
        res.status(422).json({
            status: false,
            message:
                err.name === 'ValidationError'
                    ? Object.values(err.errors).map((val) => val.message)[0]
                    : "Server-side issue",
        });
        next(err);
    }
}

export async function deleteAmenity(req, res, next) {
    try {
        const { id } = req.params;
        const existingData = await Amenity.findById(id);
        if (!existingData) {
            return res.status(404).json({ status: false, message: "Amenity details not found" });
        }
        await Amenity.findByIdAndDelete(id);
        res.status(200).json({ status: true, message: 'Amenity details deleted successfully' });
    } catch (error) {
        res.status(400).json({ status: false, error: error.message });
    }
}
