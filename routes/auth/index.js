const express = require("express");
const bcrypt = require("bcryptjs-then");
const jwt = require("jsonwebtoken");

const User = require("../../models/user");
const Profile = require("../../models/userProfile");

const router = express.Router();

async function validatePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

const getAccessToken = (userId) =>
  jwt.sign({ userId: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

async function saveAccessToken(newUser) {
  const accessToken = getAccessToken(newUser._id);

  console.log("=====> accessToken ", accessToken);

  newUser.accessToken = accessToken;
  await newUser.save();

  delete newUser.password;
  delete newUser.resetPasswordToken;
  delete newUser.resetPasswordExpires;
  return newUser;
}

router
  .post("/login", async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        // return next(new Error("Email does not exist"));
        return res.status(404).send({ status: "Email does not exist" });
      }

      const validPassword = await validatePassword(password, user.password);

      if (!validPassword) {
        // return next(new Error("Password is not correct"));
        return res.status(404).send({ status: "Password is not correct" });
      }

      if (!user.isActive) {
        return res.status(404).send({ status: "Your account is not Active" });
      }
      console.log("=====> ", user);

      //   const accessToken = getAccessToken(user._id);
      const updatedUser = await saveAccessToken(user);

      console.log("=====> ", updatedUser);

      //   return res.status(200).json({ ...user.toObject(), accessToken });
      return res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  })
  .post("/signup", async (req, res, next) => {
    try {
      const {
        firstName,
        lastName,
        email,
        password,

        acceptTerms,
        brandPersonality,
        industry,
        targetAudience,
        type,
        valueProposition,
      } = req.body;

      console.log(req.body);

      const hashedPassword = await hashPassword(password);
      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        isActive: true,
      });

      const profile = new UserProfile({
        createdBy: newUser._id,
        name: `${firstName} ${lastName}`,
        brandPersonality,
        industry,
        targetAudience,
        type,
        valueProposition,
      });

      const user = await saveAccessToken(newUser);

      return res.status(200).json({ ...user.toObject(), profile });
    } catch (err) {
      console.log(err);
      next(err);
    }
  })
  .post("/logout", async (req, res) => {
    const { userId, token } = req.body;
    console.log("=====> ", userId, token);
    // log user login
    await UserLogin.findOneAndUpdate(
      {
        userId,
        token,
      },
      {
        logoutAt: new Date(),
      }
    );

    res.status(200).send("success");
  });

module.exports = router;
