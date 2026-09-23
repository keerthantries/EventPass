/**
 * Seed script — creates demo data for local development / smoke testing.
 * Idempotent: skips users that already exist; wipes + recreates the demo event's
 * event-scoped data (event, config, categories, guests) each run.
 *
 * Run:  npm run seed   (after setting MONGO_URI in .env)
 */
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { env } from "../src/config/env";
import { logger } from "../src/utils/logger";
import { User } from "../src/models/User";
import { Event } from "../src/models/Event";
import { EventConfig } from "../src/models/EventConfig";
import { Category } from "../src/models/Category";
import { Guest } from "../src/models/Guest";
import { FormSchema } from "../src/models/FormSchema";
import { generateInvitationToken, generateQrToken } from "../src/utils/tokens";
import { generateQrImage } from "../src/utils/qr";

const SUPER_ADMIN = {
  name: "Platform Admin",
  email: "admin@eventpass.dev",
  password: "admin12345",
  role: "super_admin" as const,
};
const ORGANIZER = {
  name: "Sarah Miller",
  email: "sarah@eventpass.dev",
  password: "organizer123",
  role: "organizer" as const,
};
const SECURITY = {
  name: "Gate Staff 1",
  email: "gate1@eventpass.dev",
  password: "security123",
  role: "security" as const,
};

