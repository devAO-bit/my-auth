import express from "express";
import {
  registerController,
  loginController,
  logoutController,
  refreshAccessTokenController,
  logoutAllController
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/refresh-token", refreshAccessTokenController);
router.post("/logout", logoutController);
router.post("/logout-all", logoutAllController);

export default router;
