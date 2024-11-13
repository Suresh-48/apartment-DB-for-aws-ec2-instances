import AssociationAmount from "../models/associationAmountModel.js";
import AssociationDetails from "../models/associationDetails.js";
import moment from "moment";
import { MaintenanceConfiguration } from "../models/maintenanceConfigurationModel.js";
import { getPublicImageUrl, uploadBase64File } from "../utils/s3.js";
import AssociationDetailDocument from "../models/associationDetailsDocument.js";
import {
  ASSOCIATION_PAYMENT_ACCOUNT,
  ASSOCIATION_PAYMENT_PETTY_CASH,
  ACCOUNT_BALANCE,
  PETTY_CASH,
  ASSOCIATION_PAYMENT_CASH,
  ASSOCIATION_TYPE_CREDIT,
  ASSOCIATION_TYPE_EXPENSE,
} from "../constants/expenseType.js";

export async function getAssociationAmount(req, res, next) {
  try {
    const associationData = await AssociationAmount.findOne(
      {},
      {
        accountBalance: 1,
        pettyCash: 1,
        depositAmount: 1,
        limitAmount: 1,
        isCreated: 1,
      }
    );

    if (associationData) {
      res.status(200).json({ status: true, data: associationData });
    } else {
      const createData = await AssociationAmount.create({
        accountBalance: 0,
        pettyCash: 0,
        depositAmount: 0,
        includeInBalance: 0,
        limitAmount: 10000,
        isCreated: false,
      });
      res.status(201).json({ status: true, data: createData });
    }
  } catch (error) {
    next(error);
  }
}

export async function updatePettyCashLimit(req, res, next) {
  try {
    const updateId = req.params.id;
    const { amount } = req.body;
    if (!updateId) {
      return res
        .status(400)
        .json({ status: false, message: "Required Id for update" });
    }

    if (typeof amount !== "number" && amount < 1) {
      return res
        .status(400)
        .json({ status: false, message: "Required valid amount for update" });
    }



    const account = await AssociationAmount.findByIdAndUpdate(
      updateId,
      { limitAmount: amount },
      { new: true, runValidators: true }
    );

    if (!account) {
      return res
        .status(404)
        .json({ status: false, message: "Family member not found" });
    }
    res.status(201).json({
      status: true,
      message: "Petty cash limit updated successfully",
    });
  } catch (err) {
    res.status(422).json({
      status: false,
      message:
        err.name === "ValidationError"
          ? Object.values(err.errors).map((val) => val.message)[0]
          : "Server side issue",
    });
    next(err);
  }
}

async function uploadSingleFile(file) {
  if (file && file.fileName && file.fileData) {
    try {
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
    } catch (error) {
      throw new Error("File upload failed: " + error.message);
    }
  } else {
    throw new Error("Missing file name or data");
  }
}

