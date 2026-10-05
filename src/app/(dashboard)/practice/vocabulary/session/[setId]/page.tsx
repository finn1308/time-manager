import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { VocabFlashcardSession } from "../_components/vocab-flashcard-session";

export const metadata: Metadata = {
  title: "Flashcard Session | Practice",
  description: "Vocabulary flashcard practice session",
};

export default async function VocabSessionPage({ params }: { params: { setId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const wordSet = await db.wordSet.findUnique({
    where: { id: params.setId },
    include: {
      course: true,
      words: {
        orderBy: { order: "asc" }
      }
    }
  });

  if (!wordSet) redirect("/practice/vocabulary");

  // Fetch progress for this set
  const progresses = await db.userWordProgress.findMany({
    where: {
      userId: user.id,
      wordSetId: wordSet.id,
    }
  });

  // Prepare words payload
  const wordsPayload = wordSet.words.map(word => {
    const progress = progresses.find(p => p.wordId === word.id);
    return {
      id: word.id,
      term: word.term,
      phonetic: word.phonetic,
      meaning: word.meaning,
      partOfSpeech: word.partOfSpeech,
      exampleSentence: word.exampleSentence,
      status: progress?.status || "NEW",
    };
  });

  // Tìm Subject được gắn với WordSet hoặc Course
  const subjectId = wordSet.subjectId || wordSet.course.subjectId || null;

  return (
    <VocabFlashcardSession 
      wordSetId={wordSet.id}
      wordSetTitle={wordSet.title}
      courseTitle={wordSet.course.title}
      words={wordsPayload}
      subjectId={subjectId}
    />
  );
}
