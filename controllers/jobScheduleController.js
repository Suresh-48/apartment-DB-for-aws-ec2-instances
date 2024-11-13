import JobScheduler from "../models/jobSchedulerModel.js";
import User from "../models/userModal.js";
import Association from "../models/associationModel.js";
import { OWNER, RENTAL } from "../constants/roles.js";
import { sendEMail } from "../constants/mailservices.js";

export async function createJobScheduler(req, res, next) {
  try {
    const { name } = req.body;

    // Create the jon scheduler
    const newData = {
      name,
    };
    const createSchedulerData = await JobScheduler.create(newData);

    res.status(201).json({
      status: true,
      message: "Job Scheduler created successfully",
      data: createSchedulerData, // Optionally return the created record
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
}
export async function sendNotification(req, res, next) {
  try {
    // Get active user list and remove duplicates based on flatId
    const userList = await User.aggregate([
      {
        $match: {
          role: { $in: [OWNER, RENTAL] },
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$flatId", // Group by flatId to remove duplicates
          doc: { $first: "$$ROOT" }, // Keep the first document for each flatId
        },
      },
      {
        $replaceRoot: { newRoot: "$doc" }, // Replace the root with the deduplicated document
      },
    ]);

    const association = await Association.findOne({})
    // Send all emails concurrently using Promise.all for better performance
    const emailPromises = userList.map((userDetails) => {
      // Email Subject
      const mailSubject = `${userDetails.name} - Maintenance Fees Notification`;
      const recipientEmail = userDetails.email;

      // Email content
      const maintenanceFeesEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Maintenance Amount Notification</title>
      </head>
      <body>
          <p>Dear ${userDetails.name},</p>
          <p>We hope this message finds you well.</p>
          <p>Please be informed that your maintenance amount is <strong>${100}</strong>.</p>
          <p>If you believe this is an error or need further assistance, kindly reach out to us at [Contact Information].</p>
          <p>We appreciate your involvement and thank you for being a part of our community.</p>
          <p>Best regards,</p>
          <p>[Your Name]</p>
          <p>${association.name}</p>
      </body>
      </html>
      `;

      // Return the promise for sending email
      return sendEMail(mailSubject, recipientEmail, maintenanceFeesEmailContent);
    });

    // Wait for all emails to be sent concurrently
    await Promise.all(emailPromises);

    res.status(200).json({
      status: true,
      message: "Maintenance Fees sent to all users",
      data: userList,
    });
  } catch (err) {
    next(err);
  }
}