export async function createInitialAmount(req, res, next) {
  try {
    const { accountBalance, pettyCash, depositAmount, includeInBalance } =
      req.body;

    const getPettyCashDetails = await AssociationAmount.findOne({});
    if (getPettyCashDetails.limitAmount < pettyCash) {
      return res.status(400).json({
        status: false,
        message: `Petty cash limit should not exceed ${getPettyCashDetails.limitAmount}`,
      });
    }

    if (
      accountBalance === undefined ||
      pettyCash === undefined ||
      depositAmount === undefined ||
      isNaN(accountBalance) ||
      isNaN(pettyCash) ||
      isNaN(depositAmount)
    ) {
      return res.status(400).json({
        status: false,
        message: "All fields are required and must be valid numbers",
      });
    }

    const isExist = await AssociationAmount.findOne({});
    if (isExist && isExist.isCreated === true) {
      return res
        .status(400)
        .json({ status: false, message: "Your data is exists" });
    }

    const isMaintenanceRecords = await MaintenanceConfiguration.find({
      isPaid: true,
    });

    let dueAmount = 0;

    for (const record of isMaintenanceRecords) {
      dueAmount += record.maintenanceAmount;
    }

    const date = Date.now();
    const createAt = moment(date).format("lll");

    const createData = await AssociationAmount.findOneAndUpdate(
      {},
      {
        accountBalance: includeInBalance
          ? parseInt(accountBalance) +
            parseInt(dueAmount) +
            parseInt(depositAmount)
          : accountBalance,
        pettyCash,
        includeInBalance,
        depositAmount,
        isCreated: true,
        createdAt: createAt,
      }
    );

    res.status(201).json({
      status: true,
      message: "Balance details created successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      const firstValidationErrorField = Object.keys(validationErrors)[0];
      const errorMessage = validationErrors[firstValidationErrorField];

      return res.status(400).json({
        status: false,
        message: errorMessage,
      });
    }
    next(error);
  }
}

export async function updateAmount(req, res) {
  try {
    const { post_includeInBalance, post_corpusAmount, pettyCash } = req.body;
    const associationAmount = await AssociationAmount.findOne({});

    const getPettyCashDetails = await AssociationAmount.findOne({});

    if (getPettyCashDetails.limitAmount < pettyCash) {
      return res.status(400).json({
        status: false,
        message: `Petty cash limit should not exceed ${getPettyCashDetails.limitAmount}`,
      });
    }
    if (!associationAmount) {
      return res
        .status(404)
        .json({ status: false, message: "Association amount not found" });
    }

    let { depositAmount, accountBalance, includeInBalance } = associationAmount;

    let corpusAmount = Number(depositAmount);
    accountBalance = Number(accountBalance);

    if (isNaN(corpusAmount) || isNaN(accountBalance)) {
      return res
        .status(400)
        .json({
          status: false,
          message: "Invalid number in corpusAmount or accountBalance",
        });
    }

    if (post_includeInBalance && includeInBalance) {
      const difference = post_corpusAmount - corpusAmount;
      associationAmount.corpusAmount = post_corpusAmount;
      associationAmount.accountBalance += difference;
    } else if (post_includeInBalance && !includeInBalance) {
      associationAmount.corpusAmount = post_corpusAmount;
      associationAmount.accountBalance += post_corpusAmount;
    } else if (!post_includeInBalance && includeInBalance) {
      associationAmount.accountBalance -= corpusAmount;
      associationAmount.corpusAmount = post_corpusAmount;
    } else if (pettyCash) {
      associationAmount.pettyCash = pettyCash;
    } else {
      associationAmount.corpusAmount = post_corpusAmount;
    }

    associationAmount.includeInBalance = post_includeInBalance;

    associationAmount.depositAmount = post_corpusAmount;
    associationAmount.includeInBalance = post_includeInBalance;
    await associationAmount.save();

    return res.status(200).json({
      status: true,
      message: "Association amount updated successfully",
      data: associationAmount,
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: false, message: "Server error", error: error.message });
  }
}

export async function createDetails(req, res, next) {
  try {
    const { type, name, description, amount, mode, date, bill, visible } =
      req.body;

    const newdate = Date.now();
    const createAt = moment(newdate).format("lll");

    const account = await AssociationAmount.findOne({});    
    if (!account)
      return res
        .status(404)
        .json({
          status: false,
          message: "Association amount details not found",
        });

    if (
      mode !== ASSOCIATION_PAYMENT_ACCOUNT &&
      mode !== ASSOCIATION_PAYMENT_PETTY_CASH &&
      mode !== ASSOCIATION_PAYMENT_CASH
    ) {
      return res
        .status(400)
        .json({ status: false, message: "Required valid payment mode" });
    }

    if (
      mode == ASSOCIATION_PAYMENT_PETTY_CASH ||
      mode == ASSOCIATION_PAYMENT_CASH
    ) {
      if (type == ASSOCIATION_TYPE_EXPENSE) {
        if (Number(account.pettyCash) - Number(amount) <= 0) {
          return res
            .status(400)
            .json({
              status: false,
              message: "You are exceeded your limit amount",
            });
        }
        if (Number(amount) > Number(account.limitAmount)) {
          return res
            .status(400)
            .json({
              status: false,
              message: "You are exceeded your limit amount",
            });
        }
      }
      if (type == ASSOCIATION_TYPE_CREDIT) {
        if (Number(account.pettyCash) + Number(amount) > account.limitAmount) {
          return res
            .status(400)
            .json({
              status: false,
              message: "You are exceeded your limit amount",
            });
        }
        if (Number(amount) > Number(account.limitAmount)) {
          return res
            .status(400)
            .json({
              status: false,
              message: "You are exceeded your limit amount",
            });
        }
      }
    }

    if (
      mode == ASSOCIATION_PAYMENT_ACCOUNT &&
      account[ACCOUNT_BALANCE] < amount
    ) {
      return res
        .status(400)
        .json({
          status: false,
          message: `Insufficient ${
            mode == ASSOCIATION_PAYMENT_ACCOUNT
              ? "account balance"
              : "petty cash"
          }`,
        });
    }

    if (type == ASSOCIATION_TYPE_EXPENSE) {
      if (
        account[
          mode == ASSOCIATION_PAYMENT_ACCOUNT ? ACCOUNT_BALANCE : PETTY_CASH
        ] < amount
      ) {
        return res
          .status(400)
          .json({
            status: false,
            message: `Insufficient ${
              mode == ASSOCIATION_PAYMENT_ACCOUNT
                ? "account balance"
                : "petty cash"
            }`,
          });
      }
    }

    if (amount > account.limitAmount && !bill) {
      return res
        .status(400)
        .json({
          status: false,
          message: `Bill is required if the amount exceeds 10,000`,
        });
    }

    if (type == ASSOCIATION_TYPE_EXPENSE) {
      if (
        account[
          mode == ASSOCIATION_PAYMENT_ACCOUNT ? ACCOUNT_BALANCE : PETTY_CASH
        ] < amount
      ) {
        return res
          .status(400)
          .json({
            status: false,
            message: `Insufficient ${
              mode == ASSOCIATION_PAYMENT_ACCOUNT
                ? "account balance"
                : "petty cash"
            }`,
          });
      }
    }

    const createData = await AssociationDetails.create({
      type,
      name,
      description,
      amount,
      mode,
      date,
      bill,
      visible,
      createdAt: createAt,
    });

    let billData = null;
    if (bill && bill.length > 0) {
      billData = await uploadSingleFile(bill[0]);
      const createDocument = await AssociationDetailDocument.create({
        associationDetailsId: createData._id,
        bill: billData.documentPath,
        billName: billData.documentName,
        billType: billData.documentType,
      });
    }

    if (type == ASSOCIATION_TYPE_EXPENSE) {
      account[
        mode == ASSOCIATION_PAYMENT_ACCOUNT ? ACCOUNT_BALANCE : PETTY_CASH
      ] -= Number(amount);
    }
    if (type == ASSOCIATION_TYPE_CREDIT) {
      account[
        mode == ASSOCIATION_PAYMENT_ACCOUNT ? ACCOUNT_BALANCE : PETTY_CASH
      ] += Number(amount);
    }

    await account.save();
    res.status(201).json({
      status: true,
      message: "Balance details created successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      const firstValidationErrorField = Object.keys(validationErrors)[0];
      const errorMessage = validationErrors[firstValidationErrorField];

      return res.status(400).json({
        status: false,
        message: errorMessage,
      });
    }
    next(error);
  }
}

export async function getAssociationDetails(req, res, next) {
  try {
    const { type, month, year } = req.query;
    if (!type || !month || !year) {
      return res
        .status(400)
        .json({ status: false, message: "Required month, year and type" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const associationData = await AssociationDetails.aggregate([
      {
        $match: {
          type: type,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $lookup: {
          from: "associationdetaildocuments",
          localField: "_id",
          foreignField: "associationDetailsId",
          as: "bills",
        },
      },
      {
        $project: {
          type: 1,
          name: 1,
          description: 1,
          amount: 1,
          mode: 1,
          date: 1,
          visible: 1,
          createdAt: 1,
          updatedAt: 1,
          bill: { $arrayElemAt: ["$bills.bill", 0] },
        },
      },
    ]);

    res.status(200).json({ status: true, data: associationData });
  } catch (error) {
    next(error);
  }
}

export async function getAssociationDetailsForMember(req, res, next) {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res
        .status(400)
        .json({ status: false, message: "Required month and year" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const associationData = await AssociationDetails.aggregate([
      {
        $match: {
          visible: true,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $lookup: {
          from: "associationdetaildocuments",
          localField: "_id",
          foreignField: "associationDetailsId",
          as: "bills",
        },
      },
      {
        $project: {
          type: 1,
          name: 1,
          description: 1,
          amount: 1,
          mode: 1,
          date: 1,
          visible: 1,
          createdAt: 1,
          updatedAt: 1,
          bill: { $arrayElemAt: ["$bills.bill", 0] },
        },
      },
    ]);

    res.status(200).json({ status: true, data: associationData });
  } catch (error) {
    next(error);
  }
}
