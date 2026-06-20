import { Router, type Request, type Response } from "express";
import { authorizeRoles, authenticateRequest } from "../middleware/auth";
import { getReviewSummary } from "../services/review.service";
import {
  canManageStall,
  createStall,
  getStallById,
  listStalls,
  updateStall
} from "../services/stall.service";
import {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  listMenuItems,
  updateMenuItem
} from "../services/menu-item.service";

const stallsRouter = Router();

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

stallsRouter.get("/", async (request: Request, response: Response) => {
  const query: Record<string, string | boolean | undefined> = {};

  if (typeof request.query.q === "string") {
    query.q = request.query.q;
  }

  if (typeof request.query.category === "string") {
    query.category = request.query.category;
  }

  if (typeof request.query.location === "string") {
    query.location = request.query.location;
  }

  if (typeof request.query.isActive === "string") {
    query.isActive = request.query.isActive === "true";
  }

  const stalls = await listStalls(query);

  response.json({ stalls });
});

stallsRouter.post(
  "/",
  authenticateRequest,
  authorizeRoles("vendor", "admin"),
  async (request: Request, response: Response) => {
    const userId = request.userId;

    const { name, description, location, section, category, photoUrl, openingHours } = request.body as {
      name?: string;
      description?: string;
      location?: string;
      section?: string;
      category?: string;
      photoUrl?: string | null;
      openingHours?: string;
    };

    if (!userId) {
      response.status(401).json({ message: "Unauthorized." });
      return;
    }

    if (!name || !location) {
      response.status(400).json({ message: "name and location are required." });
      return;
    }

    const stall = await createStall({
      vendorId: userId,
      name,
      description,
      location,
      section,
      category,
      photoUrl: photoUrl ?? null,
      openingHours
    });

    response.status(201).json({ stall });
  }
);

stallsRouter.get("/:stallId", async (request: Request, response: Response) => {
  const stallId = firstParam(request.params.stallId);

  if (!stallId) {
    response.status(400).json({ message: "Invalid stall id." });
    return;
  }

  const stall = await getStallById(stallId);

  if (!stall) {
    response.status(404).json({ message: "Stall not found." });
    return;
  }

  const menuItems = await listMenuItems({ stallId });
  const reviewSummary = await getReviewSummary(stallId);
  response.json({ stall, menuItems, reviewSummary });
});

stallsRouter.patch(
  "/:stallId",
  authenticateRequest,
  authorizeRoles("vendor", "admin"),
  async (request: Request, response: Response) => {
    const stallId = firstParam(request.params.stallId);

    if (!stallId) {
      response.status(400).json({ message: "Invalid stall id." });
      return;
    }

    if (!request.userId || !request.role) {
      response.status(401).json({ message: "Unauthorized." });
      return;
    }

    const allowed = await canManageStall(stallId, request.userId, request.role);

    if (!allowed) {
      response.status(403).json({ message: "You cannot edit this stall." });
      return;
    }

    const stall = await updateStall(stallId, request.body as Record<string, unknown>);

    if (!stall) {
      response.status(404).json({ message: "Stall not found." });
      return;
    }

    response.json({ stall });
  }
);

stallsRouter.get("/:stallId/menu-items", async (request: Request, response: Response) => {
  const stallId = firstParam(request.params.stallId);

  if (!stallId) {
    response.status(400).json({ message: "Invalid stall id." });
    return;
  }

  const menuItems = await listMenuItems({ stallId });
  response.json({ menuItems });
});

