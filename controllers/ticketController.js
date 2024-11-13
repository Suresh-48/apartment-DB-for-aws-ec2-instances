import Ticket from "../models/ticketModel.js";
import Association from "../models/associationModel.js";
import TicketDocument from "../models/ticketDocumentModel.js";
import moment from "moment";
import { getPublicImageUrl, uploadBase64File } from "../utils/s3.js";
import { sendEMail } from "../constants/mailservices.js";
import mongoose from "mongoose";
import { COMPLETED, PROCESSING } from "../constants/documentStatus.js";

// pending:
// best regards
// model validation
// front end issue type based email

export async function createTicket(req, res, next) {
  try {
    const { issueType, natureOfIssue, location, description, files, userId } =
      req.body;

    // Validate the files array

    const date = Date.now();
    const createdAt = moment(date).format("lll");

    const ticketDetailsId = await Ticket.generateTicketDetailsId();

    // Create the ticket
    const newData = {
      userId: new mongoose.Types.ObjectId(userId),
      issueType,
      natureOfIssue,
      createdAt,
      location,
      description,
      ticketDetailsId,
    };
    const ticket = await Ticket.create(newData);

    let ticketDetails = await Ticket.findOne({ _id: ticket._id }).populate({
      path: "userId",
      populate: [
        { path: "blockId", model: "Block" }, // Populate block inside userId
        { path: "flatId", model: "Flat" }, // Populate flat inside userId
      ],
    });

    // Upload and save files if provided
    if (files && files.length > 0) {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          if (!file.fileName || !file.fileData) {
            throw new Error("Missing file name or data");
          }

          const base64Data = file.fileData;
          const fileType = base64Data.split(";")[0].split("/")[1];
          const newFileName = file.fileName;
          const newFilePath = newFileName;

          return new Promise((resolve, reject) => {
            uploadBase64File(base64Data, newFilePath, (err, mediaPath) => {
              if (err) {
                return reject(err);
              }
              resolve({
                userId: req.userId,
                ticketId: ticket._id,
                ticketDetailsId,
                documentName: newFileName,
                documentPath: getPublicImageUrl(mediaPath),
                documentType: fileType,
                createdAt: new Date(),
              });
            });
          });
        })
      );

      // Insert documents into the TicketDocument collection
      await TicketDocument.insertMany(uploadedFiles);
    }

    const association = await Association.findOne({})
    // Send confirmation email
    var mailContent = `
          <html>
          <body>
              <p>Dear ${ticketDetails?.userId?.name},</p>
              <p>Thank you for reaching out to us. We have received your ticket regarding the ${ticketDetails?.issueType
      } issue in your apartment (${ticketDetails?.userId?.blockId?.blockName +
      "-" +
      ticketDetails?.userId?.flatId?.flatName
      }). Your concern is important to us, and we are committed to resolving it as quickly as possible.</p>
              <br/>
              <b>Ticket Details:</b>
              <ul>
              <li>Ticket ID: ${ticketDetails?.ticketDetailsId}</li>
              <li>Issue Type: ${ticketDetails?.issueType}</li>
              <li>Nature of Issue : ${ticketDetails?.natureOfIssue}</li>
              <li>Description: ${ticketDetails?.description}</li>
              <li>Date Submitted: ${moment(ticketDetails?.createdAt).format(
        "DD-MM-YYYY"
      )}</li>
              </ul>
              <br/>
              <p>Our maintenance team will review your request and schedule a visit to your apartment at the earliest convenience. You will be notified in advance of the scheduled visit.</p>
             ${ticketDetails?.natureOfIssue == "Plumbing"
        ? "<p>For Plumbing Issues: If you notice a significant leak or flooding, please use the shutoff valve if safe to do so and contact our emergency services at [Emergency Contact Number].</p>"
        : ""
      }
          ${ticketDetails?.natureOfIssue == "Electrician"
        ? "<p>For Electrical Issues: If the issue is urgent (e.g., power outage or exposed wiring), please call our emergency hotline immediately at [Emergency Contact Number].</p>"
        : ""
      }
              <p>We appreciate your patience as we work to resolve this matter. If you have any additional information or concerns, please reply to this email, and our team will assist you further.</p>
              <p></p>
              <p>Best Regards,</p>
              <p>[Your Name]</p>
              <p>[Your Position]</p>
              <p>${association?.name}</p>
              <p>${association?.address}</p>
              <p>${association?.contactNumber}</p>
          </body>
          </html>
      `;

    var mailSubject = `Ticket Confirmation: ${natureOfIssue} Reported`;
    var mailResponse = await sendEMail(
      mailSubject,
      ticketDetails?.userId?.email,
      mailContent
    );

    res.status(201).json({
      status: true,
      message: "Ticket created successfully",
    });
  } catch (error) {
    console.log("error.....", error)
    res.status(500).json({
      status: false,
      message: "An error occurred while creating ticket or uploading files",
      error: error.message,
    });
  }
}

