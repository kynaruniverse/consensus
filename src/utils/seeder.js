import { supabase } from '../lib/supabase';

const seedQuestions = [
  { question: "Is a hotdog a sandwich?", options: ["Yes", "No"] },
  { question: "Milk first, or Cereal first?", options: ["Milk", "Cereal"] },
  { question: "Does pineapple belong on pizza?", options: ["Absolutely", "Criminal"] },
  { question: "Who is the GOAT?", options: ["Messi", "Ronaldo", "LeBron", "Jordan"] },
  { question: "Is water wet?", options: ["Yes", "No"] }
];

export const seedDatabase = async () => {
  const { data, error } = await supabase
    .from('polls')
    .insert(seedQuestions);
  
  if (error) console.error("Seeding failed:", error);
  else console.log("Seeding successful:", data);
};
