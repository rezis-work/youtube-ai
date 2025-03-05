import { supabase } from "./supabaseClient";

interface Message {
  id?: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "AI";
  message: string;
  created_at?: string;
}

export const loadMessages = async (conversation_id: string) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversation_id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading messages:", error);
    return [];
  }

  return data;
};

export const SaveMessage = async (message: Message) => {
  try {
    // Validate the message object
    if (
      !message.conversation_id ||
      !message.user_id ||
      !message.role ||
      !message.message
    ) {
      console.error("Invalid message data:", message);
      throw new Error("Missing required message fields");
    }

    console.log("Saving message:", message);

    // First verify the conversation exists
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", message.conversation_id)
      .single();

    if (convError || !conversation) {
      console.error("Conversation not found:", message.conversation_id);
      throw new Error("Conversation not found");
    }

    const { error } = await supabase.from("messages").insert([
      {
        conversation_id: message.conversation_id,
        user_id: message.user_id,
        role: message.role,
        message: message.message,
      },
    ]);

    if (error) {
      console.error("Error saving message:", error);
      throw error;
    }
  } catch (err) {
    console.error("Unexpected error in SaveMessage:", err);
    throw err;
  }
};

export const createConversation = async (user_id: string) => {
  try {
    console.log("Creating conversation for user:", user_id);
    const { data, error } = await supabase
      .from("conversations")
      .insert([{ user_id }])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      return null;
    }

    if (!data || !data.id) {
      console.error("No conversation ID returned");
      return null;
    }

    console.log("Created conversation with ID:", data.id);
    return data.id;
  } catch (err) {
    console.error("Unexpected error in createConversation:", err);
    return null;
  }
};
