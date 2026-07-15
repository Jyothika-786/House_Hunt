export type UserRole = 'renter' | 'landlord' | 'agent';

export interface Property {
  id: string;
  title: string;
  type: 'rent' | 'sale';
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  address: string;
  city: string;
  description: string;
  images: string[];
  amenities: string[];
  virtualTour: {
    slides: {
      title: string;
      imageUrl: string;
      description: string;
    }[];
  };
  listedBy: {
    id: string;
    name: string;
    role: 'landlord' | 'agent';
    avatar: string;
    phone: string;
    email: string;
  };
  negotiations: Negotiation[];
  paperwork: PaperworkDoc[];
}

export interface Negotiation {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  amount: number;
  message: string;
  date: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface PaperworkDoc {
  id: string;
  title: string;
  fileType: string;
  status: 'draft' | 'pending_signature' | 'signed';
  uploadedBy: string;
  date: string;
  content?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
