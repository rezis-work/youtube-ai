import { useEffect, useState } from "react";
import {
  createConversation,
  loadMessages,
  SaveMessage,
} from "./services/chatService";
import { getUser, signInWithGoogle, signOut } from "./services/authService";
import { getAIResponse } from "./services/AiService";
import { User } from "@supabase/supabase-js";
import { supabase } from "./services/supabaseClient";
import { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

interface Message {
  id?: string;
  message: string;
  role: "user" | "AI";
  user_id: string;
  created_at?: string;
  conversation_id: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [input, setInput] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (user) {
      startOrLoadConversation(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (conversationId) {
      subscribeToMessages(conversationId);
    }
  }, [conversationId]);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setMessages([]);
  };

  const initAuth = async () => {
    const userData = await getUser();
    setUser(userData);
  };

  const startOrLoadConversation = async (userId: string) => {
    try {
      const storedConversationId = localStorage.getItem("conversationId");

      let newConversationId = null;

      if (!storedConversationId) {
        newConversationId = await createConversation(userId);
        if (newConversationId) {
          localStorage.setItem("conversationId", newConversationId);
          setConversationId(newConversationId);
        } else {
          return;
        }
      } else {
        setConversationId(storedConversationId);
      }

      const conversationIdToUse = storedConversationId || newConversationId;
      if (conversationIdToUse) {
        const history = await loadMessages(conversationIdToUse);
        if (history) {
          setMessages(history);
        }
      }
    } catch (err) {
      console.error("Error in startOrLoadConversation:", err);
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const subscription = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (
          payload: RealtimePostgresInsertPayload<{ conversation_id: string }>
        ) => {
          const newMessage = payload.new as Message;
          if (newMessage.conversation_id === conversationId) {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const sendMessage = async () => {
    if (!input || !user || !conversationId) {
      return;
    }
    try {
      const userMessage: Message = {
        conversation_id: conversationId!,
        user_id: user.id,
        role: "user",
        message: input,
      };

      await SaveMessage(userMessage);
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput("");

      const aiResponse = await getAIResponse(input);
      const aiMessage: Message = {
        conversation_id: conversationId!,
        user_id: user.id!,
        role: "AI",
        message: aiResponse,
      };

      await SaveMessage(aiMessage);
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Error in sendMessage:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md py-3 px-6 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">AI Chatbot 🤖</h1>
        <div>
          {!user ? (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              onClick={signInWithGoogle}
            >
              Login with Google
            </button>
          ) : (
            <div className="flex items-center space-x-4">
              <p className="text-gray-700">Welcome, {user.email}</p>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
                onClick={handleSignOut}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Chat Container */}
      <div className="flex-grow flex flex-col justify-end p-4">
        <div className="h-[75vh] overflow-y-auto border bg-white shadow-sm rounded-lg p-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-2 p-2 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-500 text-white text-right"
                  : "bg-gray-300 text-black text-left"
              }`}
            >
              <strong>{message.role === "user" ? "You" : "AI"}:</strong>
              <p>{message.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <div className="bg-white border-t p-4 flex items-center space-x-2 shadow-md">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && user) {
              sendMessage();
            }
          }}
          className="flex-grow p-2 border border-gray-300 rounded-md"
          disabled={!user}
        />
        <button
          onClick={user ? sendMessage : signInWithGoogle}
          className={`p-2 w-32 font-bold rounded-md ${
            user
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          {user ? "Send" : "Log in"}
        </button>
      </div>
    </div>
  );
}

export default App;
