import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

export async function POST(request) {
  try {
    await connectDB();
    const { email, password } = await request.json();
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });

    return NextResponse.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
