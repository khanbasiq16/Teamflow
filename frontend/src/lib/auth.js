import jwt from "jsonwebtoken";
import { connectDB } from "./db";
import User from "./models/User";

export async function getAuthUser(request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization) return null;
    const token = authorization.split(" ")[1];
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await connectDB();
    return await User.findById(decoded.id).select("-password");
  } catch {
    return null;
  }
}
