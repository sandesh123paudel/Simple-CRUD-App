const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", userController.home);
router.get("/add-user", userController.addUser);
router.post("/add-user", userController.upload, userController.addUserPost);
router.get("/edit-user/:id", userController.editUser);

module.exports = router;
