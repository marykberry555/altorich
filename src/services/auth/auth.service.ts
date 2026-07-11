import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { Errors, AppError } from "@/lib/errors";
import { hashPin, isValidPin, verifyPin } from "@/lib/auth/pin";
import { generateOtpCode, otpExpiresAt } from "@/lib/auth/otp";
import { getDeviceFingerprint } from "@/lib/auth/device";
import {
  deviceVerificationEmailHtml,
  pinRecoveryEmailHtml,
  registrationVerificationEmailHtml,
  sendAuthEmail,
  usernameRecoveryEmailHtml,
  welcomeEmailHtml
} from "@/services/auth/email.service";
import { getPublicEnv } from "@/lib/env";

type Client = SupabaseClient<Database>;
type OtpPurpose = Database["public"]["Enums"]["auth_otp_purpose"];

export class AuthService {
  constructor(private readonly supabase: Client) {}

  private internalPassword() {
    return randomBytes(32).toString("hex");
  }

  async createOtp(email: string, purpose: OtpPurpose, userId?: string) {
    const code = generateOtpCode();
    const { error } = await this.supabase.from("auth_otps").insert({
      email: email.toLowerCase(),
      code,
      purpose,
      user_id: userId ?? null,
      expires_at: otpExpiresAt(10)
    });
    if (error) throw error;
    return code;
  }

  async consumeOtp(email: string, code: string, purpose: OtpPurpose) {
    const { data, error } = await this.supabase
      .from("auth_otps")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("purpose", purpose)
      .eq("code", code)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new AppError("Invalid or expired verification code.", 400, "INVALID_OTP");

    await this.supabase.from("auth_otps").update({ consumed_at: new Date().toISOString() }).eq("id", data.id);
    return data;
  }

  async register(input: {
    fullName: string;
    username: string;
    email: string;
    phone: string;
    pin: string;
    referralCode?: string;
    preferredPackage: "starter" | "growth" | "premium" | "elite";
  }) {
    const username = input.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      throw new AppError("Username must be 3–24 characters (letters, numbers, underscore).", 400, "INVALID_USERNAME");
    }
    if (!isValidPin(input.pin)) throw new AppError("Pin must be exactly 6 digits.", 400, "INVALID_PIN");

    const email = input.email.trim().toLowerCase();
    const phone = input.phone.replace(/\s+/g, "").trim();
    if (phone.length < 10) throw new AppError("Enter a valid phone number.", 400, "INVALID_PHONE");

    const { data: existingUsername } = await this.supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    if (existingUsername) throw new AppError("Username is already taken.", 409, "USERNAME_TAKEN");

    const existingEmail = await this.findUserByEmail(email);
    if (existingEmail) throw new AppError("This email is already registered.", 409, "EMAIL_TAKEN");

    const { data: existingPhone } = await this.supabase.from("profiles").select("id").eq("phone", phone).maybeSingle();
    if (existingPhone) throw new AppError("This phone number is already registered.", 409, "PHONE_TAKEN");

    const password = this.internalPassword();
    const pinHash = hashPin(input.pin);

