import { Document, Schema, model } from "mongoose";

interface IUser {
  avatar: string;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  password: string;
  role: string;
  resetPasswordToken: string;
  resetPasswordExpire: Date;
  accessToken: string;
  isActive: boolean;

  linkedinId: string;
  tokens: {
    auth: {
      access_token: string;
      expires_in: number;
      scope: string;
    };
    management: {
      access_token: string;
      expires_in: number;
      refresh_token: string;
      refresh_token_expires_in: number;
      scope: string;
    };
  };

  onboarding: object;
}

export interface IUserDoc extends IUser, Document {
  mathPassword: (pass: string) => Promise<boolean>;
}

const userSchema = new Schema<IUserDoc>(
  {
    avatar: { type: String, required: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: false, unique: false },
    email: { type: String, required: false, unique: true },
    password: { type: String, required: false },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    resetPasswordToken: { type: String, required: false },
    resetPasswordExpire: { type: Date, required: false },
    accessToken: { type: String, required: false },
    isActive: { type: Boolean, default: true },

    linkedinId: { type: String, required: false },
    tokens: {
      auth: {
        access_token: { type: String },
        expires_in: { type: Number },
        scope: { type: String },
      },
      management: {
        access_token: { type: String },
        expires_in: { type: Number },
        refresh_token: { type: String },
        refresh_token_expires_in: { type: Number },
        scope: { type: String },
      },
    },

    onboarding: { type: Object, default: {} },
  },
  { timestamps: true }
);

// Match user entered password to hashed password in database
userSchema.methods.mathPassword = async function (enteredPassword: string) {
  return Bun.password.verifySync(enteredPassword, this.password);
};

// Hash password with Bun
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  // use bcrypt
  this.password = await Bun.password.hash(this.password, {
    algorithm: "bcrypt",
    cost: 4, // number between 4-31
  });
});

const User = model("User", userSchema);
export default User;
