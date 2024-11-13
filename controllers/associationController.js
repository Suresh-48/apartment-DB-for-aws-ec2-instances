import Association from "../models/associationModel.js";
import AssociationAmount from "../models/associationAmountModel.js";
import moment from "moment";
import { getPublicImageUrl, uploadBase64File } from "../utils/s3.js";
import mongoose from "mongoose";
import AssociationDocument from "../models/associationDocumentModel.js";
import { MaintenanceConfiguration } from "../models/maintenanceConfigurationModel.js";

async function uploadFiles(files) {
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
              documentName: newFileName,
              documentPath: getPublicImageUrl(mediaPath),
              documentType: fileType,
              createdAt: new Date(),
            });
          });
        });
      })
    );

    return uploadedFiles;
  }
}

async function uploadSingleFile(file) {
  if (file && file.fileName && file.fileData) {
    try {
      const base64Data = file.fileData;
      const fileType = base64Data.split(";")[0].split("/")[1]; // Extract the file type
      const newFileName = file.fileName; // Use the provided file name
      const newFilePath = newFileName; // Define the file path

      // Return a promise that resolves with the uploaded file info
      return new Promise((resolve, reject) => {
        uploadBase64File(base64Data, newFilePath, (err, mediaPath) => {
          if (err) {
            return reject(err); // Handle error during upload
          }

          // Resolve with file info once the upload is successful
          resolve({
            documentName: newFileName,
            documentPath: getPublicImageUrl(mediaPath), // Public URL of the uploaded file
            documentType: fileType, // Type of the file (e.g., jpg, png)
            createdAt: new Date(), // Timestamp of the upload
          });
        });
      });
    } catch (error) {
      throw new Error("File upload failed: " + error.message);
    }
  } else {
    throw new Error("Missing file name or data");
  }
}


const validateFields = (data) => {
  const errors = [];

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Name is required and must be a string.');
  }
  if (!data.address || typeof data.address !== 'string') {
    errors.push('Address is required and must be a string.');
  }
  if (!data.registrationNumber || typeof data.registrationNumber !== 'string') {
    errors.push('Registration Number is required and must be a string.');
  }
  if (!data.pan || typeof data.pan !== 'string') {
    errors.push('PAN is required and must be a string.');
  }
  if (!data.contactName || typeof data.contactName !== 'string') {
    errors.push('Contact Name is required and must be a string.');
  }

  if (!data.contactNumber || typeof data.contactNumber !== 'string') {
    errors.push('Contact Number is required and must be a string.');
  } else {
    const contactNumberStr = String(data.contactNumber).trim(); // Ensure it's a string and trimmed
    const phoneRegex = /^[6-9]\d{9}$/; // Only digits, must start with 6-9 and have 10 digits

    if (!phoneRegex.test(contactNumberStr)) {
      errors.push('Contact Number is invalid. It should be 10 digits and start with a number between 6 and 9.');
    }
  }

  if (data.photo && !(typeof data.photo === 'string' || typeof data.photo === 'object')) {
    errors.push('Photo must be an object or a string if provided.');
  }

  if (!data.logo || typeof data.logo !== 'object') {
    errors.push('Logo URL or file is required and must be an object.');
  }
  if (!data.moa || typeof data.moa !== 'string') {
    errors.push('MOA is required and must be a string.');
  }

  return errors;
};

