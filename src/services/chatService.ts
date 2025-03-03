import { supabase } from "./supabaseClient";

interface Message {
  id?: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "AI";
  message: string;
  created_at?: string;
}

export const loadMessages = async () => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) console.error("Error loading messages:", error);

  return data;
};

export const SaveMessage = async (message: Message) => {
  const { error } = await supabase.from("messages").insert([message]);
  if (error) console.error("Error saving message:", error);
};

export const createConversation = async (user_id: string) => {
  const { data, error } = await supabase
    .from("conversation")
    .insert([{ user_id }])
    .select("id")
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    return null;
  }

  return data.id;
};