async function seed() {
  await mongoose.connect(env.mongoUri);

  const saltRounds = env.bcryptSaltRounds;

  // --- Users ----------------------------------------------------------------
  const upsertUser = async (
    u: {
      name: string;
      email: string;
      password: string;
      role: "super_admin" | "organizer" | "security";
    },
    organizerId?: string,
  ) => {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      logger.info(`User exists, skipping: ${u.email}`);
      return existing;
    }
    const hash = await bcrypt.hash(u.password, saltRounds);
    const created = await User.create({
      name: u.name,
      email: u.email,
      password: hash,
      role: u.role,
      organizerId: organizerId ?? null,
    });
    logger.info(`Created user: ${u.email} (${u.role})`);
    return created;
  };

  const superAdmin = await upsertUser(SUPER_ADMIN);
  const organizer = await upsertUser(ORGANIZER);
  const security = await upsertUser(SECURITY, organizer.id);

  // --- Demo event (wipe event-scoped data for a clean slate) ---------------
  const demoEvent = await Event.findOne({
    name: "Miller & Johnson Wedding",
    organizerId: organizer._id,
  });
  if (demoEvent) {
    await Guest.deleteMany({ eventId: demoEvent._id });
    await FormSchema.deleteOne({ eventId: demoEvent._id });
    await EventConfig.deleteOne({ eventId: demoEvent._id });
    await Category.deleteMany({ eventId: demoEvent._id });
    await Event.deleteOne({ _id: demoEvent._id });
    logger.info("Removed previous demo event data.");
  }

  const event = await Event.create({
    organizerId: organizer._id,
    name: "Wedding of Ikram Halane & Nebil Yusuf",
    description: "Celebrating the marriage of Ikram Halane and Nebil Yusuf.",
    type: "wedding",
    venue: "Woodbine Banquet Hall",
    venueAddress: "30 Vice Regent Blvd, Etobicoke, ON M9W 7A4",
    mapLink: "https://maps.google.com/?q=Woodbine+Banquet+Hall",
    startDate: new Date("2026-10-18T00:00:00Z"),
    endDate: new Date("2026-10-18T00:00:00Z"),
    startTime: "17:00",
    endTime: "23:00",
    timezone: "America/Toronto",
    brideName: "Ikram Halane",
    groomName: "Nebil Yusuf",
    dressCode: "Traditional Clothing / Black Tie",
    weddingWebsiteUrl: "https://withjoy.com/ikramhalane-and-nebilyusuf",
    branding: { primaryColor: "#c59b27", secondaryColor: "#1a1a2e" },
    status: "published",
  });

  const config = await EventConfig.create({
    eventId: event._id,
    modules: {
      invitation: true,
      rsvp: true,
      dynamicForm: true,
      qrCheckin: true,
      csvImport: true,
      reports: true,
    },
    rsvpMode: "accept_decline_maybe",
    rsvpMessages: {
      confirmation: "Thank you for confirming!",
      thankYou: "See you at the wedding!",
    },
    workflow: "invite_rsvp_form_qr",
    qrGenerationTiming: "on_rsvp_accept",
    requiresApproval: false,
  });

  const form = await FormSchema.create({
    eventId: event._id,
    fields: [
      {
        key: "meal_preference",
        label: "Meal Preference",
        type: "dropdown",
        required: true,
        options: ["Vegetarian", "Non-Vegetarian", "Vegan"],
      },
      {
        key: "guests_count",
        label: "Number of Guests",
        type: "number",
        required: true,
        defaultValue: 1,
      },
      {
        key: "accommodation",
        label: "Accommodation Required?",
        type: "yes_no",
        required: false,
      },
    ],
  });

  // --- Categories ------------------------------------------------------------
  const categories = await Category.insertMany([
    { eventId: event._id, name: "Bride Family", colorTag: "#EC4899" },
    { eventId: event._id, name: "Groom Family", colorTag: "#8B5CF6" },
    { eventId: event._id, name: "Friends", colorTag: "#10B981" },
    { eventId: event._id, name: "VIP", colorTag: "#F59E0B" },
  ]);
  const cat = (name: string) => categories.find((c) => c.name === name)!;

  // --- Guests ----------------------------------------------------------------
  const guestSeeds = [
    {
      fullName: "Anita Patel",
      email: "anita@example.com",
      phone: "+13105550001",
      category: "Bride Family",
      notes: "Childhood friend of Sarah",
    },
    {
      fullName: "James Johnson",
      email: "james.johnson@example.com",
      phone: "+13105550002",
      category: "Groom Family",
      notes: "Brother of groom",
    },
    {
      fullName: "Kavya Iyer",
      email: "kavya@example.com",
      phone: "+13105550003",
      category: "Friends",
      notes: "",
    },
    {
      fullName: "Michael Chen",
      email: "michael@example.com",
      phone: "+13105550004",
      category: "VIP",
      notes: "Groom’s boss",
    },
    {
      fullName: "Sneha Kulkarni",
      email: "sneha@example.com",
      phone: "+13105550005",
      category: "Bride Family",
      notes: "",
    },
    {
      fullName: "David Rodriguez",
      email: "david@example.com",
      phone: "+13105550006",
      category: "Friends",
      notes: "College roommate",
    },
  ];

  for (let i = 0; i < guestSeeds.length; i++) {
    const g = guestSeeds[i];
    const qrToken = generateQrToken();
    await generateQrImage(qrToken);
    await Guest.create({
      eventId: event._id,
      categoryId: cat(g.category)._id,
      fullName: g.fullName,
      email: g.email,
      phone: g.phone,
      notes: g.notes,
      invitationToken: generateInvitationToken(),
      invitationStatus: "sent",
      rsvpStatus: i < 4 ? "accepted" : i === 4 ? "declined" : "pending",
      rsvpRespondedAt: i < 5 ? new Date() : undefined,
      approvalStatus: "not_required",
      qrToken,
      qrGeneratedAt: new Date(),
      attendanceStatus: i < 2 ? "present" : "absent",
      checkInTime: i < 2 ? new Date() : undefined,
    });
  }

  logger.info("Demo event created.");
  logger.info(`  event id:        ${event.id}`);
  logger.info(`  config id:       ${config.id}`);
  logger.info(`  form schema id:  ${form.id}`);
  logger.info("Accounts:");
  logger.info(`  super_admin  ${SUPER_ADMIN.email} / ${SUPER_ADMIN.password}`);
  logger.info(`  organizer    ${ORGANIZER.email} / ${ORGANIZER.password}`);
  logger.info(`  security     ${SECURITY.email} / ${SECURITY.password}`);
  logger.info(
    "Invitation (public) links are on each guest's record under invitationToken.",
  );

  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
