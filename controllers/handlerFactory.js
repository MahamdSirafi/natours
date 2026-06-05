import APIFeatures from '../utils/apiFeatures.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

export const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndRemove(req.params.id);
    const modelName = `${Model.modelName.toLowerCase()}`;
    if (!doc) {
      return next(new AppError(404, `No ${modelName} found with that ID`));
    }
    res.status(204).send({ status: 'success', data: null });
  });

export const updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    const modelName = `${Model.modelName.toLowerCase()}`;
    if (!doc) {
      return next(new AppError(404, `No ${modelName} found with that ID`));
    }
    res.status(200).send({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

export const createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).send({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });

export const getOne = (Model, ...popOptions) =>
  catchAsync(async (req, res, next) => {
    const query = Model.findById(req.params.id);
    if (popOptions) query.populate(popOptions);

    const doc = await query;
    const modelName = `${Model.modelName.toLowerCase()}`;

    if (!doc) {
      return next(new AppError(404, `No ${modelName} with that ID`));
    }
    res.status(200).send({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

export const getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //small hack
    const filter = {};
    if (req.params.tourId) filter.tour = req.params.tourId;
    if (req.params.userId) filter.user = req.params.userId;
    const feature = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const docs = await feature.query.explain();
    const docs = await feature.query;
    //Send Response
    res.json({
      status: 200,
      result: docs.length,
      data: {
        data: docs,
      },
    });
  });
