"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
        type: String,
        required: true,
        enum: ["student", "vendor", "admin"],
        default: "student"
    },
    profilePictureUrl: { type: String, trim: true, default: null },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
userSchema.index({ role: 1, isActive: 1 });
exports.UserModel = (0, mongoose_1.model)("User", userSchema);
