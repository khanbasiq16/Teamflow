import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

export async function POST(request) {
  try {
    await connectDB();
    const { name, email, password } = await request.json();
    if (!name || !email || !password)
      return NextResponse.json({ message: "All fields required" }, { status: 400 });

    const exists = await User.findOne({ email });
    if (exists)
      return NextResponse.json({ message: "Email already registered" }, { status: 400 });

    const user = await User.create({ name, email, password });
    return NextResponse.json(
      { _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
