import moment from "moment";
import Booking from "../models/amenityBookingModel.js";
import Amenity from "../models/amenityModel.js";
import {
  AMENITY_TYPE_WHOLE_DAY,
  AMENITY_TYPE_HALF_DAY,
  AMENITY_TYPE_HOURLY,
  AMENITY_STATUS_ACTIVE,
  AMENITY_STATUS_INACTIVE,
  TIME_SLOT_AFTERNOON,
  TIME_SLOT_MORNING,
} from "../constants/AmenityStatus.js";
import { SUPER_ADMIN } from "../constants/roles.js";
import mongoose from "mongoose";

// Calculate total fee based on booking duration
const calculateTotalFee = (startTime, endTime, ratePerHour = 50) => {
  const start = new Date(`1970-01-01T${startTime}:00Z`);
  const end = new Date(`1970-01-01T${endTime}:00Z`);
  const durationInHours = (end - start) / (1000 * 60 * 60); // Convert milliseconds to hours
  return durationInHours > 0 ? durationInHours * ratePerHour : 0;
};

const createTimeRange = (startHour, startMinute, endHour, endMinute) => {
  return {
    start: new Date(0, 0, 0, startHour, startMinute),
    end: new Date(0, 0, 0, endHour, endMinute),
  };
};

const isTimeInRange = (time, range) => {
  const timeToCheck = new Date(0, 0, 0, time.getHours(), time.getMinutes());
  return timeToCheck >= range.start && timeToCheck <= range.end;
};

const morningRange = createTimeRange(6, 0, 12, 0);
const afternoonRange = createTimeRange(12, 0, 18, 0);

