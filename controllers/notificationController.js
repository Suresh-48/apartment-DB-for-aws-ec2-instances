import moment from "moment";
import Notification from "../models/notificationModel.js";
import User from "../models/userModal.js";
import NotificationDocument from "../models/notificationDocumentModel.js";
import {
    NOTIFICATION_ASSOCIATION_MEETING, NOTIFICATION_TO_ADMIN, NOTIFICATION_TO_ALL_MEMBER, NOTIFICATION_TO_ALL_OWNER, NOTIFICATION_TO_SPECIFIC,
    RECURRING_TYPE_DAILY, RECURRING_TYPE_MONTHLY, RECURRING_TYPE_WEEKLY
} from '../constants/notificationType.js'
import { OWNER, SUPER_ADMIN } from "../constants/roles.js";
import { getPublicImageUrl, uploadFilestoAws } from "../utils/s3.js";
import { sendEMail } from '../constants/mailservices.js';

function getEmails(users) {
    return users.map(user => user.email);
}

export async function createNotification(req, res, next) {
    try {
        const {
            notificationType,
            notificationTo,
            title,
            date,
            startTime,
            endTime,
            specificDoors,
            emailType,
            venue,
            body,
            recurringFrequency,
            recurringDay,
            recurringDate
        } = req.body;
        const file = req.file;

        if (!notificationType || !notificationTo || !title || !date || !emailType) {
            return res.status(400).json({
                status: false,
                message: "notificationType, notificationTo, title, and date are required",
            });
        }

        if (notificationTo === NOTIFICATION_TO_SPECIFIC) {
            if (!specificDoors || !Array.isArray(specificDoors) || specificDoors.length === 0) {
                return res.status(400).json({
                    status: false,
                    message: "Please select at least one door number for Specific notifications",
                });
            }
        }

        if (notificationType == NOTIFICATION_ASSOCIATION_MEETING) {
            if (!startTime || !endTime || !venue || !body) {
                return res.status(400).json({
                    status: false,
                    message: "Start time,end time, venue and body are required",
                });
            }
        }
        const createdAt = moment().utc().format("lll");



        const newNotification = {
            notificationType,
            notificationTo,
            title,
            date,
            emailType,
            startTime,
            endTime,
            venue,
            body,
            specificDoors,
            recurringDate,
            recurringDay,
            recurringFrequency,
            createdAt
        };

        const notification = await Notification.create(newNotification);

        if (file) {
            const fileName = file.originalname; // Get the original file name
            const fileType = file.mimetype;
            const newPath = `notification/${Date.now()}_${file.originalname}`;

            await new Promise((resolve, reject) => {
                uploadFilestoAws(file, newPath, (err, path) => {
                    if (err) return reject(err);
                    resolve(path);
                });
            });

            const documentUrl = getPublicImageUrl(newPath);
            await NotificationDocument.create({
                documentName: fileName,
                documentPath: documentUrl,
                documentType: fileType,
                notificationId: notification._id,
                createdAt
            })
        }

        let userFilter = {

        }
        if (notificationTo == NOTIFICATION_TO_ADMIN) {
            userFilter.role = SUPER_ADMIN
        }
        if (notificationTo == NOTIFICATION_TO_SPECIFIC) {

        }
        if (notificationTo == NOTIFICATION_TO_ALL_MEMBER) {

        }
        if (notificationTo == NOTIFICATION_TO_ALL_OWNER) {
            userFilter.role = OWNER
        }

        const userList = await User.find(userFilter);
        const emailList = getEmails(userList);

        if (notificationType == NOTIFICATION_ASSOCIATION_MEETING) {
            sendEMail(NOTIFICATION_ASSOCIATION_MEETING + " Notification", emailList, body, '')
        }
        return res.status(201).json({
            status: true,
            message: "Notification created successfully",
        });
    } catch (error) {
        next(error);
    }
}

export async function getNotification(req, res, next) {
    try {
        const notification = await Notification.find({});
        res.status(200).json({ status: true, data: notification });
    } catch (error) {
        next(error);
    }
};