    const { data: created, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: input.fullName,
        phone,
        username,
        pin_hash: pinHash,
        referral_code: input.referralCode ?? null,
        preferred_package_slug: input.preferredPackage,
        must_change_pin: false
      }
    });
    if (error) {
      if (/already been registered|already exists|duplicate/i.test(error.message)) {
        throw new AppError("This email is already registered.", 409, "EMAIL_TAKEN");
      }
      throw error;
    }
    if (!created.user) throw Errors.internal();

    await this.supabase
      .from("profiles")
      .update({
        username,
        pin_hash: pinHash,
        phone,
        full_name: input.fullName.trim(),
        preferred_package_slug: input.preferredPackage
      })
      .eq("id", created.user.id);

    const otp = await this.createOtp(email, "register", created.user.id);

    const env = getPublicEnv();
    const magicToken = randomBytes(24).toString("hex");
    await this.supabase.from("auth_otps").insert({
      email,
      code: magicToken,
      purpose: "register",
      user_id: created.user.id,
      expires_at: otpExpiresAt(10)
    });

    const verifyLink = `${env.NEXT_PUBLIC_SITE_URL}/auth/verify?email=${encodeURIComponent(email)}&token=${magicToken}`;
    await sendAuthEmail({
      to: email,
      subject: "Verify your AltoRich account",
      html: registrationVerificationEmailHtml(otp, verifyLink)
    });

    return { userId: created.user.id, email };
  }

  private async sendWelcomeEmail(userId: string) {
    const { data: profile } = await this.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    const { data: authUser } = await this.supabase.auth.admin.getUserById(userId);
    const user = authUser.user;
    if (!user?.email) return;

    const metaName = user.user_metadata?.full_name;
    const firstName =
      profile?.full_name?.trim().split(/\s+/)[0] ??
      (typeof metaName === "string" ? metaName.trim().split(/\s+/)[0] : undefined) ??
      "Member";

    await sendAuthEmail({
      to: user.email,
      subject: "Welcome to AltoRich",
      html: welcomeEmailHtml(firstName)
    });
  }

  async verifyRegistrationOtp(email: string, code: string) {
    const otp = await this.consumeOtp(email, code, "register");
    if (!otp.user_id) throw Errors.notFound("User");

    await this.supabase.auth.admin.updateUserById(otp.user_id, { email_confirm: true });
    await this.supabase
      .from("profiles")
      .update({ email_verified_at: new Date().toISOString() })
      .eq("id", otp.user_id);

    await this.sendWelcomeEmail(otp.user_id);
    return this.createSessionForUser(otp.user_id);
  }

  async verifyMagicLink(email: string, token: string) {
    const { data, error } = await this.supabase
      .from("auth_otps")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code", token)
      .eq("purpose", "register")
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    if (!data?.user_id) throw new AppError("Invalid or expired verification link.", 400, "INVALID_LINK");

    await this.supabase.from("auth_otps").update({ consumed_at: new Date().toISOString() }).eq("id", data.id);
    await this.supabase.auth.admin.updateUserById(data.user_id, { email_confirm: true });
    await this.supabase
      .from("profiles")
      .update({ email_verified_at: new Date().toISOString() })
      .eq("id", data.user_id);

    await this.sendWelcomeEmail(data.user_id);
    return this.createSessionForUser(data.user_id);
  }

  async login(input: { username: string; pin: string; deviceFingerprint: string; userAgent: string }) {
    const username = input.username.trim().toLowerCase();
    const { data: profile, error } = await this.supabase
      .from("profiles")
      .select("id, pin_hash, must_change_pin, must_change_password, account_status")
      .eq("username", username)
      .maybeSingle();
    if (error) throw error;
    if (!profile?.pin_hash) throw new AppError("Invalid username or pin.", 401, "INVALID_CREDENTIALS");
    if (profile.account_status !== "active") {
      throw new AppError("This account is not available. Contact support.", 403, "ACCOUNT_SUSPENDED");
    }
    if (!verifyPin(input.pin, profile.pin_hash)) throw new AppError("Invalid username or pin.", 401, "INVALID_CREDENTIALS");

    const { data: authUser, error: authErr } = await this.supabase.auth.admin.getUserById(profile.id);
    if (authErr || !authUser.user?.email) throw Errors.internal();

    const skipDeviceOtp =
      process.env.NODE_ENV !== "production" &&
      (process.env.AUTH_SKIP_DEVICE_OTP === "true" ||
        process.env.NEXT_PUBLIC_SITE_URL?.includes("localhost") ||
        username === "demouser");

    if (!skipDeviceOtp) {
      const { data: trusted } = await this.supabase
        .from("trusted_devices")
        .select("id")
        .eq("user_id", profile.id)
        .eq("device_fingerprint", input.deviceFingerprint)
        .maybeSingle();

      if (!trusted) {
        const otp = await this.createOtp(authUser.user.email, "login_device", profile.id);
        await sendAuthEmail({
          to: authUser.user.email,
          subject: "Verify your device",
          html: deviceVerificationEmailHtml(otp)
        });
        if (process.env.NODE_ENV !== "production") {
           
          console.info(`[AltoRich dev] Device OTP for ${authUser.user.email}: ${otp}`);
        }
        return {
          requiresDeviceOtp: true as const,
          email: authUser.user.email,
          userId: profile.id,
          mustChangePin: profile.must_change_pin,
          mustChangePassword: profile.must_change_password
        };
      }

      await this.supabase
        .from("trusted_devices")
        .update({ last_seen_at: new Date().toISOString(), user_agent: input.userAgent })
        .eq("user_id", profile.id)
        .eq("device_fingerprint", input.deviceFingerprint);
    }

    const session = await this.createSessionForUser(profile.id);
    return {
      requiresDeviceOtp: false as const,
      ...session,
      mustChangePin: profile.must_change_pin,
      mustChangePassword: profile.must_change_password
    };
  }

  async verifyDeviceOtp(input: {
    email: string;
    code: string;
    deviceFingerprint: string;
    userAgent: string;
  }) {
    const otp = await this.consumeOtp(input.email, input.code, "login_device");
    if (!otp.user_id) throw Errors.notFound("User");

    await this.supabase.from("trusted_devices").upsert({
      user_id: otp.user_id,
      device_fingerprint: input.deviceFingerprint,
      user_agent: input.userAgent,
      last_seen_at: new Date().toISOString()
    });

    const { data: profile } = await this.supabase
      .from("profiles")
      .select("must_change_pin, must_change_password")
      .eq("id", otp.user_id)
      .maybeSingle();

    const session = await this.createSessionForUser(otp.user_id);
    return {
      ...session,
      mustChangePin: profile?.must_change_pin ?? false,
      mustChangePassword: profile?.must_change_password ?? false
    };
  }

  async emailPasswordLogin(input: { email: string; password: string }) {
    const { createClient } = await import("@/lib/supabase/server");
    const anon = await createClient();
    if (!anon) throw Errors.notConfigured();

    const { data, error } = await anon.auth.signInWithPassword({
      email: input.email.toLowerCase(),
      password: input.password
    });
    if (error) throw new AppError(error.message, 401, "INVALID_CREDENTIALS");
    if (!data.user || !data.session) throw Errors.unauthorized();

    const { data: profile } = await this.supabase
      .from("profiles")
      .select("must_change_password, must_change_pin, account_status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.account_status && profile.account_status !== "active") {
      throw new AppError("This account is not available. Contact support.", 403, "ACCOUNT_SUSPENDED");
    }

    return {
      session: data.session,
      userId: data.user.id,
      mustChangePassword: profile?.must_change_password ?? false,
      mustChangePin: profile?.must_change_pin ?? false
    };
  }

  /** @deprecated Use emailPasswordLogin + role-based redirect via /api/auth/sign-in */
  async adminLogin(input: { email: string; password: string }) {
    const result = await this.emailPasswordLogin(input);

    const { data: adminRole, error: adminError } = await this.supabase
      .from("admin_roles")
      .select("role")
      .eq("user_id", result.userId)
      .maybeSingle();
    if (adminError) throw adminError;
    if (!adminRole) throw Errors.forbidden();

    return {
      session: result.session,
      mustChangePassword: result.mustChangePassword
    };
  }

  private async findUserByEmail(email: string) {
    const normalized = email.toLowerCase();
    const { data, error } = await this.supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    return data.users.find((u) => u.email?.toLowerCase() === normalized) ?? null;
  }

  async requestPinRecovery(email: string) {
    const user = await this.findUserByEmail(email);
    if (!user) return { ok: true };

    const otp = await this.createOtp(email, "recover_pin", user.id);
    await sendAuthEmail({
      to: email,
      subject: "Reset your AltoRich pin",
      html: pinRecoveryEmailHtml(otp)
    });
    return { ok: true };
  }

  async resetPin(email: string, code: string, newPin: string) {
    if (!isValidPin(newPin)) throw new AppError("Pin must be exactly 6 digits.", 400, "INVALID_PIN");
    const otp = await this.consumeOtp(email, code, "recover_pin");
    if (!otp.user_id) throw Errors.notFound("User");

    const pinHash = hashPin(newPin);
    await this.supabase.from("profiles").update({ pin_hash: pinHash, must_change_pin: false }).eq("id", otp.user_id);
    return { ok: true };
  }

  async recoverUsername(email: string) {
    const user = await this.findUserByEmail(email);
    if (!user) return { ok: true };

    const { data: profile } = await this.supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
    if (profile?.username) {
      await sendAuthEmail({
        to: email,
        subject: "Your AltoRich username",
        html: usernameRecoveryEmailHtml(profile.username)
      });
    }
    return { ok: true };
  }

  async changePin(userId: string, currentPin: string, newPin: string) {
    if (!isValidPin(newPin)) throw new AppError("Pin must be exactly 6 digits.", 400, "INVALID_PIN");
    const { data: profile } = await this.supabase.from("profiles").select("pin_hash").eq("id", userId).maybeSingle();
    if (!profile?.pin_hash || !verifyPin(currentPin, profile.pin_hash)) {
      throw new AppError("Current pin is incorrect.", 400, "INVALID_PIN");
    }
    await this.supabase
      .from("profiles")
      .update({ pin_hash: hashPin(newPin), must_change_pin: false })
      .eq("id", userId);
    return { ok: true };
  }

  async setPin(userId: string, newPin: string) {
    if (!isValidPin(newPin)) throw new AppError("Pin must be exactly 6 digits.", 400, "INVALID_PIN");
    await this.supabase
      .from("profiles")
      .update({ pin_hash: hashPin(newPin), must_change_pin: false })
      .eq("id", userId);
    return { ok: true };
  }

  async changePassword(userId: string, newPassword: string) {
    if (newPassword.length < 8) throw new AppError("Password must be at least 8 characters.", 400, "WEAK_PASSWORD");
    const { error } = await this.supabase.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) throw error;
    await this.supabase.from("profiles").update({ must_change_password: false }).eq("id", userId);
    return { ok: true };
  }

  private async createSessionForUser(userId: string) {
    const { data: authUser, error } = await this.supabase.auth.admin.getUserById(userId);
    if (error || !authUser.user?.email) throw Errors.internal();

    const { data: linkData, error: linkErr } = await this.supabase.auth.admin.generateLink({
      type: "magiclink",
      email: authUser.user.email
    });
    if (linkErr || !linkData.properties?.hashed_token) throw linkErr ?? Errors.internal();

    const { data: sessionData, error: sessionErr } = await this.supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: linkData.properties.hashed_token
    });
    if (sessionErr || !sessionData.session) throw sessionErr ?? Errors.internal();

    return { session: sessionData.session, userId };
  }
}
