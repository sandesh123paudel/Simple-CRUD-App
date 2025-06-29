const User = require("../models/users");
const path = require("path");
const multer = require("multer");

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

exports.home = (req, res) => {
  const users = User.find();
  users.then((users) => {
    res.render("index", {
      title: "Home",
      page: "home",
      users: users,
    });
  });
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
    return res.json({ message: "No file uploaded", type: "danger" });
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
