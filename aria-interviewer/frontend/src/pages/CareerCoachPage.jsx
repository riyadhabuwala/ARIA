import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendChatMessage, triggerDebrief } from "../api/coachApi";

// Context shortcuts for quick prompts
const CONTEXT_SHORTCUTS = [
  { text: "Review my last interview", icon: "📊" },
  { text: "Build me a study plan", icon: "📚" },
  { text: "What jobs match my resume?", icon: "💼" },
  { text: "Help me with system design", icon: "🏗️" }
];

const WELCOME_MESSAGE = {
  id: Date.now(),
  role: "assistant",
  content: "Hi! I'm your ARIA Career Coach. I can analyze your interview performance, help with job searches, and create personalized study plans. How can I assist you today?",
  timestamp: new Date()
};

export default function CareerCoachPage() {
  const { user } = useAuth();
  const location = useLocation();
  const abortRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Conversation management
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [currentMessages, setCurrentMessages] = useState([WELCOME_MESSAGE]);

  // UI state
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, scrollToBottom]);

  // Handle debrief mode from interview completion
  useEffect(() => {
    const debriefData = location.state?.debrief;
    if (debriefData && user?.id) {
      handleDebrief(debriefData.report, debriefData.confidenceData, debriefData.previousScore);
    }
  }, [location.state, user?.id]);

  // Create a new conversation
  const createNewConversation = useCallback(() => {
    const newConversation = {
      id: Date.now(),
      title: "New Chat",
      messages: [WELCOME_MESSAGE],
      createdAt: new Date(),
      lastMessagePreview: "New conversation started"
    };

    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setCurrentMessages([WELCOME_MESSAGE]);
  }, []);

  // Load a conversation
  const loadConversation = useCallback((conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setActiveConversationId(conversationId);
      setCurrentMessages(conversation.messages);
    }
  }, [conversations]);

  // Update current conversation in the list
  const updateCurrentConversation = useCallback((newMessages) => {
    if (!activeConversationId) return;

    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        const lastUserMessage = newMessages.filter(m => m.role === 'user').pop();
        return {
          ...conv,
          messages: newMessages,
          title: lastUserMessage?.content.slice(0, 50) + (lastUserMessage?.content.length > 50 ? '...' : '') || conv.title,
          lastMessagePreview: newMessages[newMessages.length - 1]?.content.slice(0, 100) || "No messages"
        };
      }
      return conv;
    }));
  }, [activeConversationId]);

  // Handle debrief from interview completion
  const handleDebrief = useCallback(async (report, confidenceData, previousScore = 0) => {
    if (!report || !user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Create new conversation for debrief
      const debriefConversation = {
        id: Date.now(),
        title: "Interview Debrief",
        messages: [{ ...WELCOME_MESSAGE, content: "" }],
        createdAt: new Date(),
        lastMessagePreview: "Interview debrief session"
      };

      setConversations(prev => [debriefConversation, ...prev]);
      setActiveConversationId(debriefConversation.id);
      setCurrentMessages([{ ...WELCOME_MESSAGE, content: "" }]);

      const data = await triggerDebrief(user.id, report, confidenceData, previousScore);
      const debriefMessage = data.debrief || "Great interview! How can I help you improve?";

      // Simulate typing effect
      const words = debriefMessage.split(" ");
      let revealed = "";

      for (let i = 0; i < words.length; i++) {
        revealed += `${i === 0 ? "" : " "}${words[i]}`;
        const updatedMessages = [{
          id: Date.now(),
          role: "assistant",
          content: revealed,
          timestamp: new Date()
        }];
        setCurrentMessages(updatedMessages);
        updateCurrentConversation(updatedMessages);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

    } catch (err) {
      console.error("Debrief error:", err);
      const fallbackMessage = [{
        id: Date.now(),
        role: "assistant",
        content: `You scored **${report?.overall_score || 0}/100** (${report?.grade || 'N/A'}). Want me to break down your performance or create a study plan?`,
        timestamp: new Date()
      }];
      setCurrentMessages(fallbackMessage);
      updateCurrentConversation(fallbackMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, updateCurrentConversation]);

  // Send a message with streaming
  const sendMessage = useCallback(async (messageText) => {
    const text = messageText.trim();
    if (!text || isLoading || !user?.id) return;

    setError(null);
    setIsLoading(true);

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: text,
      timestamp: new Date()
    };

    const assistantMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
      timestamp: new Date()
    };

    const newMessages = [...currentMessages, userMessage, assistantMessage];
    setCurrentMessages(newMessages);

    // Prepare conversation history for API (last 6 messages)
    const historyForBackend = currentMessages
      .filter(m => m.role === "user" || m.role === "assistant")
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await sendChatMessage(
        user.id,
        text,
        historyForBackend,
        controller.signal
      );

      if (!response.body) {
        throw new Error("Chat request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const line = event.split("\n").find(l => l.startsWith("data: "));
          if (!line) continue;

          const data = line.slice(6).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.content) {
              fullContent += parsed.content;
              const updatedMessages = [...newMessages];
              updatedMessages[updatedMessages.length - 1] = {
                ...assistantMessage,
                content: fullContent,
              };
              setCurrentMessages(updatedMessages);
              updateCurrentConversation(updatedMessages);
            }
          } catch (parseError) {
            // Ignore malformed SSE chunks
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Something went wrong. Please try again.");
        // Remove empty assistant message on error
        const messagesWithoutEmpty = newMessages.filter(m =>
          !(m.role === "assistant" && !m.content)
        );
        setCurrentMessages(messagesWithoutEmpty);
        updateCurrentConversation(messagesWithoutEmpty);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentMessages, isLoading, user?.id, updateCurrentConversation]);

  // Handle input submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage("");
    }
  }, [inputMessage, sendMessage]);

  // Handle shortcut click
  const handleShortcutClick = useCallback((shortcutText) => {
    setInputMessage(shortcutText);
    sendMessage(shortcutText);
  }, [sendMessage]);

  // Initialize with first conversation
  useEffect(() => {
    if (conversations.length === 0) {
      createNewConversation();
    }
  }, [conversations.length, createNewConversation]);

  // Format message timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format conversation date
  const formatDate = (date) => {
    const today = new Date();
    const messageDate = new Date(date);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return messageDate.toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Panel - Conversation History */}
      <div className="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Career Coach
          </h2>
          <button
            onClick={createNewConversation}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            + New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => loadConversation(conversation.id)}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                activeConversationId === conversation.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                  : ''
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate flex-1">
                  {conversation.title}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {formatDate(conversation.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {conversation.lastMessagePreview}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Active Chat */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            🤖 ARIA Career Coach
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your personal AI career advisor
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                <div className={`text-xs mt-1 ${
                  message.role === 'user'
                    ? 'text-blue-100'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          {/* Context Shortcuts */}
          <div className="mb-3 flex flex-wrap gap-2">
            {CONTEXT_SHORTCUTS.map((shortcut, index) => (
              <button
                key={index}
                onClick={() => handleShortcutClick(shortcut.text)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="mr-1.5">{shortcut.icon}</span>
                {shortcut.text}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about your career..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}