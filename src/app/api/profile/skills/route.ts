
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

// Mock database insertion
const addSkillsToDatabase = async (userId: string, skills: string[]) => {
  console.log(`Adding skills for user ${userId}:`, skills);
  // In a real application, you would insert these into your database.
  // For this example, we'll just return them as if they were successfully added.
  return skills.map((skill, index) => ({
    skill_id: `${Date.now() + index}`,
    name: skill,
  }));
};

const addSkillsPayloadSchema = z.object({
  name: z.array(z.string().min(1, "Skill name cannot be empty")).min(1, "Skills array cannot be empty"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // In Next.js API routes, the `session` object contains user details.
  // This is the equivalent of `req.user` in an Express `requireAuth` middleware.
  console.log("--- User Session ---");
  console.log(session);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Logging the request body as requested
  console.log("--- Request Body ---");
  console.log(body);

  const validation = addSkillsPayloadSchema.safeParse(body);

  if (!validation.success) {
    console.error("--- Validation Error ---", validation.error.issues);
    // ALWAYS return a descriptive error message
    return NextResponse.json(
      {
        message: "Invalid request payload.",
        errors: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { name } = validation.data;

  try {
    // Here you would typically have your database logic
    const addedSkills = await addSkillsToDatabase(session.user.id, name);

    return NextResponse.json(
      {
        message: "Skills added successfully",
        skills: addedSkills,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("--- Server Error in addSkills ---", error);
    // In case of an unexpected server error
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
