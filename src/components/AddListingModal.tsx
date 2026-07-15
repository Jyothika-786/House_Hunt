import React, { useState } from 'react';
import { X, Sparkles, Home, DollarSign, Bed, Bath, Square, MapPin } from 'lucide-react';
import { Property, UserRole } from '../types';

interface AddListingModalProps {
  userRole: UserRole;
  onClose: () => void;
  onAddProperty: (newProp: Property) => void;
}

export default function AddListingModal({ userRole, onClose, onAddProperty }: AddListingModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'rent' | 'sale'>('rent');
  const [price, setPrice] = useState('');
  const [beds, setBeds] = useState('2');
  const [baths, setBaths] = useState('2');
  const [sqft, setSqft] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('New York');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const availableAmenities = [
    "24/7 Doorman", "Infinity Pool", "Smart Home", "Wine Cellar", 
    "Chef's Kitchen", "Private Elevator", "Gym Access", "Pet Friendly", 
    "EV Charger", "Solar Panels", "Large Backyard", "Mountain View"
  ];

  const handleToggleAmenity = (amenity: string) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter(a => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  // Helper to pre-fill stunning real-estate mock details for instant trial
  const handlePreFillStunning = () => {
    setTitle("The Sunset Crest Villa");
    setType("sale");
    setPrice("1450000");
    setBeds("3");
    setBaths("3.5");
    setSqft("3100");
    setAddress("982 Sunset Boulevard, West Hills");
    setCity("Los Angeles");
    setDescription("An architectural marvel capturing endless sunset vistas over the valley. Crafted using low-impact structural concrete, massive pivot glass panels, and floating architectural stairways. Features integrated radiant heating, multi-zone solar power, and custom white-oak cabinetry throughout.");
    setImageUrl("https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80");
    setAmenities(["Smart Home", "Infinity Pool", "Solar Panels", "Chef's Kitchen", "EV Charger", "Large Backyard"]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const priceNum = Number(price);
    const bedsNum = Number(beds);
    const bathsNum = Number(baths);
    const sqftNum = Number(sqft);

    if (isNaN(priceNum) || priceNum <= 0) return setError('Please enter a valid price.');
    if (isNaN(sqftNum) || sqftNum <= 0) return setError('Please enter a valid square footage.');

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          price: priceNum,
          beds: bedsNum,
          baths: bathsNum,
          sqft: sqftNum,
          address,
          city,
          description,
          images: imageUrl ? [imageUrl] : [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80"
          ],
          amenities,
          listedBy: {
            id: `user-${userRole}`,
            name: userRole === 'agent' ? 'Clara Sterling' : 'James Chen',
            role: userRole,
            avatar: userRole === 'agent' 
              ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
              : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            phone: userRole === 'agent' ? "+1 (555) 304-9823" : "+1 (555) 489-1021",
            email: userRole === 'agent' ? "c.sterling@househunt.com" : "j.chen@homemail.net"
          }
        })
      });

      if (!response.ok) throw new Error('Failed to create property listing.');
      const newProperty: Property = await response.json();

      onAddProperty(newProperty);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-gray-100 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm">
              <Home className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-sans text-base font-black text-gray-900 leading-tight">Create Listing</h3>
              <p className="font-sans text-xs text-gray-400">Add detailed specifications to publish live</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreFillStunning}
              type="button"
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 font-sans text-[10px] font-bold text-amber-800 shadow-xs transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              Pre-fill Template
            </button>

            <button 
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && <p className="font-sans text-xs font-semibold text-red-500">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">Listing Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Modern Sunset Penthouse"
                className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3.5 font-sans text-xs text-gray-800 focus:border-gray-900 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">Listing Category</label>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('rent')}
                  className={`flex-1 rounded-lg py-1.5 font-sans text-xs font-bold transition-all ${
                    type === 'rent'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  For Rent
                </button>
                <button
                  type="button"
                  onClick={() => setType('sale')}
                  className={`flex-1 rounded-lg py-1.5 font-sans text-xs font-bold transition-all ${
                    type === 'sale'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  For Sale
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">
                {type === 'rent' ? 'Rent ($ / mo)' : 'Price ($)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-xs font-bold text-gray-400">$</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-6 pr-3.5 font-sans text-xs font-bold text-gray-900 focus:border-gray-900 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">Bedrooms</label>
              <select
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3.5 font-sans text-xs text-gray-800 focus:border-gray-900 focus:outline-none"
              >
                <option value="1">1 Bed</option>
                <option value="2">2 Beds</option>
                <option value="3">3 Beds</option>
                <option value="4">4 Beds</option>
                <option value="5">5 Beds</option>
              </select>
            </div>
            <div>
              <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">Bathrooms</label>
              <select
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3.5 font-sans text-xs text-gray-800 focus:border-gray-900 focus:outline-none"
              >
                <option value="1">1 Bath</option>
                <option value="1.5">1.5 Baths</option>
                <option value="2">2 Baths</option>
                <option value="2.5">2.5 Baths</option>
                <option value="3">3 Baths</option>
                <option value="3.5">3.5 Baths</option>
              </select>
            </div>
            <div>
              <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">Area (Sqft)</label>
              <input
                type="number"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3.5 font-sans text-xs text-gray-800 focus:border-gray-900 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 15 Gallery Dr"
                className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3.5 font-sans text-xs text-gray-800 focus:border-gray-900 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">Metro / City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3.5 font-sans text-xs text-gray-800 focus:border-gray-900 focus:outline-none"
              >
                <option value="New York">New York</option>
                <option value="Los Angeles">Los Angeles</option>
                <option value="Seattle">Seattle</option>
                <option value="Miami">Miami</option>
                <option value="Denver">Denver</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">Property Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Highlight special details, design motifs, historical contexts, or environmental details of the property..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-3.5 font-sans text-xs text-gray-800 focus:border-gray-900 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-sans text-xs font-semibold text-gray-500 mb-1">Stunning Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste a professional Unsplash image link or leave blank for a high-end default"
              className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3.5 font-sans text-xs text-gray-800 focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-sans text-xs font-semibold text-gray-500 mb-2.5">Amenities Checklist</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableAmenities.map((amenity) => {
                const isSelected = amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => handleToggleAmenity(amenity)}
                    className={`rounded-xl border px-3 py-2 font-sans text-[11px] font-semibold text-left transition-all ${
                      isSelected
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex gap-3 pt-3 border-t border-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 font-sans text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gray-900 py-2.5 font-sans text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
