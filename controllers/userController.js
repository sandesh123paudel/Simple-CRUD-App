const User = require("../models/users");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { log } = require("console");

//image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage }).single("image");
exports.upload = upload;

exports.home = async (req, res) => {
  try {
    const perPage = 5; // Number of users per page
    const page = parseInt(req.query.page) || 1;
    const searchQuery = req.query.search || "";

    const searchFilter = {
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
        { phone: { $regex: searchQuery, $options: "i" } },
      ],
    };

    const totalUsers = await User.countDocuments(searchFilter);
    const users = await User.find(searchFilter)
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render("index", {
      title: "Home",
      page: "home",
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / perPage),
      searchQuery,
    });
  } catch (err) {
    console.error("Error loading users:", err);
    res.status(500).send("Server Error");
  }
};

exports.addUser = (req, res) => {
  res.render("add-user", {
    title: "Add User",
    page: "add-user",
    editing: false,
    user: null,
  });
};

exports.addUserPost = (req, res) => {
  console.log(req.body);
  const { name, email, phone } = req.body;
  if (!req.file) {
    console.log("No file uploaded");
    return res.status(422).send("No file uploaded");
  }
  const image = req.file.filename;
  const user = new User({ name, email, phone, image });

  user
    .save()
    .then(() => {
      req.session.message = "User added successfully";
      res.redirect("/");
    })
    .catch((err) => {
      res.json({ message: "Error saving user", type: "danger" });
    });
};

exports.editUser = (req, res) => {
  const id = req.params.id;
  const editing = req.query.editing === "true";
  const user = User.findById(id);
  user.then((user) => {
    res.render("add-user", {
      title: "Edit User",
      page: "edit-user",
      user: user,
      editing: editing,
    });
  });
};

exports.editUserPost = (req, res) => {
  const { id, name, email, phone } = req.body;

  User.findById(id)
    .then((user) => {
      user.name = name;
      user.email = email;
      user.phone = phone;

      if (req.file) {
        const oldImagePath = path.join("uploads", user.image);

        // Delete old image if it exists
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.log("Error while deleting old image:", err);
          }
          // Update with new image
          user.image = req.file.filename;

          // Save after image is updated
          user
            .save()
            .then((result) => {
              console.log("User Edited Successfully with image", result);
              res.redirect("/");
            })
            .catch((err) => {
              console.log("Error while saving updated user", err);
              res.status(500).send("Error updating user");
            });
        });
      } else {
        // No new image uploaded
        user
          .save()
          .then((result) => {
            console.log("User Edited Successfully without image", result);
            res.redirect("/");
          })
          .catch((err) => {
            console.log("Error while saving updated user", err);
            res.status(500).send("Error updating user");
          });
      }
    })
    .catch((err) => {
      console.log("Error while finding user:", err);
      res.status(500).send("User not found");
    });
};

exports.deleteUser = (req, res) => {
  const id = req.params.id;
  User.findByIdAndDelete(id)
    .then((result) => {
      fs.unlink(path.join("uploads", result.image), (err) => {
        if (err) {
          console.log("Error while deleting image:", err);
        }
      });
      res.redirect("/");
    })
    .catch((err) => {
      console.log("Error while deleting user:", err);
      res.status(500).send("User not found");
    });
};
