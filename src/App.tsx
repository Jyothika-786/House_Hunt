import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, DollarSign, Filter, Sparkles, SlidersHorizontal, 
  X, RefreshCw, Key, ShieldCheck, FileText, CheckCircle, Plus, Info, Home
} from 'lucide-react';
import Navbar from './components/Navbar';
import ListingCard from './components/ListingCard';
import ListingDetailModal from './components/ListingDetailModal';
import AIConsultant from './components/AIConsultant';
import AddListingModal from './components/AddListingModal';
import { Property, UserRole } from './types';

export default function App() {
  // Application Roles
  const [currentRole, setCurrentRole] = useState<UserRole>('renter');

  // Properties list loaded from server
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Property for extensive Modal view
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Layout Panels Toggles
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAddListingOpen, setIsAddListingOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'rent' | 'sale'>('all');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minBeds, setMinBeds] = useState('all');

  // Trigger loading properties from API
  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCity !== 'all') params.append('city', selectedCity);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (minBeds !== 'all') params.append('beds', minBeds);

      const response = await fetch(`/api/properties?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (err) {
      console.error("Error loading properties:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch properties on mount or filter change
  useEffect(() => {
    fetchProperties();
  }, [searchQuery, selectedCity, selectedType, maxPrice, minBeds]);

  // Handle adding a new property
  const handleAddProperty = (newProp: Property) => {
    setProperties((prev) => [newProp, ...prev]);
    // Optionally open the newly added property details immediately!
    setSelectedProperty(newProp);
  };

  // Handle updating a single property (e.g. negotiation/offer status changes)
  const handleUpdateProperty = (updatedProp: Property) => {
    setProperties((prev) => prev.map((p) => p.id === updatedProp.id ? updatedProp : p));
    if (selectedProperty && selectedProperty.id === updatedProp.id) {
      setSelectedProperty(updatedProp);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCity('all');
    setSelectedType('all');
    setMaxPrice('');
    setMinBeds('all');
  };

  // Derived landlord/agent statistics
  const landlordActiveListings = properties.filter(p => p.listedBy.role === 'landlord' || p.listedBy.role === 'agent').length;
  const pendingOffersCount = properties.reduce((acc, p) => acc + (p.negotiations?.filter(n => n.status === 'pending').length || 0), 0);
  const signedAgreementsCount = properties.reduce((acc, p) => acc + (p.paperwork?.filter(doc => doc.status === 'signed').length || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 text-gray-900">
      
      {/* Navigation Header */}
      <Navbar
        currentRole={currentRole}
        onChangeRole={(role) => setCurrentRole(role)}
        onOpenAIChat={() => setIsAiOpen(!isAiOpen)}
        onOpenAddListing={() => setIsAddListingOpen(true)}
        isAiOpen={isAiOpen}
      />

      {/* Role-Specific Welcomer & Notifications Bar */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl bg-white border border-gray-100 p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                currentRole === 'renter' 
                  ? 'bg-zinc-100 text-zinc-800' 
                  : currentRole === 'landlord'
                  ? 'bg-amber-50 text-amber-800 border border-amber-100'
                  : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
              }`}>
                {currentRole === 'renter' ? '✨ Renter Mode' : currentRole === 'landlord' ? '🔑 Landlord Dashboard' : '💼 Broker Workspace'}
              </span>
            </div>
            
            <h2 className="font-sans text-xl font-bold text-gray-900">
              {currentRole === 'renter' 
                ? "Find Your Next Home" 
                : currentRole === 'landlord'
                ? "Manage Your Rentals & Properties"
                : "Real Estate Broker Workspace"}
            </h2>
            <p className="font-sans text-xs text-gray-500">
              {currentRole === 'renter'
                ? "Browse verified rentals, take interactive 3D virtual tours, negotiate directly, and sign contracts."
                : currentRole === 'landlord'
                ? "Monitor rent payments, respond to tenant negotiations, issue leases, and review automated agreements."
                : "Track client leads, manage portfolio properties, generate custom contracts, and optimize client outreach."}
            </p>
          </div>

          {/* Stats Badges (Visible for providers/agents) */}
          {(currentRole === 'landlord' || currentRole === 'agent') ? (
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="flex-1 min-w-[100px] rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                <span className="block font-sans text-xs text-gray-400 font-semibold uppercase">Listings</span>
                <span className="font-mono text-lg font-black text-gray-900">{landlordActiveListings}</span>
              </div>
              <div className="flex-1 min-w-[100px] rounded-xl bg-amber-50/50 border border-amber-100 p-3 text-center">
                <span className="block font-sans text-xs text-amber-800 font-semibold uppercase">Pending Offers</span>
                <span className="font-mono text-lg font-black text-amber-900">{pendingOffersCount}</span>
              </div>
              <div className="flex-1 min-w-[100px] rounded-xl bg-emerald-50/50 border border-emerald-100 p-3 text-center">
                <span className="block font-sans text-xs text-emerald-800 font-semibold uppercase">Signed Leases</span>
                <span className="font-mono text-lg font-black text-emerald-900">{signedAgreementsCount}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5 flex items-start gap-2.5 max-w-sm">
              <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="font-sans text-[11px] leading-relaxed text-gray-500">
                <strong>Try Landlord or Agent view</strong> in the top switcher to test adding properties, receiving custom offers, and issuing legal agreements.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hero Search Capsule & Filters Grid */}
      <div className="mx-auto max-w-7xl px-4 mt-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gray-900 p-6 sm:p-8 text-white shadow-lg space-y-6">
          <div className="max-w-xl">
            <h2 className="font-sans text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              A Modern Digital Marketplace for Real Estate Transactions
            </h2>
            <p className="font-sans text-xs text-gray-400 mt-2">
              Transparent, secure, and hassle-free transactions. Connect directly, negotiate terms with confidence, and sign leases instantly.
            </p>
          </div>

          {/* Combined Search Capsule */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white rounded-2xl p-3 text-gray-900 shadow-sm">
            {/* Keyword Search */}
            <div className="md:col-span-4 relative flex items-center border-b md:border-b-0 md:border-r border-gray-100 pb-2 md:pb-0">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by keywords, tags, style..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent py-2 pl-9 pr-4 font-sans text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
              />
            </div>

            {/* City Selector */}
            <div className="md:col-span-2 relative flex items-center border-b md:border-b-0 md:border-r border-gray-100 pb-2 md:pb-0">
              <MapPin className="absolute left-3 h-4 w-4 text-gray-400" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-transparent py-2 pl-9 pr-4 font-sans text-xs text-gray-800 placeholder-gray-400 focus:outline-none appearance-none"
              >
                <option value="all">All Cities</option>
                <option value="New York">New York</option>
                <option value="Los Angeles">Los Angeles</option>
                <option value="Seattle">Seattle</option>
                <option value="Miami">Miami</option>
                <option value="Denver">Denver</option>
              </select>
            </div>

            {/* Rent vs Sale */}
            <div className="md:col-span-2 relative flex items-center border-b md:border-b-0 md:border-r border-gray-100 pb-2 md:pb-0">
              <SlidersHorizontal className="absolute left-3 h-4 w-4 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full bg-transparent py-2 pl-9 pr-4 font-sans text-xs text-gray-800 placeholder-gray-400 focus:outline-none appearance-none"
              >
                <option value="all">All listings</option>
                <option value="rent">For Rent</option>
                <option value="sale">For Sale</option>
              </select>
            </div>

            {/* Max Budget */}
            <div className="md:col-span-2 relative flex items-center border-b md:border-b-0 md:border-r border-gray-100 pb-2 md:pb-0">
              <DollarSign className="absolute left-3 h-4 w-4 text-gray-400" />
              <input
                type="number"
                placeholder="Max Budget"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-transparent py-2 pl-9 pr-4 font-sans text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
              />
            </div>

            {/* Beds Filter */}
            <div className="md:col-span-2 flex items-center justify-between">
              <select
                value={minBeds}
                onChange={(e) => setMinBeds(e.target.value)}
                className="w-full bg-transparent py-2 px-3 font-sans text-xs text-gray-800 focus:outline-none appearance-none"
              >
                <option value="all">Min Bedrooms</option>
                <option value="1">1+ Beds</option>
                <option value="2">2+ Beds</option>
                <option value="3">3+ Beds</option>
                <option value="4">4+ Beds</option>
              </select>

              {/* Reset button inside capsule */}
              {(searchQuery || selectedCity !== 'all' || selectedType !== 'all' || maxPrice || minBeds !== 'all') && (
                <button
                  onClick={handleResetFilters}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-900 transition-colors"
                  title="Reset all filters"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Listing Catalog */}
      <main className="mx-auto max-w-7xl px-4 mt-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-sans text-base font-bold text-gray-900 flex items-center gap-1.5">
            <Home className="h-4 w-4 text-gray-400" />
            Verified Properties Catalog ({properties.length})
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchProperties}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-900 shadow-3xs"
              title="Refresh listings"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
                <div className="aspect-video w-full rounded-xl bg-gray-100" />
                <div className="h-4 w-1/3 bg-gray-100 rounded" />
                <div className="h-5 w-2/3 bg-gray-100 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center max-w-lg mx-auto mt-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h4 className="font-sans text-base font-bold text-gray-900">No properties found</h4>
            <p className="font-sans text-xs text-gray-500 mt-1 mb-6">
              We couldn't find any listings matching your specific filter parameters. Try adjusting or resetting your budget, city, or search terms.
            </p>
            <button
              onClick={handleResetFilters}
              className="rounded-xl bg-gray-900 px-4 py-2 font-sans text-xs font-semibold text-white hover:bg-gray-800 transition-colors shadow-sm"
            >
              Reset Search Parameters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <ListingCard
                key={property.id}
                property={property}
                userRole={currentRole}
                onSelect={(prop) => {
                  setSelectedProperty(prop);
                  // Contextually notify the AI Advisor when a property is viewed!
                  if (isAiOpen) {
                    // Let the AI have immediate focus on the active selection
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Sparkle Promo / AI Tip */}
      {!isAiOpen && (
        <div className="fixed bottom-6 left-6 z-30 hidden sm:flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/90 p-4 shadow-lg backdrop-blur-md max-w-sm cursor-pointer hover:-translate-y-0.5 transition-transform"
             onClick={() => setIsAiOpen(true)}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
            <Sparkles className="h-5 w-5 fill-amber-100" />
          </div>
          <div>
            <h5 className="font-sans text-xs font-bold text-amber-900">Need Investment Advice?</h5>
            <p className="font-sans text-[10px] leading-normal text-amber-800 mt-0.5">
              Ask our **AI Market Consultant** for pricing strategies, rental cap-rates, or customized lease terms!
            </p>
          </div>
        </div>
      )}

      {/* DETAILS MODAL PANEL */}
      {selectedProperty && (
        <ListingDetailModal
          property={selectedProperty}
          userRole={currentRole}
          onClose={() => setSelectedProperty(null)}
          onUpdateProperty={handleUpdateProperty}
        />
      )}

      {/* ADD PROPERTY MODAL */}
      {isAddListingOpen && (
        <AddListingModal
          userRole={currentRole}
          onClose={() => setIsAddListingOpen(false)}
          onAddProperty={handleAddProperty}
        />
      )}

      {/* FLOATING AI CONSULTANT PANEL */}
      {isAiOpen && (
        <AIConsultant
          propertyContext={selectedProperty}
          userRole={currentRole}
          onClose={() => setIsAiOpen(false)}
        />
      )}

    </div>
  );
}