export async function updateTicketFiles(req, res, next) {
  try {
    req.body.ticketDetailsId = req.params.id;
    const { ticketDetailsId, files } = req.body;

    if (!ticketDetailsId) {
      return res.status(400).json({
        status: false,
        message: "Ticket ID is required.",
      });
    }

    if (!Array.isArray(files)) {
      return res.status(400).json({
        status: false,
        message: "Invalid files format. Files should be an array.",
      });
    }

    const existingFiles = await TicketDocument.find({ ticketDetailsId });

    if (existingFiles.length + files.length > 3) {
      return res.status(422).json({
        status: false,
        message: "The maximum number of files allowed is 3.",
      });
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        if (!file.fileName || !file.fileData) {
          throw new Error("Missing file name or data");
        }

        const base64Data = file.fileData;
        const fileType = base64Data.split(";")[0].split("/")[1];
        const newFileName = file.fileName;
        const newFilePath = newFileName;

        return new Promise((resolve, reject) => {
          uploadBase64File(base64Data, newFilePath, (err, mediaPath) => {
            if (err) {
              return reject(err);
            }

            resolve({
              userId: req.userId,
              ticketId: new mongoose.Types.ObjectId(existingFiles?.ticketId),
              ticketDetailsId:
                existingFiles[0]?.ticketDetailsId || ticketDetailsId,
              documentName: newFileName,
              documentPath: getPublicImageUrl(mediaPath),
              documentType: fileType,
              createdAt: new Date(),
            });
          });
        });
      })
    );
    await TicketDocument.insertMany(uploadedFiles);
    res.status(201).json({
      status: true,
      message: "Files updated successfully.",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "An error occurred while updating files.",
      error: error.message,
    });
  }
}

export async function deleteTicketDocument(req, res, next) {
  try {
    const result = await TicketDocument.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Document not found.",
      });
    }
    res.status(201).json({
      status: true,
      message: "Document deleted successfully.",
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "An error occurred while deleting the document.",
      error: err.message,
    });
  }
}

export async function getTicketListForAdmin(req, res, next) {
  try {
    const ticketStatus = req.params.id;
    const statusFilter = ticketStatus === "all" ? {} : { status: ticketStatus };

    const result = await Ticket.find(statusFilter)
      .populate({
        path: "userId",
        match: { isActive: true },
        populate: [
          { path: "blockId", model: "Block" },
          { path: "flatId", model: "Flat" },
        ],
      })
      .sort({ createdAt: -1 });

    // Filter out tickets with no active user.
    const activeTickets = result.filter((ticket) => ticket.userId !== null);
    const ticketIds = activeTickets.map((ticket) => ticket._id);
    const activeUserIds = activeTickets.map((ticket) => ticket.userId._id);

    // Fetch only the documents for active users' tickets.
    const ticketDocuments = await TicketDocument.find({
      ticketId: { $in: ticketIds },
      userId: { $in: activeUserIds }, // Ensure documents belong to active users.
    });

    // Merge ticket documents with their corresponding tickets.
    const resultWithDocuments = activeTickets.map((ticket) => ({
      ...ticket.toObject(),
      ticketDocuments: ticketDocuments.filter((doc) =>
        doc.ticketId.equals(ticket._id)
      ),
    }));

    res.status(200).json({
      status: true,
      data: resultWithDocuments,
    });
  } catch (err) {
    next(err);
  }
}


export async function getTicketListByUser(req, res, next) {
  try {
    const id = req.params.id;
    const result = await Ticket.find({ userId: id }).populate("userId");

    res.status(201).json({
      status: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

async function sendUpdateStatusMail(obj) {
  try {
    const association = await Association.findOne({});
    var mailContent = `
        
    <html>
        <body>

            <p>Dear ${obj?.userId?.name},</p>

            <b>Ticket Details:</b>

            <ul>
                <li>Ticket ID: ${obj?.ticketDetailsId}</li>
                <li>Issue Type: ${obj?.issueType}</li>
                <li>Nature of Issue : ${obj?.natureOfIssue}</li>
                <li>Description: ${obj?.description}</li>
                <li>Date Submitted: ${moment(obj?.createdAt).format(
      "DD-MM-YYYY"
    )}</li>
                <li>Status: ${obj?.status === "R"
        ? "Requested"
        : obj?.status === "C"
          ? "Completed"
          : obj?.status === "P"
            ? "Processing"
            : ""
      }</li>
            </ul>
            <br />

            <p>We appreciate your patience as we work to resolve this matter.
                If you have any additional information or concerns, please create fresh ticket or call us</p>

            <p>Best Regards,</p>

            <p>[Your Name]</p>
            <p>[Your Position]</p>
            <p>${association?.name}</p>
            <p>[Contact Information]</p>

        </body>
    </html>
`;
    var mailSubject = `Ticket Confirmation: ${obj?.natureOfIssue} Status Update`;
    var mailResponse = await sendEMail(
      mailSubject,
      obj?.userId?.email,
      mailContent
    );
    return mailResponse;
  } catch (e) {
    return e;
  }
}

export async function updateStatus(req, res, next) {
  if (!req.body.status) {
    return res.status(422).json({ status: false, message: "Required status" });
  }
  const update = { status: req.body.status };

  try {
    const updatedDocument = await Ticket.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).populate("userId");

    if (!updatedDocument) {
      return res.status(404).json({ message: "Document not found" });
    }

    var newmailResponse = await sendUpdateStatusMail(updatedDocument);

    res.status(200).json({
      status: true,
      message: "Document updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error updating document",
      error: error.message,
    });
  }
}

// export async function deleteTickets(req, res, next) {
//     try {
//         const ticketId = req.params.id;

//         // Find all flats associated with the blockId
//         const ticketData = await Ticket.find({ ticketId });

//         // Delete all flats associated with the blockId
//         await Ticket.deleteMany({ ticketId });

//         // Delete the block itself
//         const deletedTicket = await Ticket.findByIdAndDelete(ticketId);

//         if (!deletedTicket) {
//             return res.status(404).json({
//                 status: false,
//                 message: 'Ticket not found.',
//             });
//         }

//         res.status(200).json({
//             status: true,
//             message: 'Tickets deleted successfully.',
//         });
//     } catch (err) {
//         next(err);
//     }
// }
