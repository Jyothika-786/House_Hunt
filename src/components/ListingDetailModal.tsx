import React, { useState } from 'react';
import { 
  X, Bed, Bath, Square, MapPin, Tag, Sparkles, 
  ChevronLeft, ChevronRight, DollarSign, Send, 
  Check, XCircle, FileText, Upload, User, PenTool, ClipboardList
} from 'lucide-react';
import { Property, UserRole, Negotiation, PaperworkDoc } from '../types';

interface ListingDetailModalProps {
  property: Property;
  userRole: UserRole;
  onClose: () => void;
  onUpdateProperty: (updated: Property) => void;
}

type ActiveTab = 'overview' | 'tour' | 'negotiate' | 'paperwork';

export default function ListingDetailModal({ 
  property, 
  userRole, 
  onClose, 
  onUpdateProperty 
}: ListingDetailModalProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  
  // Virtual Tour State
  const [activeTourSlide, setActiveTourSlide] = useState(0);

  // Negotiation State
  const [offerAmount, setOfferAmount] = useState<string>(property.price.toString());
  const [offerMessage, setOfferMessage] = useState('');
  const [negError, setNegError] = useState('');
  const [negSuccess, setNegSuccess] = useState('');

  // Paperwork State
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [isSigningDocId, setIsSigningDocId] = useState<string | null>(null);

  const isRent = property.type === 'rent';

  // Photo gallery controllers
  const nextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % property.images.length);
  };
  const prevImage = () => {
    setActiveImageIdx((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  // Submit Rent/Buy Negotiation
  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setNegError('');
    setNegSuccess('');

    const amountNum = Number(offerAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setNegError('Please enter a valid amount.');
      return;
    }

    try {
      const response = await fetch(`/api/properties/${property.id}/negotiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: `user-${userRole}`,
          senderName: userRole === 'renter' ? 'Alex Mercer (Renter)' : 'James Chen (Owner)',
          senderRole: userRole,
          amount: amountNum,
          message: offerMessage
        })
      });

      if (!response.ok) throw new Error('Failed to submit offer.');
      
      const newOffer: Negotiation = await response.json();
      
      // Update local parent state
      const updatedProperty = {
        ...property,
        negotiations: [...(property.negotiations || []), newOffer]
      };
      
      onUpdateProperty(updatedProperty);
      setOfferMessage('');
      setNegSuccess('Offer submitted successfully! The owner/agent has been notified.');
    } catch (err: any) {
      setNegError(err.message || 'Something went wrong.');
    }
  };

  // Accept/Decline Negotiation Offer
  const handleUpdateOfferStatus = async (negId: string, status: 'accepted' | 'declined') => {
    try {
      const response = await fetch(`/api/properties/${property.id}/negotiate/${negId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update offer status.');
      const updatedOffer: Negotiation = await response.json();

      // Reflect in local state
      const updatedOffers = property.negotiations.map(o => o.id === negId ? updatedOffer : o);
      
      // If accepted, check if server generated paperwork
      // For safety, we fetch the fresh property details from server to capture paperwork updates
      const propResponse = await fetch(`/api/properties/${property.id}`);
      if (propResponse.ok) {
        const freshProperty = await propResponse.json();
        onUpdateProperty(freshProperty);
      } else {
        const updatedProperty = {
          ...property,
          negotiations: updatedOffers
        };
        onUpdateProperty(updatedProperty);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Paperwork Draft
  const handleAddPaperwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docContent) return;

    setIsUploading(true);
    try {
      const response = await fetch(`/api/properties/${property.id}/paperwork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          fileType: 'Contract / Agreement',
          status: 'draft',
          uploadedBy: userRole === 'agent' ? 'Clara Sterling (Agent)' : 'James Chen (Landlord)',
          content: docContent
        })
      });

      if (!response.ok) throw new Error('Failed to create document.');
      const newDoc: PaperworkDoc = await response.json();

      const updatedProperty = {
        ...property,
        paperwork: [...(property.paperwork || []), newDoc]
      };

      onUpdateProperty(updatedProperty);
      setDocTitle('');
      setDocContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  // Sign Paperwork Doc
  const handleSignDocument = async (docId: string) => {
    if (!signatureName.trim()) return;

    try {
      const response = await fetch(`/api/properties/${property.id}/paperwork/${docId}/sign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: signatureName })
      });

      if (!response.ok) throw new Error('Failed to sign document.');
      const signedDoc: PaperworkDoc = await response.json();

      const updatedPaperwork = property.paperwork.map(doc => doc.id === docId ? signedDoc : doc);
      const updatedProperty = {
        ...property,
        paperwork: updatedPaperwork
      };

      onUpdateProperty(updatedProperty);
      setSignatureName('');
      setIsSigningDocId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col rounded-3xl border border-gray-100 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${
                isRent ? 'bg-zinc-900' : 'bg-emerald-600'
              }`}>
                For {property.type}
              </span>
              <span className="font-mono text-xs text-gray-400">ID: {property.id}</span>
            </div>
            <h2 className="font-sans text-lg font-black text-gray-900 leading-tight">
              {property.title}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable Split-Screen) */}
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT PANEL: Media and Highlights (Takes 50% on large screens) */}
          <div className="w-full lg:w-1/2 flex flex-col border-r border-gray-50 bg-gray-50/40 overflow-y-auto">
            {/* Gallery Section */}
            <div className="relative aspect-video w-full overflow-hidden bg-gray-900 shrink-0 select-none">
              <img
                src={property.images[activeImageIdx]}
                alt={`Property image ${activeImageIdx + 1}`}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              {property.images.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-xs transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-xs transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur-xs">
                    {activeImageIdx + 1} / {property.images.length}
                  </div>
                </>
              )}
            </div>

            {/* Quick Specs Strip */}
            <div className="grid grid-cols-4 gap-2 bg-white px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="text-center">
                <span className="block font-mono text-xl font-bold text-gray-900">${property.price.toLocaleString()}</span>
                <span className="font-sans text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  {isRent ? 'Monthly rent' : 'Asking Price'}
                </span>
              </div>
              <div className="text-center border-l border-gray-100">
                <span className="block font-sans text-lg font-bold text-gray-800">{property.beds}</span>
                <span className="font-sans text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Bedrooms</span>
              </div>
              <div className="text-center border-l border-gray-100">
                <span className="block font-sans text-lg font-bold text-gray-800">{property.baths}</span>
                <span className="font-sans text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Bathrooms</span>
              </div>
              <div className="text-center border-l border-gray-100">
                <span className="block font-sans text-lg font-bold text-gray-800">{property.sqft.toLocaleString()}</span>
                <span className="font-sans text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Sq. Feet</span>
              </div>
            </div>

            {/* Location & Broker Details */}
            <div className="p-6">
              <div className="flex items-center gap-1.5 mb-4 text-gray-700 font-sans text-sm">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{property.address}, {property.city}</span>
              </div>

              <div className="mb-6 rounded-2xl bg-white p-4 border border-gray-100">
                <h4 className="font-sans text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  Listed & Managed By
                </h4>
                <div className="flex items-center gap-3">
                  <img
                    src={property.listedBy.avatar}
                    alt={property.listedBy.name}
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 rounded-full object-cover border border-gray-100"
                  />
                  <div>
                    <h5 className="font-sans text-sm font-bold text-gray-900">{property.listedBy.name}</h5>
                    <p className="font-sans text-xs text-gray-500 capitalize">{property.listedBy.role} • Active Provider</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-50 pt-3 text-[11px] font-mono text-gray-600">
                  <div>📞 {property.listedBy.phone}</div>
                  <div>✉️ {property.listedBy.email}</div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="font-sans text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  Amenities & Facilities
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {property.amenities.map((amenity, i) => (
                    <span 
                      key={i} 
                      className="inline-flex items-center rounded-lg bg-gray-100/70 px-2.5 py-1 text-xs font-medium text-gray-800"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Interactive Tabs & Workflow */}
          <div className="w-full lg:w-1/2 flex flex-col overflow-hidden bg-white">
            
            {/* Tab Buttons */}
            <div className="flex border-b border-gray-100 px-4 py-2 shrink-0 overflow-x-auto bg-gray-50/50">
              <button
                onClick={() => setActiveTab('overview')}
                className={`rounded-lg px-4 py-2 font-sans text-xs font-bold tracking-tight transition-all shrink-0 ${
                  activeTab === 'overview'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              
              {property.virtualTour?.slides?.length > 0 && (
                <button
                  onClick={() => setActiveTab('tour')}
                  className={`flex items-center gap-1 rounded-lg px-4 py-2 font-sans text-xs font-bold tracking-tight transition-all shrink-0 ${
                    activeTab === 'tour'
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  Virtual Tour
                </button>
              )}

              <button
                onClick={() => setActiveTab('negotiate')}
                className={`flex items-center gap-1 rounded-lg px-4 py-2 font-sans text-xs font-bold tracking-tight transition-all shrink-0 ${
                  activeTab === 'negotiate'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                Negotiations ({property.negotiations?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('paperwork')}
                className={`flex items-center gap-1 rounded-lg px-4 py-2 font-sans text-xs font-bold tracking-tight transition-all shrink-0 ${
                  activeTab === 'paperwork'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Paperwork ({property.paperwork?.length || 0})
              </button>
            </div>

            {/* Tab Panels */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* PANEL 1: Overview Text */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h3 className="font-sans text-base font-bold text-gray-900">About the Property</h3>
                  <p className="font-sans text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                  
                  <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/50 space-y-2 text-xs text-gray-500 font-sans">
                    <h5 className="font-bold text-gray-700">Financial Insights & Market Comparison:</h5>
                    <p>• Estimated standard market value in {property.city} averages ${(property.price * 1.1).toLocaleString()} for comparable dimensions.</p>
                    {isRent ? (
                      <p>• Price per square foot averages <strong>${(property.price / property.sqft).toFixed(2)}/mo</strong>, making this unit a balanced option for high-end seekers.</p>
                    ) : (
                      <p>• Purchasing at ${(property.price / property.sqft).toFixed(0)}/sqft. Estimated capitalization rate yields a strong <strong>5.2% - 6.1%</strong> if operated as rental capital.</p>
                    )}
                  </div>
                </div>
              )}

              {/* PANEL 2: Interactive Virtual 3D Tour Walkthrough */}
              {activeTab === 'tour' && property.virtualTour?.slides?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-sans text-base font-bold text-gray-900">Virtual Walkthrough</h3>
                      <p className="font-sans text-xs text-gray-400">Step inside the property simulation</p>
                    </div>
                    <span className="font-mono text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-lg">
                      Room {activeTourSlide + 1} of {property.virtualTour.slides.length}
                    </span>
                  </div>

                  {/* Active Slide Image */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-900 shadow-sm border border-gray-100">
                    <img
                      src={property.virtualTour.slides[activeTourSlide].imageUrl}
                      alt={property.virtualTour.slides[activeTourSlide].title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-opacity duration-300"
                    />
                    
                    {/* Hotspot / Ambient simulation details */}
                    <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-all cursor-pointer flex items-center justify-center">
                      <div className="rounded-full bg-white/95 px-3 py-1.5 font-sans text-[10px] font-bold text-gray-800 shadow-lg flex items-center gap-1 border border-gray-100 animate-bounce">
                        <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" />
                        Explore Room
                      </div>
                    </div>
                  </div>

                  {/* Slide Content */}
                  <div className="rounded-2xl border border-gray-100 p-4">
                    <h4 className="font-sans text-sm font-bold text-gray-900 mb-1">
                      {property.virtualTour.slides[activeTourSlide].title}
                    </h4>
                    <p className="font-sans text-xs text-gray-500 leading-relaxed">
                      {property.virtualTour.slides[activeTourSlide].description}
                    </p>
                  </div>

                  {/* Walkthrough Navigation Grid */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setActiveTourSlide((prev) => Math.max(0, prev - 1))}
                      disabled={activeTourSlide === 0}
                      className="rounded-lg border border-gray-200 px-3.5 py-2 font-sans text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                      ← Previous Room
                    </button>
                    <button
                      onClick={() => setActiveTourSlide((prev) => Math.min(property.virtualTour.slides.length - 1, prev + 1))}
                      disabled={activeTourSlide === property.virtualTour.slides.length - 1}
                      className="rounded-lg bg-gray-900 px-3.5 py-2 font-sans text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
                    >
                      Next Room →
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL 3: Offers & Negotiations */}
              {activeTab === 'negotiate' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-sans text-base font-bold text-gray-900 mb-1">Rent & Terms Negotiation</h3>
                    <p className="font-sans text-xs text-gray-400">Propose custom pricing or view submitted offers</p>
                  </div>

                  {/* Offer Submission Form for Renter */}
                  {userRole === 'renter' && (
                    <form onSubmit={handleSendOffer} className="space-y-4 rounded-2xl border border-gray-100 p-4 bg-gray-50/40">
                      <h4 className="font-sans text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Submit a New Offer
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">
                            Proposed {isRent ? 'Rent ($ / month)' : 'Purchase Offer ($)'}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-sans text-sm font-bold text-gray-400">$</span>
                            <input
                              type="number"
                              value={offerAmount}
                              onChange={(e) => setOfferAmount(e.target.value)}
                              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-4 font-sans text-sm font-bold text-gray-900 focus:border-gray-900 focus:outline-none"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">
                            Contract Term or Conditions
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 18-Month Lease, 10% Down"
                            className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3.5 font-sans text-sm text-gray-800 focus:border-gray-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">
                          Message or Justification
                        </label>
                        <textarea
                          rows={2}
                          value={offerMessage}
                          onChange={(e) => setOfferMessage(e.target.value)}
                          placeholder="Why is this a fair offer? (e.g., solid credit rating, fast move-in)"
                          className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3.5 font-sans text-sm text-gray-800 focus:border-gray-900 focus:outline-none"
                          required
                        />
                      </div>

                      {negError && <p className="font-sans text-xs font-semibold text-red-500">{negError}</p>}
                      {negSuccess && <p className="font-sans text-xs font-semibold text-emerald-600">{negSuccess}</p>}

                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 font-sans text-xs font-bold text-white hover:bg-gray-800 transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Submit Offer / Terms
                      </button>
                    </form>
                  )}

                  {/* Landlord view of submitted offers */}
                  <div className="space-y-3">
                    <h4 className="font-sans text-xs font-bold text-gray-400 uppercase tracking-wider">
                      History & Offers Log ({property.negotiations?.length || 0})
                    </h4>

                    {(!property.negotiations || property.negotiations.length === 0) ? (
                      <div className="text-center py-6 border border-dashed border-gray-100 rounded-2xl">
                        <DollarSign className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                        <p className="font-sans text-xs text-gray-400 font-medium">No offers submitted yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {property.negotiations.map((offer) => (
                          <div 
                            key={offer.id} 
                            className="rounded-2xl border border-gray-100 p-4 bg-white shadow-xs space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="font-sans text-xs font-bold text-gray-900">{offer.senderName}</span>
                              </div>
                              <span className="font-mono text-xs text-gray-400">
                                {new Date(offer.date).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-baseline gap-2">
                              <span className="font-sans text-[11px] font-semibold text-gray-400 uppercase">OFFERED AMOUNT:</span>
                              <span className="font-sans text-base font-black text-gray-900">
                                ${offer.amount.toLocaleString()}
                                {isRent && <span className="text-xs font-normal text-gray-500">/mo</span>}
                              </span>
                            </div>

                            <p className="font-sans text-xs text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                              "{offer.message}"
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                              <span className="flex items-center gap-1.5">
                                <span className="font-sans text-[11px] font-bold text-gray-400 uppercase">Status:</span>
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                                  offer.status === 'accepted' 
                                    ? 'bg-emerald-50 text-emerald-800' 
                                    : offer.status === 'declined'
                                    ? 'bg-red-50 text-red-800'
                                    : 'bg-amber-50 text-amber-800'
                                }`}>
                                  {offer.status}
                                </span>
                              </span>

                              {/* Action buttons for landlord / broker */}
                              {offer.status === 'pending' && (userRole === 'landlord' || userRole === 'agent') && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateOfferStatus(offer.id, 'declined')}
                                    className="flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 px-2.5 py-1 font-sans text-[10px] font-bold text-red-700 transition-colors"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Decline
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOfferStatus(offer.id, 'accepted')}
                                    className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 font-sans text-[10px] font-bold text-white transition-colors shadow-xs"
                                  >
                                    <Check className="h-3 w-3" />
                                    Accept Offer
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PANEL 4: Digital Paperwork & Lease Signatures */}
              {activeTab === 'paperwork' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-sans text-base font-bold text-gray-900 mb-1">Contract & Paperwork Portal</h3>
                    <p className="font-sans text-xs text-gray-400">Review agreements, upload draft files, and sign electronically</p>
                  </div>

                  {/* Landlord/Agent Form to Draft Paperwork */}
                  {(userRole === 'landlord' || userRole === 'agent') && (
                    <form onSubmit={handleAddPaperwork} className="space-y-4 rounded-2xl border border-gray-100 p-4 bg-gray-50/40">
                      <h4 className="font-sans text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Upload className="h-4 w-4" />
                        Issue / Draft New Contract
                      </h4>

                      <div className="space-y-3">
                        <div>
                          <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">Document Title</label>
                          <input
                            type="text"
                            value={docTitle}
                            onChange={(e) => setDocTitle(e.target.value)}
                            placeholder="e.g. Residential Lease Addendum"
                            className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3.5 font-sans text-xs text-gray-800 focus:border-gray-900 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">Contract / Terms Body</label>
                          <textarea
                            rows={3}
                            value={docContent}
                            onChange={(e) => setDocContent(e.target.value)}
                            placeholder="Provide details about legal lease terms, deposit dates, liability guidelines, etc."
                            className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3.5 font-sans text-xs text-gray-800 focus:border-gray-900 focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isUploading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 font-sans text-xs font-bold text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        Publish Contract Draft
                      </button>
                    </form>
                  )}

                  {/* List of active paperwork */}
                  <div className="space-y-4">
                    <h4 className="font-sans text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <ClipboardList className="h-3.5 w-3.5" />
                      Active Legal Documents ({property.paperwork?.length || 0})
                    </h4>

                    {(!property.paperwork || property.paperwork.length === 0) ? (
                      <div className="text-center py-6 border border-dashed border-gray-100 rounded-2xl">
                        <FileText className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                        <p className="font-sans text-xs text-gray-400 font-medium">No paperwork issued yet. Accept an offer to generate a lease draft.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {property.paperwork.map((doc) => (
                          <div 
                            key={doc.id} 
                            className="rounded-2xl border border-gray-100 p-4 bg-white shadow-xs space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span className="font-sans text-xs font-bold text-gray-900">{doc.title}</span>
                              </div>
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold capitalize ${
                                doc.status === 'signed' 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                                  : 'bg-amber-50 text-amber-800 border border-amber-100'
                              }`}>
                                {doc.status === 'signed' ? 'Signed' : 'Awaiting Signatures'}
                              </span>
                            </div>

                            <div className="font-mono text-[11px] leading-relaxed text-gray-600 bg-gray-50/70 p-3 rounded-lg border border-gray-100 max-h-48 overflow-y-auto whitespace-pre-line">
                              {doc.content}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                              <span className="font-sans text-[10px] text-gray-400">
                                Issued by: {doc.uploadedBy} on {new Date(doc.date).toLocaleDateString()}
                              </span>

                              {doc.status !== 'signed' && (
                                <div>
                                  {isSigningDocId === doc.id ? (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        placeholder="Type name to sign"
                                        value={signatureName}
                                        onChange={(e) => setSignatureName(e.target.value)}
                                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 font-sans text-xs text-gray-800 focus:outline-none"
                                      />
                                      <button
                                        onClick={() => handleSignDocument(doc.id)}
                                        disabled={!signatureName.trim()}
                                        className="flex items-center gap-1 rounded-lg bg-gray-900 px-2.5 py-1 font-sans text-xs font-semibold text-white hover:bg-gray-800"
                                      >
                                        <PenTool className="h-3 w-3" />
                                        Sign
                                      </button>
                                      <button
                                        onClick={() => {
                                          setIsSigningDocId(null);
                                          setSignatureName('');
                                        }}
                                        className="text-gray-400 hover:text-gray-900 font-sans text-xs px-1"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setIsSigningDocId(doc.id)}
                                      className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 font-sans text-xs font-semibold text-white shadow-xs transition-colors"
                                    >
                                      <PenTool className="h-3 w-3" />
                                      E-Sign Agreement
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
