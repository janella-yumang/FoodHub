"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.isDuplicateEmailError = isDuplicateEmailError;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongo_1 = require("../utils/mongo");
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const env_1 = require("../config/env");
async function registerUser(input) {
    const config = (0, env_1.getConfig)();
    const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
    const user = await models_1.UserModel.create({
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role ?? "user"
    });
    return {
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            profilePictureUrl: user.profilePictureUrl,
            isActive: user.isActive
        },
        accessToken: (0, jwt_1.signAccessToken)({ userId: user._id.toString(), role: user.role }, config.jwtSecret)
    };
}
async function loginUser(input) {
    const config = (0, env_1.getConfig)();
    const user = await models_1.UserModel.findOne({ email: input.email.toLowerCase().trim(), isActive: true }).select("+passwordHash");
    if (!user) {
        return null;
    }
    const passwordMatches = await bcryptjs_1.default.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
        return null;
    }
    return {
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            profilePictureUrl: user.profilePictureUrl,
            isActive: user.isActive
        },
        accessToken: (0, jwt_1.signAccessToken)({ userId: user._id.toString(), role: user.role }, config.jwtSecret)
    };
}
function isDuplicateEmailError(error) {
    return (0, mongo_1.isMongoServerError)(error) && error.code === 11000;
}
