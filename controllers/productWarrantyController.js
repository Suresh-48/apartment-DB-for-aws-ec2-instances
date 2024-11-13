import ProductWarranty from "../models/productWarrantyModel.js";
import ProductDocument from "../models/productDocumentModel.js";
import mongoose from 'mongoose';
import moment from 'moment';
import { PRODUCT_FILE_TYPE_VENDOR, PRODUCT_FILE_TYPE_WARRANTY } from '../constants/productFile.js'
import { uploadOneFile } from '../utils/s3.js'

export async function addProduct(req, res, next) {
    try {
        const {
            productName,
            category,
            quantity,
            brand,
            model,
            serialNumber,
            installationDate,
            location,
            description,
            warranty = {},
            serviceContract,
            vendor = {},
            handoverDate,
            condition,
            adminNotes,
            userId
        } = req.body;

        const {
            startDate: warrantyStartDate,
            endDate: warrantyEndDate,
            terms: warrantyTerms,
            contactInfo: warrantyContactInfo,
            document: warrantyDocument
        } = warranty;

        const {
            name: vendorName,
            contactInfo: vendorContactInfo,
            invoiceNumber,
            invoiceDocument
        } = vendor;

        const createdAt = moment().format("lll");

        if (warrantyDocument?.length > 0) {
            if (!warrantyDocument[0] || !warrantyDocument[0].fileName || !warrantyDocument[0].fileData) {
                throw new Error("File must contain 'fileName' and 'fileData'");
            }
        }

        if (invoiceDocument?.length > 0) {
            if (!invoiceDocument[0] || !invoiceDocument[0].fileName || !invoiceDocument[0].fileData) {
                throw new Error("File must contain 'fileName' and 'fileData'");
            }
        }


        const newData = {
            productName,
            category,
            quantity,
            brand,
            model,
            serialNumber,
            installationDate,
            location,
            description,
            warranty: {
                startDate: warrantyStartDate,
                endDate: warrantyEndDate,
                terms: warrantyTerms,
                contactInfo: warrantyContactInfo,
                document: warrantyDocument
            },
            serviceContract,
            vendor: {
                name: vendorName,
                contactInfo: vendorContactInfo,
                invoiceNumber,
                invoiceDocument
            },
            handoverDate,
            condition,
            adminNotes,
            createdAt,
            createdBy: new mongoose.Types.ObjectId(req.userId)
        };

        const savedData = await ProductWarranty.create(newData);

        let documentData = [];
        let docObj = {
            productId: savedData._id,
            type: "",
            documentName: "",
            documentPath: "",
            documentType: ""
        };

        if (warrantyDocument) {
            const billData = await uploadOneFile(warrantyDocument);
            documentData.push({
                ...docObj,
                type: PRODUCT_FILE_TYPE_WARRANTY,
                documentPath: billData.documentPath,
                documentName: billData.documentName,
                documentType: billData.documentType
            });
        }

        if (invoiceDocument) {
            const billData = await uploadOneFile(invoiceDocument);
            documentData.push({
                ...docObj,
                type: PRODUCT_FILE_TYPE_VENDOR,
                documentPath: billData.documentPath,
                documentName: billData.documentName,
                documentType: billData.documentType
            });
        }

        if (documentData?.length) {
            await ProductDocument.insertMany(documentData);
        }

        res.status(201).json({
            status: true,
            message: 'Product warranty created successfully',
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors)[0].message;
            res.status(400).json({ status: false, message });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
}

export async function getProductById(req, res, next) {
    try {
        const productId = req.params.id;
        if (!productId) {
            return res.status(400).json({ status: false, message: "Required warranty details Id" });
        }
        const product = await ProductWarranty.findById(productId);
        const productDoc = await ProductDocument.find({ productId: product._id }, { "documentPath": 1, "type": 1 });
        res.status(200).json({ status: true, data: product, productDoc: productDoc });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export async function getProduct(req, res, next) {
    try {
        const products = await ProductWarranty.find().select('productName category warranty.endDate');
        res.status(200).json({ status: true, data: products });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export async function updateProduct(req, res, next) {
    try {
        const { id } = req.params;

        const postData = req.body;

        const existingData = await ProductWarranty.findById(id);

        if (!existingData) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const updatedData = {
            productName: postData.productName || existingData.productName,
            category: postData.category || existingData.category,
            quantity: postData.quantity || existingData.quantity,
            brand: postData.brand || existingData.brand,
            model: postData.model || existingData.model,
            serialNumber: postData.serialNumber || existingData.serialNumber,
            installationDate: postData.installationDate || existingData.installationDate,
            location: postData.location || existingData.location,
            description: postData.description || existingData.description,

            warranty: {
                startDate: postData?.warranty?.startDate || existingData?.warranty?.startDate,
                endDate: postData?.warranty?.endDate || existingData?.warranty?.endDate,
                terms: postData?.warranty?.terms || existingData?.warranty?.terms,
                contactInfo: postData?.warranty?.contactInfo || existingData?.warranty?.contactInfo,
                document: postData?.warranty?.document || existingData?.warranty?.document
            },

            serviceContract: postData.serviceContract || existingData.serviceContract,

            vendor: {
                name: postData?.vendor?.name || existingData?.vendor?.name,
                contactInfo: postData?.vendor?.contactInfo || existingData?.vendor?.contactInfo,
                invoiceNumber: postData?.vendor?.invoiceNumber || existingData?.vendor?.invoiceNumber,
                invoiceDocument: postData?.vendor?.invoiceDocument || existingData?.vendor?.invoiceDocument
            },

            handoverDate: postData.handoverDate || existingData.handoverDate,
            condition: postData.condition || existingData.condition,
            adminNotes: postData.adminNotes || existingData.adminNotes
        };

        const updatedProduct = await ProductWarranty.findByIdAndUpdate(id, updatedData, { new: true });

        res.status(200).json({ status: true, message: 'Product updated successfully' });
    } catch (error) {
        res.status(400).json({ status: false, error: error.message });
    }
}


export async function deleteProduct(req, res, next) {
    try {
        const { id } = req.params;
        const existingData = await ProductWarranty.findById(id);
        if (!existingData) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await ProductWarranty.findByIdAndDelete(id);
        res.status(200).json({ status: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(400).json({ status: false, error: error.message });
    }
}