import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, ArrowRight, User, Terminal, HelpCircle } from 'lucide-react';
import { Property, ChatMessage, UserRole } from '../types';

interface AIConsultantProps {
  propertyContext: Property | null;
  userRole: UserRole;
  onClose: () => void;
}

export default function AIConsultant({ propertyContext, userRole, onClose }: AIConsultantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'assistant',
      text: `Hello! I am your **HouseHunt Market Advisor**.\n\nI can help you analyze property investments, suggest lease negotiation terms, evaluate price metrics, or break down rental contracts.\n\n${
        propertyContext 
          ? `I see you are looking at **"${propertyContext.title}"** in **${propertyContext.city}**. Ask me anything about this listing specifically!`
          : `Select any property from the catalog or ask general market questions below.`
      }`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle send message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          propertyContext: propertyContext,
          history: messages.slice(-10) // Send recent message exchanges for conversational memory
        })
      });

      if (!response.ok) throw new Error('API server returned an error');
      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'assistant',
        text: data.text || "I apologize, but I could not formulate an answer right now.",
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          sender: 'assistant',
          text: "⚠️ Connection to AI Advisor timed out or failed. Please check that the server is online and try again.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Prompt Recommendations
  const getQuickPrompts = () => {
    if (propertyContext) {
      if (propertyContext.type === 'rent') {
        return [
          { label: "Negotiate rent discount", text: `What is a realistic negotiation strategy to lower the rent on "${propertyContext.title}"?` },
          { label: "Analyze price per sqft", text: `Can you analyze the rent price per sqft on "${propertyContext.title}" relative to ${propertyContext.city} averages?` },
          { label: "Draft a lease offer", text: `Help me draft a formal written message proposing an $150-a-month reduction for a 15-month term on "${propertyContext.title}".` }
        ];
      } else {
        return [
          { label: "Calculate cap rate / ROI", text: `What is the estimated cap rate, annual gross yield, and ROI on "${propertyContext.title}" if I purchase it as a rental property?` },
          { label: "Analyze purchase offer", text: `What would be a reasonable opening offer for "${propertyContext.title}" considering the current economic market?` },
          { label: "Tax & closing costs", text: `Explain what standard closing costs and real estate fees I should expect when buying "${propertyContext.title}".` }
        ];
      }
    } else {
      return [
        { label: "Is renting better than buying?", text: "Can you provide a comprehensive comparison of Renting vs Buying a home in the current economic landscape?" },
        { label: "What is a good Cap Rate?", text: "What cap rate percentage is generally considered a strong real estate investment yield?" },
        { label: "Lease termination guidelines", text: "What are the typical guidelines, grace periods, and legal penalties for early termination of a lease agreement?" }
      ];
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-50 flex h-[600px] w-full max-w-[420px] flex-col rounded-3xl border border-gray-100 bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-900 px-5 py-4 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
            <Sparkles className="h-4.5 w-4.5 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <h3 className="font-sans text-sm font-bold leading-tight">AI Housing Advisor</h3>
            <span className="font-mono text-[9px] text-gray-400 flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Gemini Powered • Interactive
            </span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Property Context Bar (If active) */}
      {propertyContext && (
        <div className="flex items-center gap-2 border-b border-gray-100 bg-amber-50/50 px-4 py-2 text-xs">
          <span className="font-sans font-bold text-amber-800">Context:</span>
          <p className="font-sans text-gray-700 truncate flex-1">
            {propertyContext.title} (${propertyContext.price.toLocaleString()})
          </p>
        </div>
      )}

      {/* Messages Timeline */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/40"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 border border-gray-200 text-gray-600 font-mono text-[10px]">
                AI
              </div>
            )}
            
            <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
              msg.sender === 'user'
                ? 'bg-gray-900 text-white font-medium rounded-tr-xs'
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-xs whitespace-pre-line'
            }`}>
              {msg.text}
              <span className={`block text-[9px] mt-1 text-right ${
                msg.sender === 'user' ? 'text-gray-300' : 'text-gray-400'
              }`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 border border-gray-200 text-gray-600 font-mono text-[10px]">
              AI
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-2.5 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompt Recommendation Bar */}
      <div className="border-t border-gray-100 px-4 py-2.5 bg-white shrink-0">
        <span className="block font-sans text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <HelpCircle className="h-3 w-3 text-gray-400" />
          Suggested Advisor Inquiries
        </span>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {getQuickPrompts().map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.text)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300 px-2.5 py-1.5 font-sans text-[10px] font-semibold text-gray-700 transition-colors"
            >
              {p.label}
              <ArrowRight className="h-2.5 w-2.5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="flex items-center gap-2 border-t border-gray-100 bg-white p-3.5 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about yields, leases, cap-rates..."
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3.5 font-sans text-xs text-gray-800 focus:border-gray-900 focus:bg-white focus:outline-none"
          required
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

    </div>
  );
}
