import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
  const { session, user } = useAuthStore();

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!user?.household_id) return <Redirect href="/(auth)/household" />;
  return <Redirect href="/(tabs)" />;
}
