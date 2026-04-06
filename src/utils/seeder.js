import { supabase } from '../lib/supabase';

const seedQuestions = [
  { question: "Is a hotdog a sandwich?", options: ["Yes", "No"] },
  { question: "Milk first, or Cereal first?", options: ["Milk", "Cereal"] },
  { question: "Does pineapple belong on pizza?", options: ["Absolutely", "Criminal"] },
  { question: "Who is the GOAT?", options: ["Messi", "Ronaldo", "LeBron", "Jordan"] },
  { question: "Is water wet?", options: ["Yes", "No"] },
  { question: "Best coding font?", options: ["JetBrains Mono", "Fira Code", "MonoLisa", "Comic Sans"] },
  { question: "Work from Home or Office?", options: ["WFH Forever", "Office Vibes", "Hybrid"] },
  { question: "PC or Console?", options: ["PC Master Race", "Console King"] },
  { question: "Dark Mode or Light Mode?", options: ["Dark Mode", "I'm a Psycho (Light)"] },
  { question: "Should AI have rights?", options: ["Yes", "No", "Only Gemini"] }
];

export const seedDatabase = async () => {
  console.log("🚀 Starting seed...");
  
  const { data, error } = await supabase
    .from('polls')
    .insert(seedQuestions);
  
  if (error) {
    console.error("❌ Seeding failed:", error.message);
  } else {
    console.log("✅ Seeding successful! 10 questions added.");
    alert("Database Seeded! Refresh the app.");
  }
};
