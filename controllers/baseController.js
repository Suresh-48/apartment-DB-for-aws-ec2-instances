import AppError from "../utils/appError.js";
import APIFeatures from "../utils/apiFeatures.js";

/**
 * Get All
 *
 * @param {*} Model
 */
export function getAll(Model) {
  return async (req, res, next) => {
    try {
      const features = new APIFeatures(Model.find(), req.query).sort().paginate();

      const doc = await features.query;

      res.status(200).json({
        status: "success",
        results: doc.length,
        data: {
          data: doc,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Get Details
 *
 * @param {*} Model
 */
export function getOne(Model) {
  return async (req, res, next) => {
    try {
      const doc = await Model.findById(req.params.id);

      if (!doc) {
        return next(new AppError(404, "fail", "No document found with that id"), req, res, next);
      }

      res.status(200).json({
        status: "success",
        data: {
          doc,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 *  Create Record
 *
 * @param {*} Model
 */
export function createOne(Model) {
  return async (req, res, next) => {
    try {
      const doc = await Model.create(req.body);

      res.status(201).json({
        status: "success",
        data: {
          doc,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 *  Update
 *
 * @param {*} Model
 */
export function updateOne(Model) {
  return async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!doc) {
        return next(new AppError(404, "fail", "No document found with that id"), req, res, next);
      }

      res.status(200).json({
        status: "success",
        data: {
          doc,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Delete
 *
 * @param {*} Model
 */
export function deleteOne(Model) {
  return async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);

      if (!doc) {
        return next(new AppError(404, "fail", "No document found with that id"), req, res, next);
      }

      res.status(204).json({
        status: "success",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };
}
