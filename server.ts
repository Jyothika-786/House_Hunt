import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK safely if key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("Warning: GEMINI_API_KEY environment variable is not set. AI Advisor features will run in mock/helper mode.");
}

// Database setup: simple server-side JSON persistence
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');

// Helper to ensure database is loaded
function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const defaultProperties = [
      {
        id: "prop-1",
        title: "The Horizon Penthouse",
        type: "rent",
        price: 4500,
        beds: 3,
        baths: 3.5,
        sqft: 2800,
        address: "742 Skyline Way, Penthouse B",
        city: "New York",
        description: "A breathtaking high-rise apartment in downtown with floor-to-ceiling glass windows, offering panoramic skyline views, state-of-the-art home automation, and custom Italian marble finishes. Residents enjoy private elevator access, an exclusive sky pool, and round-the-clock concierge service. Truly luxury living in the sky.",
        images: [
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?w=800&auto=format&fit=crop&q=80"
        ],
        amenities: ["24/7 Doorman", "Infinity Sky Pool", "Private Elevator", "Wine Cellar", "Smart Home", "Rooftop Terrace"],
        virtualTour: {
          slides: [
            {
              title: "Grand Entrance & Living Lounge",
              imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
              description: "Welcome to Horizon. The direct-access elevator opens into this stunning 20-foot glass atrium overlooking the Manhattan skyline."
            },
            {
              title: "Master Suite Sanctuary",
              imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
              description: "The primary suite features floating partition walls, a walk-in wardrobe, and custom acoustic ceiling panels."
            },
            {
              title: "Spa-grade Bath Retreat",
              imageUrl: "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?w=800&auto=format&fit=crop&q=80",
              description: "Lined with hand-picked Calacatta marble, equipped with a custom rain shower, deep soaking tub, and custom brass fixtures."
            }
          ]
        },
        listedBy: {
          id: "agent-clara",
          name: "Clara Sterling",
          role: "agent",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
          phone: "+1 (555) 304-9823",
          email: "c.sterling@househunt.com"
        },
        negotiations: [
          {
            id: "neg-1",
            senderId: "renter-alex",
            senderName: "Alex Mercer",
            senderRole: "renter",
            amount: 4200,
            message: "Hi Clara, would the owner be open to $4,200/mo if I sign an eighteen-month lease instead of twelve?",
            date: "2026-07-14T14:32:00Z",
            status: "pending"
          }
        ],
        paperwork: [
          {
            id: "paper-1",
            title: "Standard Residential Lease Agreement",
            fileType: "PDF Lease Draft",
            status: "pending_signature",
            uploadedBy: "Clara Sterling",
            date: "2026-07-14T15:00:00Z",
            content: "This Residential Lease Agreement is entered into between Clara Sterling (Agent representing Horizon Trust) and the prospective tenant, Alex Mercer. Property: 742 Skyline Way, Penthouse B. Monthly rent: $4,500. Security deposit: $4,500. Lease start date: August 1, 2026."
          }
        ]
      },
      {
        id: "prop-2",
        title: "Oakwood Craftsman Manor",
        type: "sale",
        price: 850000,
        beds: 4,
        baths: 3,
        sqft: 3400,
        address: "119 Whispering Pines Rd",
        city: "Seattle",
        description: "An exquisite traditional craftsman estate nestled within quiet suburban woods. Features custom hand-cut timber framework, a spacious wrap-around front porch, an expansive chef's kitchen with high-end appliances, and a gorgeous floor-to-ceiling stone fireplace. This home blends classic Northwest character with pristine modern comfort.",
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80"
        ],
        amenities: ["Wrap-around Porch", "Chef's Kitchen", "Stone Fireplace", "Large Backyard", "Wine Cellar", "Solar Panels", "Detached 2-Car Garage"],
        virtualTour: {
          slides: [
            {
              title: "Stunning Timber Frontage",
              imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=80",
              description: "The exterior showcases natural stone pillars and authentic cedar beams framing a grand, welcoming double-door entrance."
            },
            {
              title: "Gourmet Chef's Kitchen",
              imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80",
              description: "Equipped with a commercial grade 6-burner gas stove, double convection ovens, an oversized prep island, and custom walnut cabinetry."
            }
          ]
        },
        listedBy: {
          id: "landlord-james",
          name: "James Chen",
          role: "landlord",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          phone: "+1 (555) 489-1021",
          email: "j.chen@homemail.net"
        },
        negotiations: [],
        paperwork: []
      },
      {
        id: "prop-3",
        title: "Minimalist Coastal Haven",
        type: "rent",
        price: 3200,
        beds: 2,
        baths: 2,
        sqft: 1500,
        address: "408 Ocean Wave Blvd",
        city: "Miami",
        description: "A sun-drenched minimalist retreat steps away from the soft sandy beach. Offers clean Scandinavian architecture, a private sunbathing deck, an outdoor refreshing shower, and spectacular floor-to-ceiling ocean views. Fully furnished and optimized for high-speed remote workspace or a pristine seasonal getaway.",
        images: [
          "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=80"
        ],
        amenities: ["Beach Access", "Ocean View", "Private Sun Deck", "Outdoor Shower", "Fully Furnished", "High-speed Wi-Fi", "Keyless Entry"],
        virtualTour: {
          slides: [
            {
              title: "Oceanfront Patio & Deck",
              imageUrl: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&auto=format&fit=crop&q=80",
              description: "The private deck opens right onto the dunes. Catch refreshing coastal breezes and incredible sunrises daily."
            },
            {
              title: "Bright Open Concept Living",
              imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80",
              description: "Light terrazzo tiles keep the interior cool, blending seamlessly with organic cotton textiles and low-profile furniture."
            }
          ]
        },
        listedBy: {
          id: "agent-sarah",
          name: "Sarah Jenkins",
          role: "agent",
          avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
          phone: "+1 (555) 721-3944",
          email: "s.jenkins@househunt.com"
        },
        negotiations: [],
        paperwork: []
      },
      {
        id: "prop-4",
        title: "Chic Loft in the Arts District",
        type: "rent",
        price: 2600,
        beds: 1,
        baths: 1.5,
        sqft: 1200,
        address: "820 Gallery Lane, Loft 4A",
        city: "Los Angeles",
        description: "An authentic industrial loft boasting 15-foot ceilings, beautiful exposed brick, historic structural timber pillars, and massive multi-pane factory windows. Set inside a restored 1920s warehouse in the heart of the Arts District, close to premium galleries, boutique coffee shops, and award-winning dining.",
        images: [
          "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80"
        ],
        amenities: ["Exposed Brick", "Industrial Windows", "Polished Concrete", "Fitness Center", "Gated Parking", "Pet Friendly", "EV Charging Stations"],
        virtualTour: {
          slides: [
            {
              title: "Industrial Studio Workspace",
              imageUrl: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&auto=format&fit=crop&q=80",
              description: "Designed for modern creators, this corner of the loft receives brilliant natural north-facing light."
            },
            {
              title: "Sleek Industrial Bathroom",
              imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80",
              description: "Features black matte iron framing, custom tile work, and an open glass walk-in rain shower."
            }
          ]
        },
        listedBy: {
          id: "agent-marcus",
          name: "Marcus Vance",
          role: "agent",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
          phone: "+1 (555) 901-4432",
          email: "m.vance@househunt.com"
        },
        negotiations: [],
        paperwork: []
      },
      {
        id: "prop-5",
        title: "Serene Meadow Villa",
        type: "sale",
        price: 1250000,
        beds: 3,
        baths: 3,
        sqft: 2900,
        address: "33 Valley View Road",
        city: "Denver",
        description: "A sustainable architectural masterpiece nestled on 5 private acres of rolling meadows with dramatic Rocky Mountain vistas. Crafted with high-thermal mass concrete walls, a smart passive solar heating system, integrated geothermal heat pumps, and beautiful glass facade panels that invite nature directly into your living spaces.",
        images: [
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&auto=format&fit=crop&q=80"
        ],
        amenities: ["Geothermal HVAC", "Solar Panel Array", "Infinity Pool", "Panoramic Mountain Views", "Tesla Charger", "Private Nature Trail Access", "Rainwater Harvesting System"],
        virtualTour: {
          slides: [
            {
              title: "Monolithic Exterior Concept",
              imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
              description: "Constructed with low-carbon structural concrete that harmonizes beautifully with surrounding golden grasses."
            },
            {
              title: "Minimalist Dining & Gallery",
              imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80",
              description: "Clean architectural lines guide the eye toward the floor-to-ceiling glass paneling overlooking the snowcapped peaks."
            }
          ]
        },
        listedBy: {
          id: "landlord-elena",
          name: "Elena Rostova",
          role: "landlord",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          phone: "+1 (555) 880-9245",
          email: "e.rostova@eco-living.org"
        },
        negotiations: [],
        paperwork: []
      }
    ];

    fs.writeFileSync(DB_PATH, JSON.stringify(defaultProperties, null, 2));
    console.log("Database initialized with mock property data.");
  }
}

