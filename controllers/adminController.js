import User from "../models/userModal.js";
import nodemailer from "nodemailer";
import { DEFAULT_EMAIL_ADDRESS, EMAIL_CREDENTIALS } from "../config.js";
import Association from "../models/associationModel.js";

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_CREDENTIALS.user,
    pass: EMAIL_CREDENTIALS.pass,
  },
});

export async function getCustomerList(req, res, next) {
  try {
    const customerData = await User.find({ role: { $ne: SUPER_ADMIN } });

    return res.status(200).json({
      status: true,
      message: "Get customer data successfully",
      data: customerData,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomerStatus(req, res, next) {
  try {
    const data = req.body;
    const id = req.params.id;

    const updateData = await User.findByIdAndUpdate(
      id,
      {
        isActive: data.status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    let status = data.status ? "Approved" : "Rejected";

    const association = await Association.findOne({});

    if (status == "Approved") {
      // Send approval email notification
      const htmlcontent = `
        <p>Hi ${updateData.name},</p>
        
        <p>Welcome to ${association?.name}!</p>
      
        <p>We are pleased to inform you that your account has been <strong>approved</strong>. You can now log in and access all the features available to our residents.</p>
      
        <p>Thanks and Regards,</p>
        
        <p>
          Admin,<br>
          ${association?.name},<br>
          ${association?.address}<br>
        </p>
      
        <p>Visit: <a href="http://www.apartment.com">www.apartment.com</a></p>
      `;

      var mailOptions = {
        from: DEFAULT_EMAIL_ADDRESS,
        //   to: updateData.email,
        to: "smtp@gmail.com",
        subject: "Apartment Status",
        html: htmlcontent,
      };
      transporter.sendMail(mailOptions, async function (error, info) {
        if (error) {
          console.log("Email Error******" + error);
        }
      });
    } else {
      // Send rejection email notification
      const htmlcontent1 = `
          <p>Hi ${updateData.name},</p>
          
          <p>Welcome to ${association?.name}.</p>
        
          <p>We regret to inform you that your account application has been <strong>rejected</strong>. If you have any questions, please contact our support team for further assistance.</p>
        
          <p>Thanks and Regards,</p>
          
          <p>
            Admin,<br>
            ${association?.name},<br>
            ${association?.address}<br>
            600024
          </p>
        
          <p>Visit: <a href="http://www.apartment.com">www.apartment.com</a></p>
        `;

      var mailOptions = {
        from: DEFAULT_EMAIL_ADDRESS,
        //   to: updateData.email,
        to: "smtp@gmail.com",
        subject: "Apartment Status",
        html: htmlcontent1,
      };
      transporter.sendMail(mailOptions, async function (error, info) {
        if (error) {
          console.log("Email Error******" + error);
        }
      });
    }

    return res.status(200).json({
      status: true,
      message: "Update user status successfully",
      data: updateData,
    });
  } catch (err) {
    next(err);
  }
}
