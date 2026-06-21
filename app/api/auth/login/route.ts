import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { SESSION_COOKIE, signToken } from "@/lib/auth";
import User from "@/models/User";
import { logActivity } from "@/services/activity.service";

export async function POST(req: Request) {
  try {
    await connectDB(); const input = loginSchema.parse(await req.json());
    const user = await User.findOne({ email: input.email.toLowerCase(), active: true }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    const session = { id: String(user._id), name: user.name, email: user.email, role: user.role };
    const response = NextResponse.json({ user: session });
    response.cookies.set(SESSION_COOKIE, await signToken(session), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 8, path: "/" });
    user.lastLoginAt = new Date(); await user.save(); await logActivity({ actor: session.id, action: "login", request: req });
    return response;
  } catch (error) { return apiError(error); }
}