initDb();

// Helper to read DB
function readDb() {
  initDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

// Helper to write DB
function writeDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// API: Get properties with optional search/filters
app.get('/api/properties', (req, res) => {
  try {
    const properties = readDb();
    const { q, city, type, minPrice, maxPrice, beds } = req.query;

    let filtered = [...properties];

    if (q) {
      const searchStr = String(q).toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchStr) ||
        p.description.toLowerCase().includes(searchStr) ||
        p.address.toLowerCase().includes(searchStr) ||
        p.city.toLowerCase().includes(searchStr)
      );
    }

    if (city) {
      filtered = filtered.filter(p => p.city.toLowerCase() === String(city).toLowerCase());
    }

    if (type && (type === 'rent' || type === 'sale')) {
      filtered = filtered.filter(p => p.type === type);
    }

    if (minPrice) {
      filtered = filtered.filter(p => p.price >= Number(minPrice));
    }

    if (maxPrice) {
      filtered = filtered.filter(p => p.price <= Number(maxPrice));
    }

    if (beds) {
      filtered = filtered.filter(p => p.beds >= Number(beds));
    }

    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get a single property by ID
app.get('/api/properties/:id', (req, res) => {
  try {
    const properties = readDb();
    const property = properties.find((p: any) => p.id === req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Create new property
app.post('/api/properties', (req, res) => {
  try {
    const properties = readDb();
    const newProperty = {
      id: `prop-${Date.now()}`,
      title: req.body.title || "Untitled Property",
      type: req.body.type || "rent",
      price: Number(req.body.price) || 1500,
      beds: Number(req.body.beds) || 1,
      baths: Number(req.body.baths) || 1,
      sqft: Number(req.body.sqft) || 500,
      address: req.body.address || "123 Main St",
      city: req.body.city || "New York",
      description: req.body.description || "No description provided.",
      images: req.body.images && req.body.images.length > 0 ? req.body.images : [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80"
      ],
      amenities: req.body.amenities || [],
      virtualTour: req.body.virtualTour || {
        slides: [
          {
            title: "Main Living Space",
            imageUrl: req.body.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
            description: "A view of the primary living layout."
          }
        ]
      },
      listedBy: req.body.listedBy || {
        id: "landlord-user",
        name: "Demo Owner",
        role: "landlord",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        phone: "+1 (555) 000-1111",
        email: "demo@househunt.com"
      },
      negotiations: [],
      paperwork: []
    };

    properties.unshift(newProperty);
    writeDb(properties);
    res.status(201).json(newProperty);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Submit negotiation or offer
app.post('/api/properties/:id/negotiate', (req, res) => {
  try {
    const properties = readDb();
    const propIndex = properties.findIndex((p: any) => p.id === req.params.id);
    if (propIndex === -1) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const newOffer = {
      id: `neg-${Date.now()}`,
      senderId: req.body.senderId || 'demo-user',
      senderName: req.body.senderName || 'Anonymous User',
      senderRole: req.body.senderRole || 'renter',
      amount: Number(req.body.amount),
      message: req.body.message || '',
      date: new Date().toISOString(),
      status: 'pending' as const
    };

    properties[propIndex].negotiations = properties[propIndex].negotiations || [];
    properties[propIndex].negotiations.push(newOffer);
    writeDb(properties);

    res.status(201).json(newOffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update offer status (accept/decline)
app.patch('/api/properties/:id/negotiate/:negId', (req, res) => {
  try {
    const properties = readDb();
    const propIndex = properties.findIndex((p: any) => p.id === req.params.id);
    if (propIndex === -1) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const negotiations = properties[propIndex].negotiations || [];
    const negIndex = negotiations.findIndex((n: any) => n.id === req.params.negId);
    if (negIndex === -1) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const { status } = req.body;
    if (status === 'accepted' || status === 'declined') {
      negotiations[negIndex].status = status;
      // If accepted, we can automatically trigger a draft lease generation for rent
      if (status === 'accepted' && properties[propIndex].type === 'rent') {
        const leaseId = `paper-${Date.now()}`;
        properties[propIndex].paperwork = properties[propIndex].paperwork || [];
        properties[propIndex].paperwork.push({
          id: leaseId,
          title: `Lease Agreement for ${properties[propIndex].title}`,
          fileType: 'PDF Lease Draft',
          status: 'pending_signature',
          uploadedBy: properties[propIndex].listedBy.name,
          date: new Date().toISOString(),
          content: `RESIDENTIAL LEASE AGREEMENT\n\nLandlord: ${properties[propIndex].listedBy.name}\nTenant: ${negotiations[negIndex].senderName}\nProperty Address: ${properties[propIndex].address}, ${properties[propIndex].city}\nAgreed Rent: $${negotiations[negIndex].amount}/month\nLease Term: 12 months\nStatus: Pending Signature of both parties.`
        });
      }
    }

    writeDb(properties);
    res.json(negotiations[negIndex]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Upload/Create custom paperwork/document
app.post('/api/properties/:id/paperwork', (req, res) => {
  try {
    const properties = readDb();
    const propIndex = properties.findIndex((p: any) => p.id === req.params.id);
    if (propIndex === -1) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const newDoc = {
      id: `paper-${Date.now()}`,
      title: req.body.title || 'Property Document',
      fileType: req.body.fileType || 'PDF Document',
      status: req.body.status || 'draft',
      uploadedBy: req.body.uploadedBy || 'User',
      date: new Date().toISOString(),
      content: req.body.content || 'Draft content placeholder.'
    };

    properties[propIndex].paperwork = properties[propIndex].paperwork || [];
    properties[propIndex].paperwork.push(newDoc);
    writeDb(properties);

    res.status(201).json(newDoc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Sign paperwork/document
app.patch('/api/properties/:id/paperwork/:docId/sign', (req, res) => {
  try {
    const properties = readDb();
    const propIndex = properties.findIndex((p: any) => p.id === req.params.id);
    if (propIndex === -1) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const paperwork = properties[propIndex].paperwork || [];
    const docIndex = paperwork.findIndex((doc: any) => doc.id === req.params.docId);
    if (docIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    paperwork[docIndex].status = 'signed';
    paperwork[docIndex].content += `\n\n[ELECTRONICALLY SIGNED] On: ${new Date().toLocaleString()}`;
    
    writeDb(properties);
    res.json(paperwork[docIndex]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: AI Advisor using server-side Gemini API
app.post('/api/ai/advisor', async (req, res) => {
  try {
    const { prompt, propertyContext, history = [] } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Build rich context instructions for real estate advisor
    let systemInstruction = `You are "HouseHunt Advisor", an advanced, friendly, and expert AI Real Estate Consultant.
Your goal is to provide renters, buyers, landlords, and agents with highly intelligent, objective, and clear market insights.
You give guidance on:
- Renting vs Buying trade-offs.
- Rental pricing strategy, valuation, and ROI calculations.
- Negotiation tactics (how renters can get better terms, or how landlords can secure reliable tenants).
- Property inspections, agreement guidelines (lease terms, deposits, legal norms).
- Virtual tour observations.

Keep your tone professional, practical, encouraging, and clear. Avoid overly dense financial jargon unless explaining a formula like cap rate.
Use formatting, bullet points, and subheaders nicely. Refer to the specific property details provided in the context if applicable.
Do NOT output system paths or mention API limits. Speak as if you have access to real-time market indices.`;

    if (propertyContext) {
      systemInstruction += `\n\nCURRENT CONTEXT PROPERTY DETAILS:
Title: ${propertyContext.title}
Address: ${propertyContext.address}, ${propertyContext.city}
Type: ${propertyContext.type === 'rent' ? 'For Rent' : 'For Sale'}
Price: $${propertyContext.price}${propertyContext.type === 'rent' ? '/month' : ''}
Beds/Baths/Sqft: ${propertyContext.beds} beds, ${propertyContext.baths} baths, ${propertyContext.sqft} sqft
Description: ${propertyContext.description}
Amenities: ${propertyContext.amenities ? propertyContext.amenities.join(', ') : 'None'}`;
    }

    if (ai) {
      // Use official @google/genai syntax
      // Compile chat messages including past conversation history
      const formattedHistory = history.map((h: any) => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      }));

      // Generate content using the recommended gemini-3.5-flash model for basic text tasks
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const replyText = response.text || "I was unable to formulate an answer right now. Please try again.";
      res.json({ text: replyText });
    } else {
      // Return a professional mock/helper response if API key is not present
      let mockReply = `*(Note: Running in offline/demo mode)*\n\nThank you for reaching out! Here is a calculated advisor insight for your query regarding **"${prompt}"**:\n\n`;
      if (propertyContext) {
        mockReply += `Regarding **${propertyContext.title}** listed at $${propertyContext.price.toLocaleString()}:\n`;
        if (propertyContext.type === 'rent') {
          mockReply += `- **Pricing Check**: At $${propertyContext.price}/month for ${propertyContext.sqft} sqft, the unit pricing stands at $${(propertyContext.price / propertyContext.sqft).toFixed(2)} per sqft. This is inline with premium urban locations.\n`;
          mockReply += `- **Negotiation Tip**: Consider proposing an 18-month lease to request a 5-8% discount on rent, or ask for a waived security deposit or parking fee.\n`;
        } else {
          mockReply += `- **Investment Value**: At a purchase price of $${propertyContext.price.toLocaleString()}, with 20% down, your estimated mortgage payment would be around $4,200/mo. If rented out, the cap rate is estimated around 5.4% which is strong in ${propertyContext.city}.\n`;
        }
      } else {
        mockReply += `- **Market Outlook**: Across primary cities, rent indices have stabilized with a slight 1.2% downward correction, offering high leverage to creditworthy renters.\n`;
        mockReply += `- **Renting vs Buying**: If your planned duration is under 5 years, renting remains financially optimal to avoid high transaction and closing costs (usually 4-6% of home value).\n`;
      }
      mockReply += `\nWould you like guidance on drafting an official agreement, initiating negotiations with the landlord, or analyzing cap-rates further?`;
      res.json({ text: mockReply });
    }
  } catch (error: any) {
    console.error("Gemini Advisor Error:", error);
    res.status(500).json({ error: error.message || "An error occurred with the AI Advisor." });
  }
});

// Vite & Static file handler
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted in development mode.");
  } else {
    // Production mode
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static files from dist/ in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
