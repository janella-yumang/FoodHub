import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
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
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);