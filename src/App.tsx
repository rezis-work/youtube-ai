import { useEffect, useState } from "react";
import {
  createConversation,
  loadMessages,
  SaveMessage,
} from "./services/chatService";
import { getAIResponse } from "./services/AiService";

interface Message {
  id?: string;
  message: string;
  role: "user" | "AI";
  user_id: string;
  created_at?: string;
  conversation_id: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [conversation_id, setConsversationsId] = useState<string | null>(null);

  useEffect(() => {
    initialConversation();
  }, []);

  const initialConversation = async () => {
    let storedConversationId = localStorage.getItem("conversationId");
    if (!storedConversationId) {
      storedConversationId = await createConversation("guest");
      if (storedConversationId) {
        localStorage.setItem("conversationId", storedConversationId);
      }
    }

    console.log("storedConversationId", storedConversationId);

    setConsversationsId(storedConversationId);

    if (storedConversationId) {
      const history = await loadMessages(storedConversationId);
      setMessages(history);
    }
  };

  const sendMessage = async () => {
    if (!input || !conversation_id) {
      console.error("Missing input or conversationId:", {
        input,
        conversation_id,
      });
      return;
    }

    try {
      const userMessage = {
        conversation_id: conversation_id,
        user_id: "1",
        role: "user" as const,
        message: input,
      };

      console.log("Sending user message:", userMessage);
      await SaveMessage(userMessage);
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      const aiResponse = await getAIResponse(input);
      const aiMessage = {
        conversation_id: conversation_id,
        user_id: "1",
        role: "AI" as const,
        message: aiResponse,
      };

      console.log("Sending AI message:", aiMessage);
      await SaveMessage(aiMessage);
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Error in sendMessage:", err);
      // Handle error appropriately
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold text-gray-800">AI Chatbot</h1>
      <div className="mt-4">
        {messages.map((message, index) => (
          <div key={index} className="mb-2 p-2 rounded-lg">
            <strong className="text-gray-700">
              {message.role === "user" ? "You" : "AI"}:
            </strong>
            <p className="text-gray-600">{message.message}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
        <button
          onClick={sendMessage}
          className="mt-2 w-full p-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
