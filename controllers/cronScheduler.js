
import cron from 'node-cron';
import User from "../models/userModal.js";
import Product from "../models/productWarrantyModel.js";
import Association from "../models/associationModel.js";
import { MaintenanceConfiguration } from '../models/maintenanceConfigurationModel.js';
import { sendEMail } from '../constants/mailservices.js';
import moment from 'moment';
import xlsx from 'xlsx';
import fs from 'fs';
import { SUPER_ADMIN } from '../constants/roles.js';
import Flat from '../models/flatModal.js';

export default function startCronJob() {


    const getCurrentMonthRange = () => {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setHours(0, 0, 0, 0);

        return { start, end };
    };

    cron.schedule('* * * * *', async () => {
        try {
            const isExist = await User.find({
                isEmailVerified: false,
                autoDeleteTime: { $lt: Date.now() },
            });
        
            if (isExist.length > 0) {
                const result = await User.deleteMany({
                    isEmailVerified: false,
                    autoDeleteTime: { $lt: Date.now() },
                });
        
                await Promise.all(
                    isExist.map(user => 
                        Flat.findByIdAndUpdate(user?.flatId?.toString(), { isBooked: false })
                    )
                );
            } else {
                // console.log("No users found for deletion.");
            }
        } catch (error) {
            // console.error("Error occurred:", error.message);
        }
        
    });

    // Method: send mail to specific users who all are not paid amount
    // cron.schedule('*/10 * * * * *', async () => { // for testing: run it for every 10 sec
    cron.schedule('0 0 1 * *', async () => { // Runs every first day of month
        // const { date } = req.body;
        // if (!date) {
        //     return res.status(400).json({ status: false, message: 'Required year and month' });
        // }

        // const splitted = date.split("-");
        // const year = splitted[0];
        // const month = splitted[1];
        // const startDate = new Date(year, month - 1, 1);
        // const endDate = new Date(year, month, 1);


        const response = await MaintenanceConfiguration.aggregate([
            {
                $match: {
                    // createdAt: { 
                    //     $gte: startDate, 
                    //     $lt: endDate 
                    // }
                    isPaid: false
                }
            },
            {
                $lookup: {
                    from: "maintenances",
                    localField: "maintenanceId",
                    foreignField: "_id",
                    as: "maintenanceData"
                }
            },
            {
                $unwind: {
                    path: "$maintenanceData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "flats",
                    localField: "flatId",
                    foreignField: "_id",
                    as: "flatsData"
                }
            },
            {
                $unwind: {
                    path: "$flatsData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    flatsData: { $ne: null }
                }
            },
            {
                $lookup: {
                    from: "blocks",
                    localField: "flatsData.blockId",
                    foreignField: "_id",
                    as: "blockData"
                }
            },
            {
                $unwind: {
                    path: "$blockData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "flatsData._id",
                    foreignField: "flatId",
                    as: "userData"
                }
            },
            {
                $unwind: {
                    path: "$userData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    flatName: "$flatsData.flatName",
                    blockName: "$blockData.blockName",
                    userName: "$userData.name",
                    email: "$userData.email",
                    squareFeet: "$flatsData.squareFeet",
                    maintenanceAmount: 1,
                    createdAt: 1,
                    shortName: "$maintenanceData.shortName",
                    flatType: "$flatsData.isBooked",
                    isPaid: 1,
                    paidAt: {
                        $cond: {
                            if: { $eq: ["$paidAt", null] },
                            then: null,
                            else: "$paidAt"
                        }
                    }
                }
            }
        ]).exec();

        response?.forEach(async (element) => {
            if (element?.email) {
                const association = await Association.findOne({});
                const emailContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Your One-Time Password (OTP) for ${association?.name} Login</title>
                    </head>
                    <body>
                        <p>Dear ${element.userName},</p>
                        <p>Kindly make the payment of ${element.maintenanceAmount} for the ${moment(element.createdAt).format("MMMM")} on or before 10th of the ${moment(element.createdAt).format("MMMM")}.</p>
                        <p>Thank you for being a part of our community!</p>
                        <p>Regards,</p>
                        <p>Admin</p>
                        <p>${association?.name}</p>
                    </body>
                    </html>
                  `;
                var mailSubject = `Payment Dues Remainder`;
                if (mailSubject && emailContent)
                    var mailResponse = await sendEMail(
                        mailSubject,
                        element.email,
                        emailContent
                    );
            }
        });
    });



    // Method: send mail with excel(unpaid and current month paid) to Admin for every month 15th
    cron.schedule('0 0 15 * *', async () => {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

        const response = await MaintenanceConfiguration.aggregate([
            {
                $match: {
                    $or: [
                        { isPaid: false },
                        {
                            isPaid: true,
                            createdAt: {
                                $gte: startOfMonth,
                                $lt: endOfMonth
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "maintenances",
                    localField: "maintenanceId",
                    foreignField: "_id",
                    as: "maintenanceData"
                }
            },
            {
                $unwind: {
                    path: "$maintenanceData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "flats",
                    localField: "flatId",
                    foreignField: "_id",
                    as: "flatsData"
                }
            },
            {
                $unwind: {
                    path: "$flatsData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    flatsData: { $ne: null }
                }
            },
            {
                $lookup: {
                    from: "blocks",
                    localField: "flatsData.blockId",
                    foreignField: "_id",
                    as: "blockData"
                }
            },
            {
                $unwind: {
                    path: "$blockData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "flatsData._id",
                    foreignField: "flatId",
                    as: "userData"
                }
            },
            {
                $unwind: {
                    path: "$userData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    flatName: "$flatsData.flatName",
                    blockName: "$blockData.blockName",
                    userName: "$userData.name",
                    email: "$userData.email",
                    squareFeet: "$flatsData.squareFeet",
                    maintenanceAmount: 1,
                    createdAt: 1,
                    shortName: "$maintenanceData.shortName",
                    flatType: "$flatsData.isBooked",
                    isPaid: 1,
                    paidAt: {
                        $cond: {
                            if: { $eq: ["$paidAt", null] },
                            then: null,
                            else: "$paidAt"
                        }
                    }
                }
            }
        ]).exec();

        if (!response.length) {
            return;
        }

        // Transform data for the Excel sheet
        const transformedData = response.map(item => ({
            maintenanceAmount: item.maintenanceAmount,
            Paid: item.isPaid ? 'Paid' : 'Unpaid',  // Custom header
            createdAt: item.createdAt,
            flatName: item.flatName,
            blockName: item.blockName,
            squareFeet: item.squareFeet,
            shortName: item.shortName,
            // flatType: item.flatType,
            paidAt: item.paidAt,
        }));

        const worksheet = xlsx.utils.json_to_sheet(transformedData, { header: ['maintenanceAmount', 'Paid', 'createdAt', 'flatName', 'blockName', 'squareFeet', 'shortName', 'paidAt'] });

        const headers = ['Maintenance Amount', 'Paid', 'Created Date', 'Flat Name', 'Block Name', 'Square Feet', 'Short Name', 'Paid Date'];

        headers.forEach((header, index) => {
            const cell = worksheet[xlsx.utils.encode_cell({ r: 0, c: index })];
            if (cell) {
                cell.v = header;
            }
        });

        // Set cell styles for the Paid column
        const range = xlsx.utils.decode_range(worksheet['!ref']);
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
            const cellAddress = `B${row + 1}`; // Column 'B' for 'Paid'
            const cell = worksheet[cellAddress];

            if (cell) {
                cell.s = {
                    fill: {
                        fgColor: { rgb: cell.v === 'Paid' ? '90EE90' : 'FFA07A' }, // Light green for 'Paid' and light orange for 'Unpaid'
                    },
                };
            }
        }

        // Create a new workbook
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Maintenance Data');

        const excelFilePath = 'maintenance_data.xlsx';
        xlsx.writeFile(workbook, excelFilePath);

        const attachments = [{ path: excelFilePath }];
        const association = await Association.findOne({});

        const emailContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Society Dues Payment Status</title>
            </head>
            <body>
                <p>Dear Admin,</p>
                <p>Kindly find the attached Society Dues Payment Status Report as of ${moment(new Date()).format("DD-MM-YYYY")}.</p>
                <p>Regards,</p>
                <p>Admin</p>
                <p>${association?.name}</p>
            </body>
            </html>
        `;

        const mailSubject = `Society Dues Payment Status`;

        if (mailSubject && emailContent) {
            try {
                const users = await User.find({ role: SUPER_ADMIN })
                users?.forEach(async (element) => {
                    const mailResponse = await sendEMail(
                        mailSubject,
                        element.email,
                        emailContent,
                        attachments
                    );
                });

            } catch (error) {
                // console.error("Error sending email:", error);
            }
        }
    });

    // Method: send mail to Admin for upcoming and expired product warranty
    cron.schedule('0 0 * * 1', async () => { // triggers on every monday
        try {
            const currentDate = new Date();
            const futureDate = new Date(currentDate);
            futureDate.setDate(futureDate.getDate() + 60);

            const products = await Product.find({
                'warranty.endDate': { $lt: futureDate }
            });

            if (products.length === 0) {
                return;
            }

            const association = await Association.findOne({});

            for (const product of products) {
                const emailContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Warranty Item Expiry Notification</title>
                    </head>
                    <body>
                        <p>Dear Admin,</p>
                        <p>Please note the warranty of the ${product.productName} is expiring on ${moment(product.warranty.endDate).format('DD-MM-YYYY')}. Kindly take necessary steps to extend the expiry.</p>
                        <p>Regards,</p>
                        <p>Admin</p>
                        <p>${association?.name || 'Your Organization'}</p>
                    </body>
                    </html>
                `;

                const mailSubject = `Warranty Expiry Notification - ${product.productName}`;

                const users = await User.find({ role: SUPER_ADMIN });

                for (const user of users) {
                    try {
                        await sendEMail(mailSubject, user.email, emailContent);
                    } catch (error) {
                        // console.error(`Error sending email to ${user.email}:`, error);
                    }
                }
            }
        } catch (error) {
            // console.error('Error in cron job:', error);
        }
    });


}
