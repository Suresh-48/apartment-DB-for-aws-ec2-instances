import User from "../models/userModal.js";
import Flat from "../models/flatModal.js";
import Association from "../models/associationModel.js";
import OwnerDocument from "../models/ownerDocumentModal.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import {
  DEFAULT_EMAIL_ADDRESS,
  EMAIL_CREDENTIALS,
  DEFAULT_ADMIN_USER,
  APP_URL,
} from "../config.js";
import getRandomNumberForOtp from "../utils/otp.js";
import { RENTAL, OWNER, SUPER_ADMIN } from "../constants/roles.js";
import Rental from "../models/rentalModel.js";
import Owner from "../models/ownerProfileModal.js";
import {
  uploadBase64File,
  getPublicImageUrl,
  uploadDocstoAws,
} from "../utils/s3.js";
import bcrypt from "bcryptjs";
import moment from "moment";
import {
  ACCEPTED,
  PENDING,
  REQUEST_APPROVAL,
} from "../constants/documentStatus.js";
import { STAFF } from "../constants/roles.js";
import { STAFF_TYPE_NEW, STAFF_TYPE_EXISTING } from "../constants/staffType.js";
import { sendEMail } from "../constants/mailservices.js";

export async function createStaff(req, res, next) {
  try {
    const { name, phoneNumber, flatId, role, address, age, gender, email, staffType } = req.body;
    if (!name || typeof name !== "string" || name.length < 3 || name.length > 30) {
      return res.status(400).json({
        status: false,
        message: "Name is required and must be between 3 and 30 characters.",
      });
    }

    if (!address || typeof address !== "string" || address.length < 10 || address.length > 250) {
      return res.status(400).json({
        status: false,
        message: "Address is required and must be between 10 and 250 characters.",
      });
    }

    if (isNaN(age)) {
      return res.status(400).json({
        status: false,
        message: "Age is required and must be valid",
      });
    }

    if (!gender) {
      return res.status(400).json({
        status: false,
        message: "Gender is required and must be valid",
      });
    }

    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        status: false,
        message: "Phone number is required and must be a valid 10-digit number.",
      });
    }

    if (!role) {
      return res.status(400).json({
        status: false,
        message: "Role is required.",
      });
    }

    const users = await User.findOne({
      $or: [
        { phoneNumber: phoneNumber },
        { email: email }
      ]
    });
    const association = await Association.findOne({});

    if (staffType == STAFF_TYPE_NEW) {
      if (users) {
        return res.status(400).json({
          status: false,
          message: "User is exist already",
        });
      }

      const newData = {
        name,
        email,
        phoneNumber,
        role,
        isExistedUser: false,
        createdBy: req.userId,
        isActive: true
      };

      const newUser = await User.create(newData);
      if (newUser) {
        const token = jwt.sign(
          {
            id: newUser._id,
            name: newUser.name,
            phoneNumber: newUser.phoneNumber,
          },
          process.env.JWT_SECRET,
          { expiresIn: "30d" }
        );
        await User.findByIdAndUpdate(
          newUser._id,
          {
            sessionToken: token,
          },
          {
            runValidator: true,
            new: true,
          }
        );
        await Owner.create({ currentAddress: address, age, userId: req.userId });

        const emailContent = `  
        <p>Hello ${name},</p>    
        <p>We are delighted to inform you that your sign-up for ${association.name} has been successfully created!</p>
        <p>Welcome to Our Community!</p>
       <p>Click on the Link to login - <p> <a href="${APP_URL}/set-password?token=${token}">${APP_URL}/set-password</a></p>
        <p>Thanks and Regards,</p>
        <p>Admin,<br>
        ${association.name},<br>
        ${association.address}<br>
        <p>Visit: <a>${APP_URL}</a></p>
      `;
        const subject = "Staff Registration"
        var mailResponse = await sendEMail(
          subject,
          email,
          emailContent
        );

        res.status(200).json({
          status: true,
          message: "Staff details created successfully",
        });
      }
    }

    if (staffType == STAFF_TYPE_EXISTING) {
      await User.findByIdAndUpdate(users._id, { isExistedUser: true });
      const emailContent = `  
      <p>Hello ${name},</p>    
      <p>We are delighted to inform you that your sign-up for ${association.name} has been successfully created as ${role}!</p>
      <p>Welcome to Our Community!</p>
    
      <p>Thanks and Regards,</p>
      <p>Admin,<br>
      ${association.name},<br>
      ${association.address}<br>
      <p>Visit: <a>${APP_URL}</a></p>
    `;
      const subject = "Staff Registration"
      var mailResponse = await sendEMail(
        subject,
        email,
        emailContent
      );

      res.status(200).json({
        status: true,
        message: "Staff details created successfully",
      });
    }
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

