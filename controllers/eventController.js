import moment from "moment";
import Event from "../models/eventModel.js";

export async function createEvents(req, res, next) {
    try {
        const { title, description, startDate, endDate, startTime, endTime } = req.body;


        const startDateTime = moment(`${startDate}T${startTime}:00`).utc().toDate();
        const endDateTime = moment(`${endDate}T${endTime}:00`).utc().toDate();

        if (!title || !description || !startDate || !endDate) {
            return res.status(400).json({
                status: false,
                message: "All fields are required",
            });
        }

        const createdAt = moment().utc().format("lll");

        const newData = {
            title,
            description,
            startDate: startDateTime,
            endDate: endDateTime,
            createdBy: req.userId,
            createdAt,
        };

        await Event.create(newData);

        res.status(201).json({
            status: true,
            message: "Event created successfully",
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
};


export async function getEvent(req, res, next) {
    try {
        const currentDateTime = new Date();

        const event = await Event.find({
            startDate: { $lte: currentDateTime },
            endDate: { $gte: currentDateTime }
        });

        res.status(200).json({ status: true, data: event });
    } catch (error) {
        next(error);
    }
};

export async function getAllEvent(req, res, next) {
    try {
        const event = await Event.find({});
        res.status(200).json({ status: true, data: event });
    } catch (error) {
        next(error);
    }
};

export async function updateEvent(req, res, next) {
    try {
        const eventId = req.params.id;
        const { title, description, startDate, endDate, startTime, endTime } = req.body;

        if (!eventId) {
            return res.status(400).json({
                status: false,
                message: "Notification ID is required",
            });
        }

        const existingEvent = await Event.findById(eventId);
        if (!existingEvent) {
            return res.status(404).json({
                status: false,
                message: "Notification not found",
            });
        }

        const startDateTime = startDate && startTime
            ? moment(`${startDate}T${startTime}:00`).utc().toDate()
            : existingEvent.startDate;

        const endDateTime = endDate && endTime
            ? moment(`${endDate}T${endTime}:00`).utc().toDate()
            : existingEvent.endDate;

        const updatedData = {
            title: title || existingEvent.title,
            description: description || existingEvent.description,
            startDate: startDateTime,
            endDate: endDateTime,
            updatedAt: moment().utc().format("lll"),
        };

        await Event.findByIdAndUpdate(eventId, updatedData, { new: true });

        res.status(200).json({
            status: true,
            message: "Notification updated successfully",
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


export async function deleteEvent(req, res, next) {
    try {
        const { id } = req.params;
        const existingData = await Event.findById(id);
        if (!existingData) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await Event.findByIdAndDelete(id);
        res.status(200).json({ status: true, message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(400).json({ status: false, error: error.message });
    }
}