export async function createAssociation(req, res, next) {
  try {
    const errors = validateFields(req.body);

    if (errors.length > 0) {
      let err = errors[0];
      return res.status(400).json({ status: false, message: err });
    }

    const isExist = await Association.findOne({});

    if (isExist) {
      res.status(400).json({
        status: false,
        message: "You have data already",
      });
    }

    const { name, address, registrationNumber, pan, contactName, contactNumber, photo, logo, moa } =
      req.body;

    const userId = req.userId;

    const date = Date.now();
    const createdAt = moment(date).format("lll");

    const newData = {
      userId: new mongoose.Types.ObjectId(userId), createdAt,
      name, address, registrationNumber, pan, contactName, contactNumber, moa
    };

    const createData = await Association.create(newData);

    var photoDataArray = await uploadFiles(photo);

    // Upload the logo (assuming `uploadSingleFile` uploads a single file)
    let logoData = null;
    if (logo) {
      logoData = await uploadSingleFile(logo);
    }

    let photoData = [];
    if (photoDataArray && Array.isArray(photoDataArray)) {
      photoData = photoDataArray.map(file => ({
        ...file,
        associationId: createData._id,
        field: "photo"
      }));
    }



    const associationDocuments = await AssociationDocument.insertMany([...photoData]);

    const updateLogoData = await Association.findByIdAndUpdate(
      createData._id,
      {
        logo: logoData.documentPath,
        logoName: logoData.documentName,
        logoType: logoData.documentType,

      }, // Only add `logo` if it's uploaded successfully
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(201).json({
      status: true,
      message: "Association details created successfully",
      data: updateLogoData,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "An error occurred while creating ticket or uploading files",
      error: error.message
    });
  }
}

export async function updateAssociation(req, res, next) {
  try {
    const { id } = req.params;
    const { name, address, registrationNumber, pan, contactName, contactNumber, photo, logo, moa } = req.body;

    // Find the existing association
    const existingAssociation = await Association.findById(id);
    if (!existingAssociation) {
      return res.status(404).json({ status: false, message: "Association not found." });
    }

    // Prepare updated data: Only include fields that are present in the request body
    const updatedData = {
      ...(name && { name }),
      ...(address && { address }),
      ...(registrationNumber && { registrationNumber }),
      ...(pan && { pan }),
      ...(contactName && { contactName }),
      ...(contactNumber && { contactNumber }),
      ...(moa && { moa }),
      updatedAt: moment().format("lll"), // or use native JS date
    };

    // Handle file uploads for logo and photo
    let logoData = null;
    let photoData = [];

    // Handle logo upload (if logo is provided)
    if (logo && typeof logo === 'object' && 'fileName' in logo) {
      try {
        logoData = await uploadSingleFile(logo);
        if (logoData) {
          updatedData.logo = logoData.documentPath;
          updatedData.logoName = logoData.documentName;
          updatedData.logoType = logoData.documentType;
        }
      } catch (error) {
        return res.status(500).json({ status: false, message: "Logo upload failed", error: error.message });
      }
    }

    // Handle photo upload (if photos are provided)
    if (photo && Array.isArray(photo) && photo.length > 0) {
      try {
        photoData = await uploadFiles(photo);
        photoData = photoData?.map(file => ({
          ...file,
          associationId: id,
          field: "photo",
        }));
      } catch (error) {
        return res.status(500).json({ status: false, message: "Photo upload failed", error: error.message });
      }
    }

    // Update the association with new data
    const updatedAssociation = await Association.findByIdAndUpdate(id, updatedData, { new: true });

    // Handle photo document updates and removals if photos were uploaded
    if (photoData.length > 0) {
      const existingDocuments = await AssociationDocument.find({ associationId: id, field: 'photo' });
      const newPhotoNames = photoData.map(doc => doc.documentName);

      // Update or create new photo documents
      for (const newPhoto of photoData) {
        const existingPhoto = existingDocuments.find(doc => doc.documentName === newPhoto.documentName);
        if (existingPhoto) {
          await AssociationDocument.findByIdAndUpdate(existingPhoto._id, newPhoto, { new: true });
        } else {
          await AssociationDocument.create(newPhoto);
        }
      }

      // Remove old photos that are no longer present in the updated data
      const photosToRemove = existingDocuments.filter(doc => !newPhotoNames.includes(doc.documentName));
      if (photosToRemove.length > 0) {
        await AssociationDocument.deleteMany({ _id: { $in: photosToRemove.map(doc => doc._id) } });
      }
    }

    res.status(200).json({
      status: true,
      message: "Association details updated successfully",
      data: updatedAssociation
    });
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
    } else {
      return res.status(500).json({ status: false, message: "An error occurred", error: error.message });
    }
  }
}

export async function getAssociation(req, res, next) {
  try {
    const associationData = await Association.findOne({});
    res.status(201).json({
      status: true,
      data: associationData,
    });
  } catch (err) {
    next(err);
  }
}
