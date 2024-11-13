import OwnerDocument from "../models/ownerDocumentModal.js";
import User from "../models/userModal.js";
import nodemailer from "nodemailer";
import { SUPER_ADMIN } from "../constants/roles.js";
import { PENDING } from "../constants/documentStatus.js";
import { DEFAULT_EMAIL_ADDRESS, EMAIL_CREDENTIALS } from "../config.js";
import Flat from "../models/flatModal.js";
import { sendEMail } from "../constants/mailservices.js";

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_CREDENTIALS.user,
    pass: EMAIL_CREDENTIALS.pass,
  },
});

export async function getPendingCount(req, res, next) {
  try {
    const total = await User.countDocuments({
      isActive: false,
      isEmailVerified: true,
      isAdminVerified: false,
      role: { $ne: SUPER_ADMIN },
    });
    return res.status(201).json({ status: true, count: total });
  } catch (error) {
    next(error);
  }
};

export async function updateDocumentStatus(req, res, next) {
  try {
    const id = req.params.id;

    const { status } = req.body;


    var mailContent = "";
    var mailSubject = "";
    // Update the document status
    const updateDocument = await OwnerDocument.findByIdAndUpdate(
      id,
      {
        status: status ? "accepted" : "rejected",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updateDocument) {
      return res.status(404).json({
        status: false,
        message: "Document not found",
      });
    }

    // Find the user associated with the document
    const userData = await User.findById(updateDocument.userId)
      .populate("blockId")
      .populate("flatId");
    if (!userData) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Check if all documents for the user are accepted
    const allDocuments = await OwnerDocument.find({
      userId: updateDocument.userId,
    });
    const allAccepted = allDocuments.every((doc) => doc.status == "accepted");

    // Send email based on document status
    if (status) {
      // Document accepted
      res.status(200).json({
        status: true,
        message: "Document status updated successfully",
      });


      if (allAccepted) {
        mailContent = `
          <!DOCTYPE html>
          <html>
          <body>
              <p>Dear ${userData.name},</p>
              <p>The Registration has been approved. Kindly login and check - <strong>http://localhost:5173/</strong></p>
              <p>Regards,
              <br>Admin</p>
          </body>
          </html>
        `;
        mailSubject = ` ${userData.name} - ${userData.blockId.blockName} - ${userData.flatId.flatName} Registration Approved`
        const updateFlat = await Flat.findOneAndUpdate({ "flatId": userData.flatId._id }, { isBooked: true });
      }
    } else {
      // Document rejected
      mailContent = `
          <!DOCTYPE html>
          <html>
          <body>
              <p>Dear ${userData.name},</p>
              <p>    The Following document ${updateDocument.documentName} - has been 
              rejected for the reason "Reason Pending". Kindly re-upload the document by loggin in our portal -
               <strong>http://localhost:5173/</strong>  </p>
               <p>Regards,
               <br>Admin</p>
          </body>
          </html>
        `;

      mailSubject = ` ${userData.name} - ${userData.blockId.blockName} - ${userData.flatId.flatName} ${updateDocument.documentName} Rejected`;

      const allRejeceted = allDocuments.every(
        (doc) => doc.status == "rejected"
      );

      if (allRejeceted) {
        mailContent = `
              <!DOCTYPE html>
              <html>
              <body>
                  <p>Dear ${userData.name},</p>
                  <p>The Registration has been rejected for the reason Waiting for reason. 
                  Kindly re-update the details by loggin in our portal - <strong>http://localhost:5173/</strong>  </p>
                   <p>Regards,
                   <br>Admin</p>
              </body>
              </html>
            `;

        mailSubject = ` ${userData.name} - ${userData.blockId.blockName} - ${userData.flatId.flatName} Registration Rejected`;
      }
      res.status(200).json({
        status: true,
        message: "Document status updated successfully",
      });
    }
    if (mailSubject && mailContent)
      var mailResponse = await sendEMail(mailSubject, userData.email, mailContent)
  } catch (err) {
    next(err);
  }
}

export async function getUserDocumentPendingList(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    // Fetch pending documents with userId populated
    const pendingUserData = await OwnerDocument.find({
      status: { $ne: PENDING },
    })
      .populate({
        path: "userId",
        populate: [
          { path: "blockId" }, // Populate blockId
          { path: "flatId" }, // Populate flatId
        ],
      })
      .limit(limit)
      .skip(skip);

    // Group the pendingUserData by userId
    const groupedData = pendingUserData.reduce((acc, current) => {
      const userId = current?.userId?._id.toString(); // Convert ObjectId to string

      if (!acc[userId]) {
        acc[userId] = {
          userId: {
            ...current?.userId?.toObject(), // Convert user document to plain object
            blockId: current?.userId?.blockId, // Include populated blockId
            flatId: current?.userId?.flatId, // Include populated flatId
          },
          documents: [],
        };
      }

      acc[userId].documents.push({
        _id: current?._id,
        documentName: current?.documentName,
        status: current?.status,
        comments: current?.comments,
        createdAt: current?.createdAt,
        updatedAt: current?.updatedAt,
        documentPath: current?.documentPath,
      });

      return acc;
    }, {});

    // Convert groupedData from an object to an array
    const groupedDataArray = Object.values(groupedData);

    const total = await User.countDocuments({
      isActive: false,
      isEmailVerified: true,
      isAdminVerified: false,
      role: { $ne: SUPER_ADMIN },
    });

    res.status(200).json({
      message: "Get Pending Users List",
      data: groupedDataArray,
      total: total,
    });
  } catch (err) {
    next(err);
  }
}
export async function getOwnerDocumentList(req, res, next) {
  try {
    const id = req.params.id;

    const docData = await OwnerDocument.find({
      userId: id,
      status: { $ne: PENDING }, // $ne is used for checking not equal to a single value
    }).populate("userId");

    return res.status(200).json({
      status: true,
      message: "Get owner documents list",
      data: docData,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllMemberList(req, res, next) {

  const data = req.body;

  var { page, pageSize } = req.query;

  if (!page || !pageSize) {
    return res.status(422).json({
      status: false,
      message: "Required page and pagesize"
    });
  }

  page = parseInt(data.page) || 1;
  pageSize = parseInt(data.pageSize) || 10;
  const skip = (page - 1) * pageSize;


  User.aggregate([
    {
      $match: {
        role: {
          $ne: SUPER_ADMIN
        }
      }
    },
    {
      $lookup: {
        from: "blocks",
        localField: "blockId",
        foreignField: "_id",
        as: "blockdata"
      }
    },
    {
      $unwind: {
        path: "$blockdata",
        preserveNullAndEmptyArrays: true // Keeps users without blockdata
      }
    },
    {
      $lookup: {
        from: "flats",
        localField: "flatId",
        foreignField: "_id",
        as: "flatdata"
      }
    },
    {
      $unwind: {
        path: "$flatdata",
        preserveNullAndEmptyArrays: true // Keeps users without flatdata
      }
    },
    {
      $lookup: {
        from: "familymembers",
        localField: "_id",
        foreignField: "userId",
        as: "familyData"
      }
    },
    {
      $lookup: {
        from: "pets",
        localField: "_id",
        foreignField: "userId",
        as: "petsData"
      }
    },
    {
      $lookup: {
        from: "vehicledetails",
        localField: "_id",
        foreignField: "userId",
        as: "vehicleData"
      }
    },
    {
      $project: {
        name: 1,
        phoneNumber: 1,
        residentType: 1,
        blockName: "$blockdata.blockName",
        flatNumber: "$flatdata.flatName",
        familyData: 1,
        petsData: 1,
        vehicleData: 1,
        isActive: 1
      }
    },
    {
      $skip: skip
    },
    {
      $limit: pageSize
    }
  ])
    .then(result => {
      res.status(201).json({
        status: true,
        data: result
      });
    }).catch(error => {
      console.log(error)
    })
}