// Check if a booking already exists for the given amenity and time slot
const isBookingExists = async (amenityId, bookingStartDate) => {
  const startOfDay = new Date(bookingStartDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(bookingStartDate);
  endOfDay.setHours(23, 59, 59, 999);

  return await Booking.findOne({
    amenityId,
    amenityType: AMENITY_TYPE_WHOLE_DAY,
    bookingStartDate: { $gte: startOfDay, $lte: endOfDay },
  });
};


const isHourlyBookingExists = async (amenityId, bookingStartDate, startTime, endTime) => {
  const startOfDay = new Date(bookingStartDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(bookingStartDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Convert startTime and endTime to Date objects for comparison
  const bookingStartDateTime = new Date(`${bookingStartDate}T${startTime}:00`);
  const bookingEndDateTime = new Date(`${bookingStartDate}T${endTime}:00`);

  // Check for existing bookings that overlap with the requested time slot
  const existingBooking = await Booking.findOne({
    amenityId,
    bookingStartDate: { $gte: startOfDay, $lte: endOfDay },
    startTime: { $ne: "" }, // Ensure we only check bookings with defined start times
    endTime: { $ne: "" }, // Ensure we only check bookings with defined end times
    $or: [
      {
        // New booking starts before existing ends
        startTime: { $lte: endTime },
        endTime: { $gte: startTime }
      },
      {
        // Existing booking starts before new ends
        startTime: { $lte: bookingEndDateTime },
        endTime: { $gte: bookingStartDateTime }
      }
    ]
  });

  return existingBooking;
};


// Check if a booking already exists for the given amenity and time slot
const isWholeDayBooking = async (amenityId, bookingStartDate) => {
  const startOfDay = new Date(bookingStartDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(bookingStartDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Check for existing half-day bookings
  const existingHalfDayBooking = await Booking.findOne({
    amenityId,
    bookingStartDate: { $gte: startOfDay, $lte: endOfDay },
    $or: [
      { timeSlot: "Morning", startTime: { $ne: "" } }, // Check for morning bookings
      { timeSlot: "Afternoon", startTime: { $ne: "" } }, // Check for evening bookings
    ],
    $or: [
      // Allowing for empty start times but looking for the specific time slot
      { timeSlot: "Morning" },
      { timeSlot: "Afternoon" }
    ]
  });

  // If a half-day booking exists, prevent the whole-day booking
  if (existingHalfDayBooking || existingHalfDayBooking !== null) {
    return {
      error:
        "Whole day booking is not allowed as there is already a half-day booking for this date.",
    };
  }


  // If no half-day bookings exist, allow the whole-day booking
  return existingHalfDayBooking;
};

// Check for overlapping hourly bookings
// const isOverlappingHourlyBooking = async (amenityId, bookingStartDate, startTime, endTime) => {
//     return await Booking.findOne({
//         amenityId,
//         bookingStartDate,
//         amenityType: AMENITY_TYPE_HOURLY,
//         $or: [
//             { $and: [{ startTime: { $lte: endTime } }, { endTime: { $gte: startTime } }] }
//         ]
//     });
// };

const isOverlappingHourlyBooking = async (
  amenityId,
  bookingStartDate,
  startTime,
  endTime
) => {
  // Convert the provided start and end times to Date objects
  const startDateTime = new Date(`${bookingStartDate}T${startTime}:00`);
  const endDateTime = new Date(`${bookingStartDate}T${endTime}:00`);

  const overlappingBooking = await Booking.findOne({
    amenityId: amenityId,
    bookingStartDate: bookingStartDate,
    amenityType: "Hourly",
    $or: [
      // Condition 1: Existing booking starts before the new booking ends AND ends after the new booking starts
      {
        startTime: { $lt: endDateTime },
        endTime: { $gt: startDateTime },
      },
      // Condition 2: New booking starts during an existing booking time range
      {
        startTime: { $gte: startDateTime, $lt: endDateTime },
      },
      // Condition 3: New booking ends during an existing booking time range
      {
        endTime: { $gt: startDateTime, $lte: endDateTime },
      },
    ],
  });

  return overlappingBooking !== null;
};

// Check for conflicting half-day bookings
const isConflictingHalfDayBooking = async (
  amenityId,
  bookingStartDate,
  startTime,
  endTime
) => {
  const morningExists = await Booking.findOne({
    amenityId,
    bookingStartDate,
    timeSlot: TIME_SLOT_MORNING,
  });

  const afternoonExists = await Booking.findOne({
    amenityId,
    bookingStartDate,
    timeSlot: TIME_SLOT_AFTERNOON,
  });

  if (
    morningExists &&
    isTimeInRange(
      new Date(0, 0, 0, startTime.split(":")[0], startTime.split(":")[1]),
      morningRange
    )
  ) {
    return true;
  }
  if (
    afternoonExists &&
    isTimeInRange(
      new Date(0, 0, 0, startTime.split(":")[0], startTime.split(":")[1]),
      afternoonRange
    )
  ) {
    return true;
  }
  return false;
};

// Create a new booking
export async function createAmenityBooking(req, res, next) {
  try {
    const {
      amenityId,
      bookingStartDate,
      startTime,
      endTime,
      amount,
      timeSlot,
      amenity,
    } = req.body;


    if (!amenityId || !bookingStartDate || !amenity) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check for existing whole day booking
    if (amenity === AMENITY_TYPE_WHOLE_DAY) {

      const bookingExists = await isWholeDayBooking(
        amenityId,
        bookingStartDate
      );
      if (bookingExists) {
        return res
          .status(400)
          .json({ message: "Booking already exists for this whole day" });
      }
    }

    // Check for existing half day booking
    if (amenity === AMENITY_TYPE_HALF_DAY) {
      const bookingExists = await isBookingExists(amenityId, bookingStartDate);
      if (bookingExists) {
        return res
          .status(400)
          .json({ message: "Booking already exists for this day" });
      }

      // Additional check for conflicting morning or afternoon bookings
      if (timeSlot) {
        const slotExists = await Booking.findOne({
          amenityId,
          bookingStartDate,
          timeSlot: timeSlot,
        });
        if (slotExists) {
          return res
            .status(400)
            .json({ message: "Booking already exists for this slot" });
        }
      }
    }

    // Check for existing hourly booking
    if (amenity === AMENITY_TYPE_HOURLY) {

      const wholeDayExists = await isHourlyBookingExists(amenityId, bookingStartDate, startTime, endTime);
      if (wholeDayExists) {
        return res
          .status(400)
          .json({ message: "Booking already exists for this time slot" });
      }

      // Check for conflicting half-day bookings
      const conflictingHalfDay = await isConflictingHalfDayBooking(
        amenityId,
        bookingStartDate,
        startTime,
        endTime
      );
      if (conflictingHalfDay) {
        return res
          .status(400)
          .json({
            message: `Conflicting half-day booking exists for this time slot`,
          });
      }

      //Check for overlapping hourly bookings
      const overlappingBooking = await isOverlappingHourlyBooking(
        amenityId,
        bookingStartDate,
        startTime,
        endTime
      );

      if (overlappingBooking) {
        return res
          .status(400)
          .json({
            message: "Overlapping hourly booking exists for this time slot",
          });
      }
    }

    const totalFee = amount;

    const booking = new Booking({
      amenityType: amenity,
      amenityId,
      bookingStartDate,
      startTime,
      endTime,
      totalFee,
      timeSlot,
      userId: req.userId,
    });
    await booking.save();
    res
      .status(200)
      .json({ status: true, message: "Booking created successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// Create validation for booking
export async function validationForAmenityBooking(req, res, next) {
  try {
    const {
      amenityId,
      bookingStartDate,
      startTime,
      endTime,
      amount,
      timeSlot,
      amenity,
    } = req.body;


    if (!amenityId || !bookingStartDate || !amenity) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check for existing whole day booking
    if (amenity === AMENITY_TYPE_WHOLE_DAY) {

      const bookingExists = await isWholeDayBooking(
        amenityId,
        bookingStartDate
      );
      if (bookingExists) {
        return res
          .status(400)
          .json({ message: "Booking already exists for this whole day" });
      }
    }

    // Check for existing half day booking
    if (amenity === AMENITY_TYPE_HALF_DAY) {
      const bookingExists = await isBookingExists(amenityId, bookingStartDate);
      if (bookingExists) {
        return res
          .status(400)
          .json({ message: "Booking already exists for this day" });
      }

      // Additional check for conflicting morning or afternoon bookings
      if (timeSlot) {
        const slotExists = await Booking.findOne({
          amenityId,
          bookingStartDate,
          timeSlot: timeSlot,
        });
        if (slotExists) {
          return res
            .status(400)
            .json({ message: "Booking already exists for this slot" });
        }
      }
    }

    // Check for existing hourly booking
    if (amenity === AMENITY_TYPE_HOURLY) {

      const wholeDayExists = await isHourlyBookingExists(amenityId, bookingStartDate, startTime, endTime);
      if (wholeDayExists) {
        return res
          .status(400)
          .json({ message: "Booking already exists for this time slot" });
      }

      // Check for conflicting half-day bookings
      const conflictingHalfDay = await isConflictingHalfDayBooking(
        amenityId,
        bookingStartDate,
        startTime,
        endTime
      );
      if (conflictingHalfDay) {
        return res
          .status(400)
          .json({
            message: `Conflicting half-day booking exists for this time slot`,
          });
      }

      //Check for overlapping hourly bookings
      const overlappingBooking = await isOverlappingHourlyBooking(
        amenityId,
        bookingStartDate,
        startTime,
        endTime
      );

      if (overlappingBooking) {
        return res
          .status(400)
          .json({
            message: "Overlapping hourly booking exists for this time slot",
          });
      }
    }
    return res
      .status(200)
      .json({ status: true, validation: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// Get all bookings
export async function getAllAmenityBooking(req, res, next) {
  try {
    const role = req.userData?.role;
    if (!role) {
      res.status(403).json({ status: false, message: "User ID is required" });
    }
    var filter = {};
    var listField = "amenityName";


    if (role != SUPER_ADMIN) {
      filter.userId = req.userId;
    } else {
      var listField = "amenityName bookingStartDate startTime endTime";
    }

    const bookings = await Booking.find(filter)
      .populate("amenityId", listField)
      .populate({
        path: "userId",
        select: "name flatId blockId phoneNumber",
        populate: [
          { path: "flatId", select: "flatName" },
          { path: "blockId", select: "blockName" }
        ]
      });

    res.status(200).json({ status: true, data: bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getUpcomingDate(id) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const wholeDayBookings = await Booking.find({
      amenityId: new mongoose.Types.ObjectId(id),
      bookingStartDate: { $gte: today },
      amenityType: AMENITY_TYPE_WHOLE_DAY
    }).select("bookingStartDate");

    const halfDayBookings = await Booking.aggregate([
      {
        $match: {
          bookingStartDate: { $gte: today },
          amenityType: AMENITY_TYPE_HALF_DAY
        }
      },
      {
        $group: {
          _id: "$bookingStartDate",
          timeSlots: { $addToSet: "$timeSlot" }
        }
      },
      {
        $match: {
          timeSlots: { $all: [TIME_SLOT_MORNING, TIME_SLOT_AFTERNOON] }
        }
      },
      {
        $project: {
          bookingStartDate: "$_id",
          _id: 0,
          amenityType: AMENITY_TYPE_HALF_DAY,
          timeSlots: 1
        }
      }
    ]);

    const allBookings = [...wholeDayBookings, ...halfDayBookings];

    const bookedDates = allBookings.map((doc) =>
      moment(doc.bookingStartDate).format("YYYY-MM-DD")
    );
    return bookedDates;
  } catch (error) {
    console.error("Error fetching upcoming registration dates:", error);
    return [];
  }
}

// Get a single booking by ID
export async function getBookingDates(req, res, next) {
  try {
    const amenityId = req.params.id;
    res.status(200).json({
      status: true,
      data: await getUpcomingDate(amenityId),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get a single booking by ID
export async function getBookingDatesWithAmenity(req, res, next) {
  try {
    const amenityId = req.params.id;
    const booking = await Amenity.findById(amenityId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json({
      status: true,
      data: { booking, bookedDates: await getUpcomingDate(amenityId) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update a booking by ID
export async function updateAmenityBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Recheck for conflicting bookings if time is being updated
    if (req.body.startTime || req.body.endTime) {
      const existingBooking = await isBookingExists(
        booking.amenityId,
        booking.bookingStartDate,
        req.body.startTime || booking.startTime,
        req.body.endTime || booking.endTime
      );
      if (existingBooking) {
        return res
          .status(400)
          .json({ message: "Booking already exists for this time slot" });
      }
    }

    // Calculate total fee if times are being updated
    const totalFee = calculateTotalFee(
      req.body.startTime || booking.startTime,
      req.body.endTime || booking.endTime
    );

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { ...req.body, totalFee },
      { new: true }
    );
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// Delete a booking by ID
export async function deleteAmenityBooking(req, res, next) {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).send({ status: true, message: "Booked amenity deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
