import { VocabUnifiedWorkspace } from "@/components/vocab/vocab-unified-workspace";
import { getCourses } from "@/lib/vocab/service";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Luyện Từ Vựng (Vocabulary) • Practice Hub",
  description: "Hệ thống luyện từ vựng tiếng Anh tích hợp phương pháp Spaced Repetition trong Practice Hub",
};

export default async function PracticeVocabularyPage() {
  const user = await getCurrentUser();
  const initialCourses = await getCourses(user);

  return (
    <VocabUnifiedWorkspace
      defaultStep={1}
      initialCourses={initialCourses}
      initialCourseSlug="ielts-vocabulary"
    />
  );
}
