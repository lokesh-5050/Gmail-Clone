var express = require("express");
const passport = require("passport");
var router = express.Router();
var userModel = require("./users");
var mailModel = require("./mails");
const multer = require("multer");
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

//oauth

const GOOGLE_CLIENT_ID =
  "184644567601-712m204ljidhmliomk42a9deq45h7i4k.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";
const findOrCreate = require("mongoose-findorcreate");

var GoogleStrategy = require("passport-google-oauth2").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      userModel.findOrCreate(
        { email: profile.email, username: profile.displayName },
        function (err, user) {
          console.log(user);
          return done(err, user);
        }
      );
    }
  )
);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/profile",
    failureRedirect: "/",
  })
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads");
  },
  filename: function (req, file, cb) {
    const fn = Date.now() + Math.random() + file.originalname;
    cb(null, fn);
  },
});

const upload = multer({ storage: storage });

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/register", function (req, res, next) {
  const newUser = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
  });
  userModel.register(newUser, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/login");
    });
  });
});

router.get("/login", function (req, res, next) {
  res.render("login");
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
  }),
  function (req, res, next) {}
);

router.get("/profile", isLoggedIn, async (req, res) => {
  const userData = await userModel
    .findOne({ username: req.user.username })
    .populate({
      path: "receivedMails",
      populate: {
        path: "user",
      },
    });
  const mailData = await mailModel.find();
  // console.log(userData + "user.js")

  res.render("profile", { userData, mailData });
});

router.post("/compose", isLoggedIn, async (req, res) => {
  const loggedInUser = await userModel.findOne({ username: req.user.username });
  const newMail = await mailModel.create({
    sendingto: req.body.sendingto,
    mailtext: req.body.mailtext,
    user: loggedInUser._id,
  });

  // console.log(newMail + "new mail")
  ///
  loggedInUser.sentMails.push(newMail._id);
  loggedInUser.save();

  console.log(loggedInUser);

  const Finduser = await userModel.findOne({ email: req.body.sendingto });
  // console.log(Finduser + "recievd");
  Finduser.receivedMails.push(newMail._id);
  Finduser.save();

  res.redirect("/profile");
});

router.get("/read/mail/:id", isLoggedIn, async (req, res) => {
  const fMail = await mailModel
    .findOne({ _id: req.params.id })
    .populate({ path: "user", populate: { path: "sentMails" } });
  const userr = await userModel.findOne({ username: req.user.username });

  fMail.read = true;
  const finalRes = await fMail.save();
  // res.json(userr)
  res.render("read", { fMail, userData: userr });
});

router.get("/mail/delete/:id", isLoggedIn, async (req, res) => {
  const deletedMail = await mailModel.findOneAndDelete({ _id: req.params.id });
  res.redirect(req.headers.referer);
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/");
  }
}

router.get("/logout", isLoggedIn, async (req, res) => {
  req.logout((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});


router.get("/sent/mails/:id", isLoggedIn, async (req, res) => {
  const OfUserLoggedIn = await userModel
    .findOne({ username: req.user.username })
    .populate("sentMails");
  // console.log(OfUserLoggedIn);

  res.render("sent", { sent: OfUserLoggedIn });
  // res.json(OfUserLoggedIn)
});

router.post(
  "/uploadFiles",
  isLoggedIn,
  upload.single("file"),
  async (req, res) => {
    const owner = await userModel.findOne({ username: req.user.username });

    owner.profilePic = req.file.filename;
    owner.save();
    console.log(owner + "uploadedFiles");

    res.redirect(req.headers.referer);
  }
);

module.exports = router;
