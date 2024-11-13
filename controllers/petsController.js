import mongoose from "mongoose";
import Pets from "../models/petsModel.js";


export async function createPets(req, res, next) {
    try {
        req.body.userid = new mongoose.Types.ObjectId(req.body.userid);
        const pets = new Pets(req.body);
        await pets.save();
        res.status(201).json({
            status: true,
            message: "Pet details created successfully"
        });
    } catch (err) {
        res.status(422).json({
            status: false,
            message: err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message)[0] : "Server side issue"
        });
        next(err);
    }
};

export async function getAllPets(req, res, next) {
    try {
        const pets = await Pets.find({"userId": new mongoose.Types.ObjectId(req.params.id)});
        res.status(200).json(pets);
    } catch (error) {
        next(error);
    }
};

export async function getPetsById(req, res, next) {
    try {
        const pets = await Pets.findById(req.params.id);
        if (!pets) {
            return res.status(422).json({ status: false, message: "Pets details not found" });
        }
        res.status(200).json(pets);
    } catch (error) {
        next(error);
    }
};


export async function updatePetsById(req, res, next) {
    try {
        req.body.updatedAt = new Date();
        const pets = await Pets.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!pets) {
            return res.status(422).json({ status: false, message: "Pets not found" });
        }
        res.status(201).json({
            status: true,
            message: "Pets updated successfully"
        });
    } catch (err) {
        res.status(422).json({
            status: false,
            message: err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message)[0] : "Server side issue"
        });
        next(err);
    }
};


export async function deletePetsById(req, res, next) {
    try {
        const pets = await Pets.findByIdAndDelete(req.params.id);
        if (!pets) {
            return res.status(422).json({ status: true, message: "Pets details not found" });
        }
        res.status(200).json({ status: true, message: "Pets details deleted successfully" });
    } catch (error) {
        next(error);
    }
};
