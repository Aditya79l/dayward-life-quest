import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import Journey from "./journey";
export default async function JourneyPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  return <><form className="journey-signout" action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><button>Sign out</button></form><Journey /></>;
}

