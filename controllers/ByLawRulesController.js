import { ByLawRules, ByLawVersionControl } from "../models/ByLawRulesModel.js"; // Importing separately
import { uploadFilestoAws, getPublicImageUrl } from "../utils/s3.js";
import moment from "moment";
import {
  BY_LAW_STATUS_YES,
  BY_LAW_STATUS_NO,
} from "../constants/bylawStatus.js";

export async function createByLaw(req, res, next) {
  try {
    const { description, version, documentName } = req.body;
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ status: false, message: "PDF file is required" });
    }

    const allowedMimeTypes = ["application/pdf"];
    const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);

    const allowedExtensions = [".pdf"];
    const fileExtension = file.originalname.split(".").pop().toLowerCase();
    const isExtensionValid = allowedExtensions.includes(`.${fileExtension}`);

    if (!isMimeTypeValid || !isExtensionValid) {
      return res
        .status(400)
        .json({ status: false, message: "Only PDF files are allowed" });
    }

    if (!description || description.trim().length === 0) {
      return res
        .status(400)
        .json({ status: false, message: "Description is required" });
    }

    const newPath = `by-laws/${Date.now()}_${file.originalname}`;
    const createAt = moment().format("lll");

    await new Promise((resolve, reject) => {
      uploadFilestoAws(file, newPath, (err, path) => {
        if (err) return reject(err);
        resolve(path);
      });
    });

    const documentUrl = getPublicImageUrl(newPath);

    const versionControl = await ByLawVersionControl.findOneAndUpdate(
      {},
      { $inc: { currentVersion: 1 } },
      { new: true, upsert: true }
    );

    const byLawData = new ByLawRules({
      description,
      documentUrl,
      status:
        versionControl.currentVersion === 1
          ? BY_LAW_STATUS_YES
          : BY_LAW_STATUS_NO,
      version,
      createAt: createAt,
      uploadedBy: req.userId,
      documentName,
    });

    await byLawData.save();

    res.status(201).json({
      status: true,
      message: "By-Law Rules  are created successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function getByLaw(req, res, next) {
  try {
    const byLaw = await ByLawRules.find(
      {},
      {
        version: 1,
        description: 1,
        documentUrl: 1,
        status: 1,
        visibleToMember: 1,
        uploadDate: 1,
        documentName: 1,
      }
    ).populate("uploadedBy", "name");
    res.status(200).json({ status: true, data: byLaw });
  } catch (error) {
    next(error);
  }
}

export async function getByLawForMember(req, res, next) {
  try {
    const byLaw = await ByLawRules.find(
      { status: BY_LAW_STATUS_YES },
      {
        version: 1,
        description: 1,
        documentUrl: 1,
        status: 1,
        visibleToMember: 1,
        uploadDate: 1,
        documentName: 1,
      }
    ).populate("uploadedBy", "name");
    res.status(200).json({ status: true, data: byLaw });
  } catch (error) {
    next(error);
  }
}

export async function updateByLaw(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ status: false, message: "Required by law rules Id" });
    }

    const existData = await ByLawRules.findById(id);

    if (!existData) {
      return res
        .status(404)
        .json({ status: false, message: "Details not found" });
    }

    const updatedDocuments = await ByLawRules.updateMany(
      { visibleToMember: true },
      { visibleToMember: false },
      { runValidators: true }
    );

    const updatedStatus = await ByLawRules.updateMany(
      {},
      { status: BY_LAW_STATUS_NO },
      { runValidators: true }
    );

    const updatedOneDocument = await ByLawRules.findByIdAndUpdate(
      id,
      { visibleToMember: true, status: BY_LAW_STATUS_YES },
      { new: true }
    );

    res.status(200).json({
      status: true,
      message: "Document updated successfully",
    });
  } catch (error) {
    next(error);
  }
}
