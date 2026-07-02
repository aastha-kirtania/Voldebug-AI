import { auth } from "@web/lib/auth";
import { redirect } from "next/navigation";

// Smart redirect: goes to the user's role-specific dashboard by default.
export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role === "TEACHER") {
    redirect("/dashboard/teacher");
  } else if (role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  redirect("/dashboard/student");
}