stallsRouter.post(
  "/:stallId/menu-items",
  authenticateRequest,
  authorizeRoles("vendor", "admin"),
  async (request: Request, response: Response) => {
    const stallId = firstParam(request.params.stallId);

    if (!stallId) {
      response.status(400).json({ message: "Invalid stall id." });
      return;
    }

    if (!request.userId || !request.role) {
      response.status(401).json({ message: "Unauthorized." });
      return;
    }

    const allowed = await canManageStall(stallId, request.userId, request.role);

    if (!allowed) {
      response.status(403).json({ message: "You cannot add menu items to this stall." });
      return;
    }

    const { name, price, description, ingredients, allergens, nutrition, photoUrl, category, isAvailable, isFeatured } = request.body as {
      name?: string;
      price?: number;
      description?: string;
      ingredients?: string[];
      allergens?: string[];
      nutrition?: {
        calories?: number | null;
        proteinGrams?: number | null;
        carbsGrams?: number | null;
        fatGrams?: number | null;
        sodiumMilligrams?: number | null;
      };
      photoUrl?: string | null;
      category?: string;
      isAvailable?: boolean;
      isFeatured?: boolean;
    };

    if (!name || typeof price !== "number") {
      response.status(400).json({ message: "name and price are required." });
      return;
    }

    const menuItem = await createMenuItem({
      stallId,
      name,
      price,
      description,
      ingredients,
      allergens,
      nutrition,
      photoUrl: photoUrl ?? null,
      category,
      isAvailable,
      isFeatured
    });

    if (!menuItem) {
      response.status(404).json({ message: "Stall not found." });
      return;
    }

    response.status(201).json({ menuItem });
  }
);

stallsRouter.get("/menu-items/:menuItemId", async (request: Request, response: Response) => {
  const menuItemId = firstParam(request.params.menuItemId);

  if (!menuItemId) {
    response.status(400).json({ message: "Invalid menu item id." });
    return;
  }

  const menuItem = await getMenuItemById(menuItemId);

  if (!menuItem) {
    response.status(404).json({ message: "Menu item not found." });
    return;
  }

  response.json({ menuItem });
});

stallsRouter.patch(
  "/menu-items/:menuItemId",
  authenticateRequest,
  authorizeRoles("vendor", "admin"),
  async (request: Request, response: Response) => {
    if (!request.userId || !request.role) {
      response.status(401).json({ message: "Unauthorized." });
      return;
    }

    const menuItemId = firstParam(request.params.menuItemId);

    if (!menuItemId) {
      response.status(400).json({ message: "Invalid menu item id." });
      return;
    }

    const menuItem = await getMenuItemById(menuItemId);

    if (!menuItem) {
      response.status(404).json({ message: "Menu item not found." });
      return;
    }

    const allowed = request.role === "admin" || (await canManageStall(menuItem.stallId.toString(), request.userId, request.role));

    if (!allowed) {
      response.status(403).json({ message: "You cannot edit this menu item." });
      return;
    }

    const updatedMenuItem = await updateMenuItem(menuItemId, request.body as Record<string, unknown>);

    if (!updatedMenuItem) {
      response.status(404).json({ message: "Menu item not found." });
      return;
    }

    response.json({ menuItem: updatedMenuItem });
  }
);

stallsRouter.delete(
  "/:stallId",
  authenticateRequest,
  authorizeRoles("vendor", "admin"),
  async (request: Request, response: Response) => {
    const stallId = firstParam(request.params.stallId);

    if (!stallId) {
      response.status(400).json({ message: "Invalid stall id." });
      return;
    }

    if (!request.userId || !request.role) {
      response.status(401).json({ message: "Unauthorized." });
      return;
    }

    const allowed = await canManageStall(stallId, request.userId, request.role);

    if (!allowed) {
      response.status(403).json({ message: "You cannot delete this stall." });
      return;
    }

    const deleted = await deleteStall(stallId);

    if (!deleted) {
      response.status(404).json({ message: "Stall not found." });
      return;
    }

    response.status(204).send();
  }
);

stallsRouter.delete(
  "/menu-items/:menuItemId",
  authenticateRequest,
  authorizeRoles("vendor", "admin"),
  async (request: Request, response: Response) => {
    if (!request.userId || !request.role) {
      response.status(401).json({ message: "Unauthorized." });
      return;
    }

    const menuItemId = firstParam(request.params.menuItemId);

    if (!menuItemId) {
      response.status(400).json({ message: "Invalid menu item id." });
      return;
    }

    const menuItem = await getMenuItemById(menuItemId);

    if (!menuItem) {
      response.status(404).json({ message: "Menu item not found." });
      return;
    }

    const allowed = request.role === "admin" || (await canManageStall(menuItem.stallId.toString(), request.userId, request.role));

    if (!allowed) {
      response.status(403).json({ message: "You cannot delete this menu item." });
      return;
    }

    const deleted = await deleteMenuItem(menuItemId);

    if (!deleted) {
      response.status(404).json({ message: "Menu item not found." });
      return;
    }

    response.status(204).send();
  }
);

export { stallsRouter };