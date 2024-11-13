import mongoose from "mongoose";
import FamilyMembers from "../models/familyMembersModel.js";

export async function createFamilyMember(req, res, next) {
    try {
        req.body.userid = new mongoose.Types.ObjectId(req.userId);
        const familyMember = new FamilyMembers(req.body);
        await familyMember.save();
        res.status(201).json({
            status: true,
            message: "Family members created successfully"
        });
    } catch (err) {
        res.status(422).json({
            status: false,
            message: err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message)[0] : "Server side issue"
        });
        next(err);
    }
};

export async function getAllFamilyMembers(req, res, next) {
    try {
        const familyMembers = await FamilyMembers.find({"userId":new mongoose.Types.ObjectId(req.params.id)});
        res.status(200).json(familyMembers);
    } catch (error) {
        next(error);
    }
};

export async function getFamilyMemberById(req, res, next) {
    try {
        const familyMember = await FamilyMembers.findById(req.params.id);
        if (!familyMember) {
            return res.status(422).json({ status: false, message: "Family member not found" });
        }
        res.status(200).json(familyMember);
    } catch (error) {
        next(error);
    }
};

export async function updateFamilyMemberById(req, res, next) {
    try {
        req.body.updatedAt = new Date();
        const familyMember = await FamilyMembers.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!familyMember) {
            return res.status(422).json({ status: false, message: "Family member not found" });
        }
        res.status(201).json({
            status: true,
            message: "Family members updated successfully"
        });
    } catch (err) {
        res.status(422).json({
            status: false,
            message: err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message)[0] : "Server side issue"
        });
        next(err);
    }
};

export async function deleteFamilyMemberById(req, res, next) {
    try {
        const familyMember = await FamilyMembers.findByIdAndDelete(req.params.id);
        if (!familyMember) {
            return res.status(422).json({ status: true, message: "Family member not found" });
        }
        res.status(200).json({ status: true, message: "Family member deleted successfully" });
    } catch (error) {
        next(error);
    }
};
