import { RoadmapScreen } from "@/components/vocab/roadmap-screen";
import { getCourses } from "@/lib/vocab/service";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Lộ trình học Từ vựng • LUYENTU",
  description: "Bản đồ lộ trình học từ vựng tiếng Anh theo phương pháp Spaced Repetition",
};

export default async function VocabCoursesPage() {
  const user = await getCurrentUser();
  const initialCourses = await getCourses(user);
  
  return <RoadmapScreen initialCourses={initialCourses} />;
}
