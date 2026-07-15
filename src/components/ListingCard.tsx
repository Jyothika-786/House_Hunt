import React from 'react';
import { Bed, Bath, Square, MapPin, Tag, Sparkles } from 'lucide-react';
import { Property, UserRole } from '../types';

interface ListingCardProps {
  key?: string;
  property: Property;
  userRole: UserRole;
  onSelect: (property: Property) => void;
}

export default function ListingCard({ property, userRole, onSelect }: ListingCardProps) {
  const isRent = property.type === 'rent';

  // Quick stats about active negotiations or paperwork
  const pendingNegotiationsCount = property.negotiations?.filter(n => n.status === 'pending').length || 0;
  const signedPaperworkCount = property.paperwork?.filter(doc => doc.status === 'signed').length || 0;
  const totalPaperworkCount = property.paperwork?.length || 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs transition-all hover:-translate-y-1 hover:border-gray-200 hover:shadow-md">
      {/* Listing Tag */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-sm ${
          isRent ? 'bg-zinc-900' : 'bg-emerald-600'
        }`}>
          <Tag className="h-3 w-3" />
          For {property.type}
        </span>
        
        {property.virtualTour?.slides?.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-gray-800 shadow-sm backdrop-blur-xs">
            <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" />
            3D Tour
          </span>
        )}
      </div>

      {/* Main Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={property.images[0]}
          alt={property.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      {/* Card Body */}
      <div className="p-5">
        {/* Price & Location */}
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-sans text-2xl font-black tracking-tight text-gray-900">
            ${property.price.toLocaleString()}
            {isRent && <span className="text-sm font-normal text-gray-500">/mo</span>}
          </span>
          <span className="inline-flex items-center gap-1 font-sans text-xs font-medium text-gray-500">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            {property.city}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-sans text-base font-bold text-gray-900 line-clamp-1 mb-1.5 group-hover:text-gray-700">
          {property.title}
        </h3>

        {/* Address */}
        <p className="font-sans text-xs text-gray-500 line-clamp-1 mb-4">
          {property.address}
        </p>

        {/* Home Specifications Grid */}
        <div className="grid grid-cols-3 gap-2 border-y border-gray-50 py-3 mb-4 font-sans text-xs text-gray-600 font-medium">
          <div className="flex items-center gap-1.5">
            <Bed className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{property.beds} Bed{property.beds > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{property.baths} Bath{property.baths > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Square className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{property.sqft.toLocaleString()} Sqft</span>
          </div>
        </div>

        {/* Owner/Agent Info or Management Indicators */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={property.listedBy.avatar}
              alt={property.listedBy.name}
              referrerPolicy="no-referrer"
              className="h-7 w-7 rounded-full object-cover border border-gray-100"
            />
            <div className="text-[11px] leading-tight">
              <p className="font-semibold text-gray-900 line-clamp-1">{property.listedBy.name}</p>
              <p className="text-gray-400 capitalize">{property.listedBy.role}</p>
            </div>
          </div>

          <button
            onClick={() => onSelect(property)}
            className="rounded-lg bg-gray-50 hover:bg-gray-900 px-3 py-1.5 font-sans text-xs font-semibold text-gray-900 hover:text-white transition-colors duration-150 active:scale-95"
          >
            Explore
          </button>
        </div>

        {/* User-Role context updates (Negotiations or paperwork indicators) */}
        {(userRole === 'landlord' || userRole === 'agent') && (
          <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-gray-50">
            {pendingNegotiationsCount > 0 && (
              <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800 border border-amber-100">
                {pendingNegotiationsCount} pending offer{pendingNegotiationsCount > 1 ? 's' : ''}
              </span>
            )}
            {totalPaperworkCount > 0 && (
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium border ${
                signedPaperworkCount === totalPaperworkCount 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-100'
              }`}>
                Paperwork: {signedPaperworkCount}/{totalPaperworkCount} Signed
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
