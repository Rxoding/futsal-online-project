import Joi from 'joi';

const signUpValidator = async (req, res, next) => {
  email: Joi.string().email().required();
  password: Joi.string().min(6).required();
};

const signInValidator = async (req, res, next) => {
  email: Joi.string().email().required();
  password: Joi.string().min(6).required();
};

const cashValidator = async (req, res, next) => {
  cash: Joi.number().required;
};

export default userValidator;
