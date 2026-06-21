import { Router, type Request, type Response } from "express";
import { authenticateRequest, authorizeRoles } from "../middleware/auth";
import { listUsers, updateUser } from "../services/user.service";

const usersRouter = Router();

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

// Get all users (admin only)
usersRouter.get(
  "/",
  authenticateRequest,
  authorizeRoles("admin"),
  async (request: Request, response: Response) => {
    try {
      const users = await listUsers();
      response.json({ users });
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch users." });
    }
  }
);

// Get current user profile
usersRouter.get(
  "/:userId",
  authenticateRequest,
  async (request: Request, response: Response) => {
    const userId = firstParam(request.params.userId);
    
    if (!userId) {
      response.status(400).json({ message: "Invalid user id." });
      return;
    }

    // Users can only access their own profile unless they're admin
    if (request.role !== "admin" && request.userId !== userId) {
      response.status(403).json({ message: "You can only access your own profile." });
      return;
    }

    try {
      const user = await updateUser(userId, {}); // Get without updating
      if (!user) {
        response.status(404).json({ message: "User not found." });
        return;
      }
      response.json(user);
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch user." });
    }
  }
);

// Update user profile
usersRouter.patch(
  "/:userId",
  authenticateRequest,
  async (request: Request, response: Response) => {
    const userId = firstParam(request.params.userId);

    if (!userId) {
      response.status(400).json({ message: "Invalid user id." });
      return;
    }

    // Users can only update their own profile unless they're admin
    if (request.role !== "admin" && request.userId !== userId) {
      response.status(403).json({ message: "You can only update your own profile." });
      return;
    }

    const { 
      name, 
      email, 
      profilePictureUrl, 
      studentId, 
      courseSection, 
      schoolEmail, 
      contactNumber,
      role, 
      isActive 
    } = request.body as {
      name?: string;
      email?: string;
      profilePictureUrl?: string | null;
      studentId?: string | null;
      courseSection?: string | null;
      schoolEmail?: string | null;
      contactNumber?: string | null;
      role?: "user" | "vendor" | "admin";
      isActive?: boolean;
    };

    try {
      const updates: Record<string, unknown> = {};
      
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = email;
      if (profilePictureUrl !== undefined) updates.profilePictureUrl = profilePictureUrl;
      if (studentId !== undefined) updates.studentId = studentId;
      if (courseSection !== undefined) updates.courseSection = courseSection;
      if (schoolEmail !== undefined) updates.schoolEmail = schoolEmail;
      if (contactNumber !== undefined) updates.contactNumber = contactNumber;
      
      // Only admins can change role and isActive
      if (request.role === "admin") {
        if (role !== undefined) updates.role = role;
        if (isActive !== undefined) updates.isActive = isActive;
      }

      const user = await updateUser(userId, updates);

      if (!user) {
        response.status(404).json({ message: "User not found." });
        return;
      }

      response.json(user);
    } catch (error) {
      response.status(500).json({ message: "Failed to update user." });
    }
  }
);

export { usersRouter };
