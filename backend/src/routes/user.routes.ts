import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  getMe,
  updateMe,
  updateLocation,
  updatePassword,
  deleteMe,
  toggleFavoriteSeller,
  getFavoriteSellers,
  isSellerFavorited,
} from "../controllers/user.controller";

const router = Router();

router.get("/me", authenticateToken, getMe);
router.put("/me", authenticateToken, updateMe);
router.put("/me/location", authenticateToken, updateLocation);
router.put("/me/password", authenticateToken, updatePassword);
router.delete("/me", authenticateToken, deleteMe);

// Favorites
router.get("/favorites", authenticateToken, getFavoriteSellers);
router.get("/favorites/:id", authenticateToken, isSellerFavorited);
router.post("/favorites/toggle", authenticateToken, toggleFavoriteSeller);

export default router;
