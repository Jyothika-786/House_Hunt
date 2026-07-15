import React from 'react';
import { Home, Sparkles, User, Briefcase, Key, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onOpenAIChat: () => void;
  onOpenAddListing: () => void;
  isAiOpen: boolean;
}

export default function Navbar({
  currentRole,
  onChangeRole,
  onOpenAIChat,
  onOpenAddListing,
  isAiOpen
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm transition-transform hover:scale-105">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-sans text-xl font-bold tracking-tight text-gray-900">
              House<span className="text-gray-500 font-medium">Hunt</span>
            </h1>
            <p className="font-mono text-[10px] leading-none text-gray-400">All-in-One Real Estate Portal</p>
          </div>
        </div>

        {/* Action Controls & Persona Selector */}
        <div className="flex items-center gap-4">
          {/* Persona Selection Bar */}
          <div className="hidden md:flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => onChangeRole('renter')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-sans text-xs font-medium transition-all ${
                currentRole === 'renter'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Renter / Buyer
            </button>
            <button
              onClick={() => onChangeRole('landlord')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-sans text-xs font-medium transition-all ${
                currentRole === 'landlord'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Key className="h-3.5 w-3.5" />
              Landlord / Seller
            </button>
            <button
              onClick={() => onChangeRole('agent')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-sans text-xs font-medium transition-all ${
                currentRole === 'agent'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Agent / Broker
            </button>
          </div>

          {/* Mobile Persona Select */}
          <div className="md:hidden flex items-center">
            <select
              value={currentRole}
              onChange={(e) => onChangeRole(e.target.value as UserRole)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 font-sans text-xs font-medium text-gray-700 focus:outline-none"
            >
              <option value="renter">Renter View</option>
              <option value="landlord">Landlord View</option>
              <option value="agent">Agent View</option>
            </select>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2">
            {(currentRole === 'landlord' || currentRole === 'agent') && (
              <button
                onClick={onOpenAddListing}
                className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-2 font-sans text-xs font-semibold text-white shadow-sm hover:bg-gray-800 transition-all active:scale-95"
              >
                + List Property
              </button>
            )}

            <button
              onClick={onOpenAIChat}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 font-sans text-xs font-semibold transition-all ${
                isAiOpen
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              AI Advisor
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
