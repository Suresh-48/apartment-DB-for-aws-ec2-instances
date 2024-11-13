import nodemailer from "nodemailer";
import { DEFAULT_EMAIL_ADDRESS, EMAIL_CREDENTIALS } from "../config.js";

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: EMAIL_CREDENTIALS.user,
        pass: EMAIL_CREDENTIALS.pass,
    },
});


export async function sendEMail(subject, toMail, htmlcontent, attachments) {
    return new Promise((resolve, reject) => {
        var mailOptions = {
            from: DEFAULT_EMAIL_ADDRESS,
            to: toMail,
            subject: subject,
            html: htmlcontent,
        };
        if (attachments?.length) {
            mailOptions.attachments = attachments;
        }
        transporter.sendMail(mailOptions, async function (error, info) {
            if (!error) resolve(true)
            if (error)
                reject(error)
        });
    })
}