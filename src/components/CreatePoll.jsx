import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Plus, Send, X } from "lucide-react";

export default function CreatePoll({ onCreated }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => {
    if (options.length < 4) setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length > 2)
      setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question || options.some((opt) => !opt)) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("polls").insert([{ question, options }]);

    if (!error) {
      setQuestion("");
      setOptions(["", ""]);
      onCreated();
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <input
        type="text"
        placeholder="Ask the world a question..."
        className="input-field w-full text-lg font-bold"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        required
      />

      <div className="grid grid-cols-1 gap-2">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              placeholder={`Option ${i + 1}`}
              className="input-field flex-1 text-sm"
              value={opt}
              onChange={(e) => {
                const newOpts = [...options];
                newOpts[i] = e.target.value;
                setOptions(newOpts);
              }}
              required
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={addOption}
          disabled={options.length >= 4}
          className="text-xs font-black uppercase tracking-widest text-sky-400 disabled:opacity-30 flex items-center gap-1 transition-opacity"
        >
          <Plus size={14} /> Add Option
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex items-center gap-2 py-2 px-8"
        >
          <Send size={16} /> {isSubmitting ? "Posting..." : "Spit Fact"}
        </button>
      </div>
    </form>
  );
}