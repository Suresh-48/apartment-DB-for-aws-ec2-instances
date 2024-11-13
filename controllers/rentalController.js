import Rental from "../models/rentalModel.js";
import moment from "moment";
import User from "../models/userModal.js";
import {
  uploadBase64File,
  getPublicImageUrl,
  uploadDocstoAws,
} from "../utils/s3.js";
import path from "path";
import { ValidateObj } from "../utils/promises.js";

export async function createRental(req, res, next) {
  try {
    const data = req.body;
    // Check if rental data already exists
    let rentalData = await Rental.findOne({ userId: data.userId });

    // Validate fields if handleValidation is true
    if (data.handleValidation) {
      const missingFields = [];
      const requiredFields = [
        "userId",
        "emergencyContactName",
        "emergencyContactNumber",
        "dob",
        "gender",
        "aadharNumber",
        "addressProof",
        "photo",
        "maintenancePaidBy",
        "typeOfGasConnection"
      ];

      for (const field of requiredFields) {
        if (!data[field]) {
          missingFields.push(field);
        }
      }

      // Additional check for specialization if doctor is true
      if (data.doctor == true && !data.specialization) {
        missingFields.push("specialization");
      }

      if (missingFields.length > 0) {
        return res.status(422).json({
          status: false,
          message: `${missingFields.join(", ")} are required fields`,
        });
      }
    }

    // If no existing rental data, create a new one
    if (!rentalData) {
      rentalData = new Rental({
        userId: data.userId,
        whatsappNumber: data.whatsapp,
        emergencyContactName: data.emergencyContactName,
        emergencyContactNumber: data.emergencyContactNumber,
        dob: data.dob,
        age: data.age,
        bloodGroup: data.bloodGroup,
        gender: data.gender,
        aadharNumber: data.aadharNumber,
        workType: data.workType,
        workAddress: data.workAddress,
        isDoctor: data.doctor,
        specialization: data.specialization,
        maintenancePaidBy: data.maintenancePaidBy,
        typeOfGasConnection: data.typeOfGasConnection,
      });

      if (!data.handleValidation) {
        await rentalData.save({ validateBeforeSave: false });
      } else {
        await rentalData.save();
      }

      // Link the rental record to the user
      await User.findByIdAndUpdate(
        data.userId,
        { rentalId: rentalData._id },
        { runValidators: true, new: true }
      );

      // Send response immediately
      res.status(201).json({
        status: "Created",
        message: "Profile created successfully",
      });
    } else {
      // Update existing rental record
      Object.assign(rentalData, {
        whatsappNumber: data.whatsapp,
        emergencyContactName: data.emergencyContactName,
        emergencyContactNumber: data.emergencyContactNumber,
        dob: data.dob,
        age: data.age,
        bloodGroup: data.bloodGroup,
        gender: data.gender,
        aadharNumber: data.aadharNumber,
        workType: data.workType,
        workAddress: data.workAddress,
        isDoctor: data.doctor,
        specialization: data.specialization,
        maintenancePaidBy: data.maintenancePaidBy,
        typeOfGasConnection: data.typeOfGasConnection,
      });

      if (!data.handleValidation) {
        await rentalData.save({ validateBeforeSave: false });
      } else {
        await rentalData.save();
      }

      // Send response immediately
      res.status(201).json({
        status: "Updated",
        message: "Profile updated successfully",
      });
    }

    // Handle file uploads asynchronously after sending the response
    const uploadFile = (file, filePath, fieldName) => {
      return new Promise((resolve, reject) => {
        uploadBase64File(file, filePath, async (err, mediaPath) => {
          if (err) {
            return reject(err);
          }
          await Rental.updateOne(
            { _id: rentalData._id },
            { [fieldName]: getPublicImageUrl(mediaPath) }
          );
          resolve();
        });
      });
    };

    // Address Proof file upload
    const addressProofFile = data.addressProof;
    const addressProofType = addressProofFile?.split(";")[0]?.split("/")[1];
    const addressProofFileName = `${
      data.userId
    }-${new Date().getTime()}-addressProof.${addressProofType}`;
    const addressProofFilePath = `${addressProofFileName}`;

    if (addressProofFile) {
      await uploadFile(addressProofFile, addressProofFilePath, "addressProof");
    }

    // Photo file upload
    const photoFile = data.photo;
    const photoType = photoFile?.split(";")[0]?.split("/")[1];
    const photoFileName = `${
      data.userId
    }-${new Date().getTime()}-photo.${photoType}`;
    const photoFilePath = `${photoFileName}`;

    if (photoFile) {
      await uploadFile(photoFile, photoFilePath, "photo");
    }
  } catch (error) {
    if (error.name === "ValidationError") {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      const firstValidationErrorField = Object.keys(validationErrors)[0];
      const errorMessage = validationErrors[firstValidationErrorField];

      return res.status(422).json({
        status: false,
        message: errorMessage,
      });
    }
    next(error);
  }
}