// Delete a staff by ID
export async function deleteStaff(req, res, next) {
  try {
    const staffId = req.params.id;
    if (!staffId) return res.status(400).json({ message: "Required valid staff Id" });

    const staff = await User.findOneAndDelete({ _id: staffId, role: STAFF });

    if (!staff) return res.status(404).json({ message: "Staff details not found" });

    res.status(200).json({ status: true, message: "Staff details deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getAllStaff(req, res, next) {
  try {

    const staff = await User.find({ role: STAFF }, { name: 1, phoneNumber: 1, flatId: 1, role: 1 }).populate("flatId");;
    res.status(200).json({ status: true, data: staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function signup(req, res, next) {
  try {
    // const signupToken = req.headers["signup_token"];

    // if (!signupToken) {
    //   return res.status(422).json({
    //     status: false,
    //     message: "Signup token is required",
    //   });
    // }
    // if (signupToken !== process.env.SIGNUP_TOKEN) {
    //   return res.status(422).json({
    //     status: false,
    //     message: "Invalid signup tokens",
    //   });
    // }

    const data = req.body;

    const missingFields = [];

    const requiredFields = [
      "name",
      "blockId",
      "flatId",
      "email",
      "phoneNumber",
      "residentType",
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        missingFields.push(field);
      }
    }

    // Check if the name field exceeds 150 characters
    if (data.name && data.name.length > 150) {
      return res.status(422).json({
        status: false,
        message: "Name cannot exceed 150 characters",
      });
    }

    // Check if the phoneNumber field contains only numbers
    if (data.phoneNumber && !/^\d+$/.test(data.phoneNumber)) {
      return res.status(422).json({
        status: false,
        message: "Phone number must contain only numbers",
      });
    }

    const isExist = await User.findOne({ "phoneNumber": data.phoneNumber })

    if (isExist) {
      return res.status(400).json({
        status: false,
        message: `Mobile number is exists`,
      });
    }

    if (missingFields.length > 0) {
      return res.status(422).json({
        status: false,
        message: `${missingFields} is required fields`,
      });
    }

    var filter = { _id: data.flatId, isBooked: true };
    if (data?.residentType == "Rental") {
      filter.rentalBooked = true;
    }

    const existingFlat = await Flat.find(filter);
    if (existingFlat?.length > 0) {
      return res.status(422).json({
        status: false,
        message: `This flat is already booked`,
      });
    }
    // Check if user already exists
    const existingUser = await User.find({ email: data.email });
    if (existingUser.length === 0) {
      const userRole = data.residentType == "Owner" ? OWNER : RENTAL;
      // Create a new user
      const createUserData = await User.create({
        name: data.name,
        blockId: data.blockId,
        flatId: data.flatId,
        phoneNumber: data.phoneNumber,
        residentType: data.residentType,
        email: data.email,
        role: userRole,
        isActive: false,
        isEmailVerified: false,
      });

      //Flat booking
      var newupdateObj = {}
      if (data?.residentType == "Rental") {
        newupdateObj.rentalBooked = true;
      }
      // else {
      //   newupdateObj.isBooked = true;
      // }
      const updateFlatData = await Flat.findByIdAndUpdate(data.flatId, newupdateObj);

      // Generate JWT
      const token = jwt.sign(
        {
          email: createUserData.email,
          id: createUserData._id,
          name: createUserData.name,
          phoneNumber: createUserData.phoneNumber,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      const otp = getRandomNumberForOtp(100000, 999999);
      const expiresIn = 90 * 1000;
      const expiryTime = Date.now() + expiresIn;

      const expiresInDelete = 180 * 1000;
      const expiryTimeDelete = Date.now() + expiresInDelete;
      // update token

      const newUpdateObj = {
        sessionToken: token,
        otp: otp,
        otpExpiryTime: expiryTime,
        autoDeleteTime: expiryTimeDelete
      }
      const updateData = await User.findByIdAndUpdate(
        createUserData._id,
        newUpdateObj,
        {
          runValidator: true,
          new: true,
        }
      );
      res.status(200).json({
        status: true,
        message: "User Register Successfully",
        data: updateData,
      });


      const association = await Association.findOne({});
      if (createUserData) {
        // Send OTP email to customer
        const otpEmailContent = `
          <!DOCTYPE html>
          <html>
          <head>
              <title>Your One-Time Password (OTP) for ${association?.name} Login</title>
          </head>
          <body>
              <p>Dear ${updateData.name},</p>
              <p>Welcome to ${association?.name}</p>
              <p>To complete your login process, please use the following One-Time Password (OTP). This OTP is valid for the next 120 seconds.</p>
              <p><strong>Your OTP is: ${otp}</strong></p>
              <p>Please enter this OTP on the login page to access your account. If you did not request this OTP, please disregard this email.</p>
              <p>For security reasons, please do not share this OTP with anyone. If you need any assistance or have any questions, feel free to contact our support team at support@apartmentassociation.com.</p>
              <p>Thank you for being a part of our community!</p>
              <p>Best regards,</p>
              <p>${association?.name}</p>
              <p><strong>${APP_URL}</strong></p>
          </body>
          </html>
        `;
        var mailSubject =
          `Your One-Time Password (OTP) for ${association?.name} Login`;
        if (mailSubject && otpEmailContent)
          var mailResponse = await sendEMail(
            mailSubject,
            updateData.email,
            otpEmailContent
          );

        await Flat.findByIdAndUpdate(data.flatId, { isBooked: true });
      }
    } else {
      return res.status(400).json({ message: "User already exists" });
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

export async function validateOtp(req, res, next) {
  try {
    const data = req.body;

    // Check for userId and otp in the request body
    if (!data.userId || !data.otp) {
      return res.status(404).json({
        status: false,
        message: "userId and otp are required",
      });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(data.userId)) {
      return res.status(404).json({
        status: false,
        message: "Invalid userId format",
      });
    }

    // Find user by userId
    const findData = await User.findById(data.userId);
    // Check if user exists
    if (!findData) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Debugging: Log current time and OTP expiry time
    const currentTime = Date.now();

    // Check if OTP has expired
    if (currentTime > findData.otpExpiryTime) {
      return res.status(400).json({
        status: false,
        message: "OTP has expired",
      });
    } else {
      // Check if provided OTP matches stored OTP
      if (findData.otp == data.otp) {
        // Update user's email verification status
        const updateStatus = await User.findByIdAndUpdate(
          data.userId,
          { isEmailVerified: true },
          { runValidators: true, new: true }
        )
          .populate("blockId")
          .populate("flatId");

        const association = await Association.findOne({});
        // Create email content for admin and customer
        const adminEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Approval for ${updateStatus.name} - ${updateStatus.residentType} - ${updateStatus.phoneNumber}</title>
        </head>
        <body>
            <p>We are delighted to inform you that ${updateStatus.name} for ${association?.name} has signed up!</p>
            <p>Name : ${updateStatus?.name}</p>
            <p>Mobile : ${updateStatus?.phoneNumber}</p>
            <p>Email : ${updateStatus?.email}</p>
            <p>Block Number : ${updateStatus?.blockId?.blockName}</p>
            <p>Flat Number : ${updateStatus?.flatId?.flatName}</p>
            <p>Resident Type : ${updateStatus?.residentType}</p>
            <p>Kindly Approve / Reject by clicking on the portal -<strong>${APP_URL}/admin/request-list/</strong></p>
         
            <p>Regards,
            <br>${association?.name}
            <br>${association?.address}</p>
        </body>
        </html>
        `;

        const customerEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sign Up for ${association?.name} - ${updateStatus.name} - ${updateStatus.residentType}  - ${updateStatus.phoneNumber}</title>
        </head>
        <body>
            <p>We are delighted to inform you that you have signed up for ${association?.name}</p>
            <p>Name : ${updateStatus.name}</p>
            <p>Mobile : ${updateStatus.phoneNumber}</p>
            <p>Email : ${updateStatus.email}</p>
            <p>Block Number : ${updateStatus?.blockId?.blockName}</p>
            <p>Flat Number : ${updateStatus?.flatId?.flatName}</p>
            <p>Resident Type : ${updateStatus.residentType}</p>
            <p>Admin will approve within 48 hours. Kindly check your status of Approval by clicking the link  <strong>${APP_URL}/pending-approval/</strong>.</p>
            <p>Regards,
            <br>${association?.name}
            <br>${association?.address}</p>
        </body>
        </html>
        `;
        var mailSubject = `Approval for ${updateStatus.name} - ${updateStatus.residentType} - ${updateStatus.phoneNumber}`;
        var mailResponse1 = await sendEMail(
          mailSubject,
          DEFAULT_ADMIN_USER,
          adminEmailContent
        );
        var mailResponse2 = await sendEMail(
          `Sign Up for ${association?.name} - ${updateStatus.name} - ${updateStatus.residentType} - ${updateStatus.phoneNumber}`,
          updateStatus.email,
          customerEmailContent
        );

        await Flat.findByIdAndUpdate(findData.flatId, { isBooked: true });

        // Return success response
        return res.status(200).json({
          status: true,
          message: "User email verified successfully",
          data: updateStatus,
        });
      } else {
        // Return error response if OTP is invalid
        return res.status(422).json({
          status: false,
          message: "Invalid OTP....",
        });
      }
    }
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const data = req.body;

    const missingFields = [];

    const requiredFields = ["oldPassword", "password", "confirmPassword"];

    for (const field of requiredFields) {
      if (!data[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: false,
        message: `${missingFields.join(", ")} is required`,
      });
    }

    if (data.password !== data.confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "Password and confirm password do not match",
      });
    }

    const userId = req.userId;

    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const isOldPasswordValid = await bcrypt.compare(data.oldPassword, userData.password);

    if (!isOldPasswordValid) {
      return res.status(400).json({
        status: false,
        message: "Old password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const updateData = await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });

    return res.status(200).json({
      status: true,
      message: "Password updated successfully",
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

export async function getProfile(req, res, next) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "Required user id",
      });
    }
    const userData = await User.findById(userId)
      .populate("blockId")
      .populate("ownerId")
      .populate("flatId");
    return res.status(201).json({
      status: true,
      data: userData
    });
  }
  catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

export async function signoutUser(req, res, next) {
  try {
    const userId = req.userId;
    const token = req.headers.authorization?.split(" ")[1];
    const config = process.env;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required.",
      });
    }
    const logoutAt = moment(new Date()).utcOffset("+05:30").format("lll");

    const user = await User.findOneAndUpdate(
      { sessionToken: token },
      { sessionToken: "", logoutAt: logoutAt }
    );

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Token not found or already logged out.",
      });
    }

    const decoded = await jwt.verify(token, config.JWT_SECRET);
    if (decoded && decoded.exp) {
      const expirationTime = moment.unix(decoded.exp);
      const now = moment();

      if (expirationTime.isAfter(now)) {
        return res.status(200).json({
          status: true,
          message: "Logout successfully",
        });
      }
    }

    return res.status(200).json({
      status: true,
      message: "Logout successful.",
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal server error.",
    });
  }
}


export async function createUserCredential(req, res, next) {
  try {
    const data = req.body;

    const missingFields = [];

    const requiredFields = ["token", "password", "confirmPassword"];

    for (const field of requiredFields) {
      if (!data[field]) {
        missingFields.push(field);
      }
    }
    if (missingFields.length > 0) {
      return res.status(422).json({
        status: false,
        message: `${missingFields} is required fields`,
      });
    }

    // Check if password and confirmPassword match
    if (data.password !== data.confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "Password and confirm password do not match",
      });
    }

    // Find the user by ID
    const user = await User.findOne({ sessionToken: data.token });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    } else {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const updateData = await User.findByIdAndUpdate(
        user.id,
        { password: hashedPassword, isEmailVerified: true },
        { runValidators: true, new: true }
      );
      // Return success response
      return res.status(200).json({
        status: true,
        message: "Password updated successfully",
        data: updateData,
      });
    }
  } catch (err) {
    // Handle errors
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}
// export async function userLogin(req, res, next) {
//   try {
//     const data = req.body;
//     const missingFields = [];

//     const requiredFields = ["phoneNumber", "password"];
//     for (const field of requiredFields) {
//       if (!data[field]) {
//         missingFields.push(field);
//       }
//     }
//     if (missingFields.length > 0) {
//       return res.status(422).json({
//         status: false,
//         message: `${missingFields} is required fields`,
//       });
//     }
//     const phoneNumberStr = data.phoneNumber.toString().trim();
//     const userData = await User.findOne({ phoneNumber: phoneNumberStr })
//       .populate({
//         path: 'ownerId', // Populate the owner details
//         select: 'photo', // Only select the 'photo' field from the owner document
//       });

//     if (!userData) {
//       return res.status(400).json({
//         status: 400,
//         message: "Invalid credentials or Invalid Mobile number",
//       });
//     }

//     if (userData?.role == SUPER_ADMIN) {
//       res.status(400).json({
//         status: 400,
//         message: "You dont have permission to login",
//       });
//     }

//     if (userData.isEmailVerified !== true) {
//       return res.status(400).json({
//         status: 400,
//         message:
//           "User registered but email not verified. Please verify your email.",
//       });
//     }

//     if (userData.isActive !== true) {
//       return res.status(403).json({
//         status: 403,
//         message: "Account inactive. Please wait for admin approval.",
//       });
//     }

//     const passwordMatch = await bcrypt.compare(
//       data.password,
//       userData.password
//     );
//     if (!passwordMatch) {
//       return res.status(404).json({
//         status: 404,
//         message: "Invalid credentials!",
//       });
//     }

//     const token = jwt.sign(
//       {
//         id: userData._id,
//         name: userData.name,
//         phoneNumber: userData.phoneNumber,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
//     // update token
//     await User.findByIdAndUpdate(
//       userData._id,
//       {
//         sessionToken: token,
//       },
//       {
//         runValidator: true,
//         new: true,
//       }
//     );

//     userData.sessionToken = token;

//     res.status(200).json({
//       status: "Created",
//       message: "Login successfully",
//       userData,
//     });
//   } catch (err) {
//     next(err);
//   }
// }

export async function getUserDetails(req, res, next) {
  try {
    const userId = req.params.id;

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required",
      });
    }

    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid User ID",
      });
    }

    // Fetch user data
    const userData = await User.findById(userId)
      .populate("blockId")
      .populate("flatId")
      .populate("ownerId")
      .populate("rentalId")
      .populate("flatOwner");

    // Fetch documents related to the user
    const documentData = await OwnerDocument.find({ userId: userId });

    // Check if user data exists
    if (!userData) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Create a response object
    const response = {
      userData: userData,
    };

    // Add each document as a separate key-value pair
    documentData.forEach((doc, index) => {
      response[`document${index + 1}`] = {
        documentName: doc.documentName,
        documentType: doc.documentType,
        status: doc.status,
        comments: doc.comments,
        documentPath: doc.documentPath,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    });

    return res.status(200).json({
      status: true,
      message: "Get user details successfully",
      data: response,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateOwnerProfile(req, res, next) {
  try {
    const data = req.body;

    const existData = await Owner.findOne({ userId: data.userId });

    if (!existData) {
      if (data.handleValidation) {
        const missingFields = [];
        const requiredFields = [
          "userId",
          "emergencyContactName",
          "emergencyMobile",
          "dob",
          "gender",
          "aadhar",
          "addressProof",
          "photo",
          "memberId",
          "apartmentType",
          "maintenancePaidBy",
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

      const updateData = await Owner.create({
        userId: data.userId,
        whatsappNumber: data.whatsapp,
        sameAsPhone: data.sameasmobile,
        emergencyContactName: data.emergencyContactName,
        emergencyMobileNumber: data.emergencyMobile,
        dob: data.dob,
        bloodGroup: data.bloodGroup,
        gender: data.gender,
        aadharNumber: data.aadhar,
        memberId: data.memberId,
        workType: data.workType,
        workAddress: data.workAddress,
        isDoctor: data.doctor,
        specialization: data.specialization,
        residentialAddress: data.residentialAddress,
        currentAddress: data.currentAddress,
        apartmentType: data.apartmentType,
        handOverDate: data.handoverDate,
        occupationDate: data.occupationDate,
        maintenancePaidBy: data.maintenancePaidBy,
        typeOfGasConnection: data.gasConnection,
      });

      await User.findByIdAndUpdate(
        data.userId,
        { ownerId: updateData.id },
        { runValidators: true, new: true }
      );

      var flatDatas = await Flat.findByIdAndUpdate(data.flatId, {
        apartmentType: data.apartmentType,
        isBooked: true,
      });

      // Send response first
      res.status(201).json({
        status: "Created",
        message: "Profile created successfully",
      });

      // Proceed with file uploads asynchronously
      const addressProofFile = data.addressProof;
      const addressProofType =
        addressProofFile && addressProofFile.split(";")[0].split("/")[1];
      const addressProofFileName = `${data.userId
        }-${new Date().getTime()}-addressProof.${addressProofType}`;
      const addressProofFilePath = `${addressProofFileName}`;

      const uploadFile = (file, filePath, fieldName) => {
        return new Promise((resolve, reject) => {
          uploadBase64File(file, filePath, async (err, mediaPath) => {
            if (err) {
              return reject(err);
            }
            await Owner.updateOne(
              { _id: updateData.id ? updateData.id : updateData._id },
              { [fieldName]: getPublicImageUrl(mediaPath) }
            );
            resolve();
          });
        });
      };

      // Handle uploads asynchronously
      if (addressProofFile) {
        await uploadFile(
          addressProofFile,
          addressProofFilePath,
          "addressProof"
        );
      }

      const photoFile = data.photo;
      const photoType = photoFile && photoFile.split(";")[0].split("/")[1];
      const photoFileName = `${data.userId
        }-${new Date().getTime()}-photo.${photoType}`;
      const photoFilePath = `${photoFileName}`;

      if (photoFile) {
        await uploadFile(photoFile, photoFilePath, "photo");
      }

      // Handle owner profile document uploads
      const files = req.body.files || [];

      const event_PATH = "media/owner/profile";
      const date = Date.now();
      const createAt = moment(date).utcOffset("+05:30").format("lll");

      for (const file of files) {
        try {
          const imageType = file.imageType;
          const type = file.image && imageType.split("/")[1];
          const currentDate = new Date().getTime();
          const fileName = `${updateData._id}-${currentDate}.${type}`;

          const filePath = `${fileName}`;
          // Create or update document detail
          let documentDetail = await OwnerDocument.findOne({
            userId: data.userId,
            documentName: file.documentName,
          });
          if (file.image) {
            if (documentDetail) {
              // Update existing document
              await OwnerDocument.updateOne(
                { _id: documentDetail._id },
                {
                  documentType: file.documentType,
                  comments: file.comments || "",
                  createdAt: createAt,
                  status:
                    documentDetail.status !== ACCEPTED ? PENDING : ACCEPTED,
                }
              );
            } else {
              // Create new document
              documentDetail = await OwnerDocument.create({
                userId: data.userId,
                documentName: file.documentName,
                documentType: file.documentType,
                comments: file.comments || "",
                createdAt: createAt,
                status: data.documentStatus,
              });
            }

            // Upload the file and update the document path
            await new Promise((resolve, reject) => {
              uploadDocstoAws(file.image, filePath, async (err, mediaPath) => {
                if (err) {
                  console.error("Error uploading file:", err);
                  return reject(err);
                }
                try {
                  await OwnerDocument.updateOne(
                    { _id: documentDetail._id },
                    { documentPath: getPublicImageUrl(mediaPath) }
                  );
                  resolve();
                } catch (updateError) {
                  console.error("Error updating document path:", updateError);
                  reject(updateError);
                }
              });
            });
          }
        } catch (err) {
          console.error("Error processing file:", err);
        }
      }
    } else {
      if (data.handleValidation) {
        const missingFields = [];
        const requiredFields = [
          "userId",
          "emergencyContactName",
          "emergencyMobile",
          "dob",
          "gender",
          "aadhar",
          "addressProof",
          "photo",
          "memberId",
          "apartmentType",
          "maintenancePaidBy",
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
      // Update the owner's basic profile details
      const editData = {
        userId: data.userId,
        whatsappNumber: data.whatsapp,
        sameAsPhone: data.sameasmobile,
        emergencyContactName: data.emergencyContactName,
        emergencyMobileNumber: data.emergencyMobile,
        dob: data.dob,
        bloodGroup: data.bloodGroup,
        gender: data.gender,
        aadharNumber: data.aadhar,
        memberId: data.memberId,
        workType: data.workType,
        workAddress: data.workAddress,
        isDoctor: data.doctor,
        specialization: data.specialization,
        residentialAddress: data.residentialAddress,
        currentAddress: data.currentAddress,
        apartmentType: data.apartmentType,
        handOverDate: data.handoverDate,
        occupationDate: data.occupationDate,
        maintenancePaidBy: data.maintenancePaidBy,
        typeOfGasConnection: data.gasConnection,
      };

      const updateData = await Owner.findByIdAndUpdate(existData.id, editData, {
        runValidators: true,
        new: true,
      });

      // Doubts here
      var flatDatas = await Flat.findByIdAndUpdate(data.flatId, {
        apartmentType: data.apartmentType,
        isBooked: true,
      });

      res.status(201).json({
        status: "Updated",
        message: "Profile updated successfully",
      });

      // Proceed with file uploads asynchronously
      const uploadFile = (file, filePath, fieldName) => {
        return new Promise((resolve, reject) => {
          uploadBase64File(file, filePath, async (err, mediaPath) => {
            if (err) {
              return reject(err);
            }
            await Owner.updateOne(
              { _id: updateData.id ? updateData.id : updateData._id },
              { [fieldName]: getPublicImageUrl(mediaPath) }
            );
            resolve();
          });
        });
      };

      const addressProofFile = data.addressProof;
      const addressProofType =
        addressProofFile && addressProofFile.split(";")[0].split("/")[1];
      const addressProofFileName = `${data.userId
        }-${new Date().getTime()}-addressProof.${addressProofType}`;
      const addressProofFilePath = `${addressProofFileName}`;

      if (addressProofFile) {
        await uploadFile(
          addressProofFile,
          addressProofFilePath,
          "addressProof"
        );
      }

      const photoFile = data.photo;
      const photoType = photoFile && photoFile.split(";")[0].split("/")[1];
      const photoFileName = `${data.userId
        }-${new Date().getTime()}-photo.${photoType}`;
      const photoFilePath = `${photoFileName}`;

      if (photoFile) {
        await uploadFile(photoFile, photoFilePath, "photo");
      }

      // Handle owner profile document uploads
      const files = req.body.files || [];
      const event_PATH = "media/owner/profile";
      const date = Date.now();
      const updatedAt = moment(date).utcOffset("+05:30").format("lll");

      for (const file of files) {
        try {
          const imageType = file.imageType;
          const type = file.image && imageType.split("/")[1];
          const currentDate = new Date().getTime();
          const fileName = `${updateData._id}-${currentDate}.${type}`;
          const filePath = `${fileName}`;

          // Try to find an existing document
          let documentDetail = await OwnerDocument.findOne({
            userId: data.userId,
            documentType: file.documentType,
          });

          if (file.image) {
            if (documentDetail) {
              // Update existing document

              await OwnerDocument.updateOne(
                { _id: documentDetail._id },
                {
                  documentType: file.documentType,
                  comments: file.comments || "",
                  updatedAt: updatedAt,

                  status:
                    data.documentStatus == REQUEST_APPROVAL
                      ? REQUEST_APPROVAL
                      : documentDetail.status == REQUEST_APPROVAL
                        ? REQUEST_APPROVAL
                        : documentDetail.status == ACCEPTED
                          ? ACCEPTED
                          : PENDING,
                }
              );
            } else {
              // Create new document
              documentDetail = await OwnerDocument.create({
                userId: data.userId,
                documentName: file.documentName,
                documentType: file.documentType,
                comments: file.comments || "",
                createdAt: updatedAt,
                status: data.documentStatus,
              });
            }

            // Upload the file and update the document path
            await new Promise((resolve, reject) => {
              uploadDocstoAws(file.image, filePath, async (err, mediaPath) => {
                if (err) {
                  console.error("Error uploading file:", err);
                  return reject(err);
                }
                try {
                  await OwnerDocument.updateOne(
                    { _id: documentDetail._id },
                    { documentPath: getPublicImageUrl(mediaPath) }
                  );
                  resolve();
                } catch (updateError) {
                  console.error("Error updating document path:", updateError);
                  reject(updateError);
                }
              });
            });
          }
        } catch (err) {
          console.error("Error processing file:", err);
        }
      }
    }
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const data = req.body;
    const id = req.params.id;

    const users = await User.findById(id);

    if (!users) {
      return res.status(404).json({
        status: false,
        message: "User details not found",
      });
    }

    const updateUserData = await User.findByIdAndUpdate(
      id,
      { isActive: data.status, isAdminVerified: true },
      { new: true, runValidators: true }
    );

    if (!updateUserData) {
      return res.status(404).json({ message: "User not found" });
    }

    // update flat collection isBooked to false if declined by admin
    if (data.status === false) {
      const updateFlatData = await Flat.findByIdAndUpdate(
        updateUserData.flatId,
        { isBooked: true }
      );
    }
    if (data.status === true && updateUserData.role === RENTAL) {
      const relatedUser = await User.findOne({ flatId: updateUserData.flatId });

      if (relatedUser) {
        // Create an instance of Rental
        await User.findByIdAndUpdate(
          id,
          { flatOwner: relatedUser._id },
          { new: true, runValidators: true }
        );
      }
    }

    const association = await Association.findOne({});

    // Define email content based on status
    const approvedContent = `      
      <p>We are delighted to inform you that your sign-up for ${association.name} has been successfully approved!</p>
      <p>Welcome to Our Community!</p>
     <p>Click on the Link to login - <p> <a href="${APP_URL}/set-password?token=${updateUserData?.sessionToken}">${APP_URL}/set-password</a></p>
      <p>Thanks and Regards,</p>
      <p>Admin,<br>
      ${association.name},<br>
      ${association.address}<br>
      <p>Visit: <a>${APP_URL}</a></p>
    `;

    const rejectedContent = `
      <p>We are sorry to inform you that your sign-up for ${association?.name} has been Rejected due to "Waiting for reasons".</p>
      <p>Thanks and Regards,</p>
      <p>Admin,<br>
      ${association.name},<br>
      ${association.address}<br>
      <p>Visit: <a href="${APP_URL}">${APP_URL}</a></p>
    `;
    const approveSubject = `${updateUserData.name} - ${updateUserData.phoneNumber} - Welcome to ${association?.name}`;
    const rejectSubject = `${updateUserData.name} - ${updateUserData.phoneNumber} - Rejected for ${association?.name}`;
    var subject = data.status ? approveSubject : rejectSubject;
    var mailResponse = await sendEMail(
      subject,
      updateUserData.email,
      data.status ? approvedContent : rejectedContent
    );

    if (data.status === false) {
      await Flat.findByIdAndUpdate(users.flatId, { isBooked: false });
    }


    res.status(200).json({
      message: "User status updated successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { emailOrMobile } = req.body;

    if (!emailOrMobile) {
      return res.status(400).json({ status: false, message: "Required email or mobile number" });
    }

    const user = await User.findOne({
      $or: [
        { phoneNumber: emailOrMobile },
        { email: emailOrMobile }
      ]
    });

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    // update token
    await User.findByIdAndUpdate(
      user._id,
      {
        sessionToken: token,
      },
      {
        runValidator: true,
        new: true,
      }
    );


    const association = await Association.findOne({});

    const resetContent = `      
    <p>Hello, ${user.name}</p>
    <p>We received a request to reset your password for your account at <strong>${association.name}</strong>.</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
    <p>Otherwise, click the link below to set a new password:</p>
    <p><a href="${APP_URL}/set-password?token=${token}">${APP_URL}/set-password</a></p>
    <p>This link will expire in 24 hours for security purposes.</p>
    <p>Thanks and Regards,</p>
    <p>Admin,<br>
    ${association.name},<br>
    ${association.address}<br></p>
    <p>Visit: <a href="${APP_URL}">${APP_URL}</a></p>
  `;


    const subject = `Forgot password`;
    var mailResponse = await sendEMail(subject, user.email, resetContent);
    res.status(200).json({
      status: true,
      message: "Link sent to your mail",
    });
  } catch (err) {
    next(err);
  }
}

export async function getPendingUsers(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    const pendingUserData = await User.find({
      isActive: false,
      isEmailVerified: true,
      isAdminVerified: false,
      role: { $ne: SUPER_ADMIN },
    })
      .populate("blockId")
      .populate("flatId")
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments({
      isActive: false,
      isEmailVerified: true,
      isAdminVerified: false,
      role: { $ne: SUPER_ADMIN },
    });

    res.status(200).json({
      message: "Get pending users list",
      data: pendingUserData,
      total: total,
    });
  } catch (err) {
    next(err);
  }
}

export async function userAdminLogin(req, res, next) {
  try {
    const data = req.body;
    const missingFields = [];

    const requiredFields = ["phoneNumber", "password"];

    for (const field of requiredFields) {
      if (!data[field]) {
        missingFields.push(field);
      }
    }
    if (missingFields.length > 0) {
      return res.status(422).json({
        status: false,
        message: `${missingFields} is required fields`,
      });
    }

    const userData = await User.findOne({ phoneNumber: data.phoneNumber });

    if (!userData) {
      return res.status(400).json({
        status: 400,
        message: "Invalid Registered Mobile number or Invalid Credentials",
      });
    }

    if (userData?.role != SUPER_ADMIN) {
      return res.status(400).json({
        status: 400,
        message: "You dont have permission to login",
      });
    }


    if (userData) {
      const userData = await User.findOne({
        phoneNumber: data.phoneNumber,
      });
      const isPasswordMatch = await bcrypt.compare(
        data.password,
        userData.password
      );
      if (isPasswordMatch) {
        const token = jwt.sign(
          {
            id: userData._id,
            name: userData.name,
            phoneNumber: userData.phoneNumber,
          },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        // update token
        await User.findByIdAndUpdate(
          userData._id,
          {
            sessionToken: token,
          },
          {
            runValidator: true,
            new: true,
          }
        );

        userData.sessionToken = token;

        res.status(200).json({
          status: "Created",
          message: "Login successfully",
          data: userData,
        });
      } else {
        res.status(400).json({
          status: 400,
          message: "Invalid credential",
        });
      }
    }
  } catch (err) {
    next(err);
  }
}

export async function userLogin(req, res, next) {
  try {
    const data = req.body;
    const missingFields = [];

    const requiredFields = ["phoneNumber", "password"];
    for (const field of requiredFields) {
      if (!data[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(422).json({
        status: false,
        message: `${missingFields} is required fields`,
      });
    }

    const phoneNumberStr = data.phoneNumber.toString().trim();
    let userData = await User.findOne({ phoneNumber: phoneNumberStr })
      .populate({
        path: 'ownerId',
        select: 'photo',
      });

    if (userData) {
      userData = userData.toObject();
    }

    if (!userData) {
      return res.status(400).json({
        status: 400,
        message: "Invalid credentials or Invalid Mobile number",
      });
    }

    // // Check if user is a super admin and restrict login if it's a regular user login
    // if (userData.role === SUPER_ADMIN && data.loginType !== 'admin') {
    //   return res.status(400).json({
    //     status: 400,
    //     message: "You don’t have permission to login",
    //   });
    // }

    // Common checks for all users
    if (userData.isEmailVerified !== true) {
      return res.status(400).json({
        status: 400,
        message: "User registered but email not verified. Please verify your email.",
      });
    }

    if (userData.isActive !== true) {
      return res.status(403).json({
        status: 403,
        message: "Account inactive. Please wait for admin approval.",
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(data.password, userData.password);
    if (!passwordMatch) {
      return res.status(404).json({
        status: 404,
        message: "Invalid credentials!",
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: userData._id,
        name: userData.name,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        as: userData.residentType === OWNER ? "user" : "Admin"
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Update session token in the database
    await User.findByIdAndUpdate(
      userData._id,
      { sessionToken: token, loginAs: userData.role === OWNER ? "user" : "Admin" },
      { runValidators: true, new: true }
    );

    userData.sessionToken = token;
    userData.loginAs = userData.role === OWNER ? "user" : "Admin";

    res.status(200).json({
      status: "Success",
      message: "Login successful",
      userData,
    });
  } catch (err) {
    next(err);
  }
}


export async function resendOtp(req, res, next) {
  try {
    const { userId } = req.body;
    // Validate required fields
    if (!userId) {
      return res.status(422).json({
        status: false,
        message: "userId is a required field",
      });
    }

    // Check if user already exists
    const userData = await User.findById(userId).exec();

    if (!userData) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate OTP and expiry time
    const otp = getRandomNumberForOtp(100000, 999999);
    const expiresIn = 90 * 1000;
    const expiryTime = Date.now() + expiresIn;

    const expiresInDelete = 180 * 1000;
    const expiryTimeDelete = Date.now() + expiresInDelete;
    // update token

    const newUpdateObj = {
      otp: otp,
      otpExpiryTime: expiryTime,
      autoDeleteTime: expiryTimeDelete
    }
    const updateData = await User.findByIdAndUpdate(
      userId,
      newUpdateObj,
      {
        runValidator: true,
        new: true,
      }
    );

    // Check if email exists and is valid
    if (!userData.email) {
      return res.status(400).json({ message: "User email not found" });
    }

    const association = await Association.findOne({})

    // Send OTP email to customer
    const otpEmailContent = `
      <!DOCTYPE html>
          <html>
          <head>
              <title>Your One-Time Password (OTP) for ${association?.name} Login</title>
          </head>
          <body>
              <p>Dear ${updateData.name},</p>
              <p>Welcome to ${association?.name}</p>
              <p>To complete your login process, please use the following One-Time Password (OTP). This OTP is valid for the next 120 seconds.</p>
              <p><strong>Your OTP is: ${otp}</strong></p>
              <p>Please enter this OTP on the login page to access your account. If you did not request this OTP, please disregard this email.</p>
              <p>For security reasons, please do not share this OTP with anyone. If you need any assistance or have any questions, feel free to contact our support team at support@apartmentassociation.com.</p>
              <p>Thank you for being a part of our community!</p>
              <p>Best regards,</p>
              <p>${association?.name}</p>
              <p><strong>${APP_URL}</strong></p>
          </body>
          </html>
    `;

    var subject =
      `Your One-Time Password (OTP) for ${association?.name} Login`;
    sendEMail(subject, userData.email, otpEmailContent)
      .then(() => {
        res.status(200).json({
          status: true,
          message: "Resent OTP successfully",
          data: updateData,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: false,
          message: "Failed to send email",
          error: error.message,
        });
      });
  } catch (error) {
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(422).json({
        status: false,
        message: validationErrors.join(", "),
      });
    }
    next(error);
  }
}
export async function getUserData(req, res, next) {
  try {
    const token = req.params.id;

    const userData = await User.findOne({ sessionToken: token })
      .populate("blockId")
      .populate("flatId")
      .populate("ownerId");

    return res.status(200).json({
      status: true,
      message: " Get user details successfully",
      data: userData,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSingleUserDetails(req, res, next) {
  try {
    const id = req.params.id;
    const userData = await User.findById(id)
      .populate("blockId")
      .populate("flatId")
      .populate("ownerId");
    return res.status(200).json({
      status: true,
      message: "Get user details successfully",
      data: userData,
    });
  } catch (err) {
    next(err);
  }
}
export async function deactivateUser(req, res, next) {
  try {
    const id = req.params.id;
    const data = req.body;
    const updateUserData = await User.findByIdAndUpdate(
      id,
      { isActive: data.status },
      { new: true, runValidators: true }
    );

    if (!updateUserData) {
      return res.status(404).json({ message: "User not found" });
    }

    const association = await Association.findOne({});

    // Email content
    const deactivateEmailContent = `
  <!DOCTYPE html>
  <html>
  <head>
      <title>Account Deactivation Notification</title>
  </head>
  <body>
      <p>Dear ${updateUserData.name},</p>
      <p>We hope this message finds you well.</p>
      <p>Please be informed that your account on the ${association?.name} Portal has been deactivated.</p>
      <p>If you believe this is an error or need further assistance, kindly reach out to us at [Contact Information].</p>
      <p>We appreciate your involvement and thank you for being a part of our community.</p>
      <p>Best regards,</p>
      <p>[Your Name]</p>
      <p>${association?.name}</p>
  </body>
  </html>
`;

    const mailSubject = `${updateUserData.name} - has been removed from [Aparment Name]`;
    const recipientEmail = updateUserData.email;

    // Sending the email
    const mailResponse = await sendEMail(
      mailSubject,
      recipientEmail,
      deactivateEmailContent
    );

    if (mailResponse) {
      res.status(200).json({
        status: true,
        message: "User deactivated and email sent successfully",
      });
    } else {
      res.status(500).json({
        status: false,
        message: "User deactivated but failed to send email",
      });
    }
  } catch (error) {
    next(error);
  }
}
export async function getAllMembersList(req, res, next) {
  try {
    const membersData = await User.aggregate([
      {
        $match: {
          role: { $in: ["Owner", "Rental"] },
          $or: [{ ownerId: { $ne: null } }, { rentalId: { $ne: null } }],
          isActive: true,
        },
      },
      {
        $group: {
          _id: { blockId: "$blockId", flatId: "$flatId" },
          document: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$document" },
      },
    ]);

    await User.populate(membersData, [{ path: "blockId" }, { path: "flatId" }]);
    res.status(200).json({
      status: true,
      message: "Get all members details",
      data: membersData,
    });
  } catch (err) {
    next(err);
  }
}
