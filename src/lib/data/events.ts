import type { EventCard } from "@/types/events";

export const eventsSeed: EventCard[] = [
  {
    id: 1,
    title: "Product Management Summit 2025",
    date: "2025-03-15",
    endDate: "2025-03-15",
    time: "10:00",
    endTime: "17:00",
    description: "An annual summit for product managers to learn and network.",
    location: "San Francisco, CA",
    eventType: "InPerson",
    attendees: "234",
    maxAttendees: 500,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
    category: "Summit",
    priceType: 'Free',
    type: 'Free',
    organizer: {
      name: "Product School",
      email: "hello@productschool.com"
    },
    tags: ["Product Management", "Networking"]
  },
  {
    id: 2,
    title: "Tech Networking Mixer",
    date: "2025-03-20",
    endDate: "2025-03-20",
    time: "18:00",
    endTime: "21:00",
    description: "A virtual event for tech professionals to connect.",
    location: "Virtual Event",
    eventType: "Online",
    virtualLink: "https://zoom.us/j/123456789",
    attendees: "156",
    maxAttendees: 200,
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop",
    category: "Networking",
    priceType: 'Paid',
    price: 50,
    type: 'Premium',
    organizer: {
      name: "TechWorld",
      email: "events@techworld.com"
    },
    ticketDetails: {
      name: "General Admission",
      quantity: 100,
      provider: "Stripe"
    },
    tags: ["Networking", "Tech"]
  },
  {
    id: 3,
    title: "Web Development Workshop",
    date: "2025-03-25",
    endDate: "2025-03-25",
    time: "14:00",
    endTime: "18:00",
    description: "A hands-on workshop for learning web development.",
    location: "New York, NY",
    eventType: "InPerson",
    attendees: "89",
    maxAttendees: 100,
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop",
    category: "Workshop",
    participated: true,
    priceType: 'Free',
    type: 'Free',
    organizer: {
      name: "Code Academy",
      email: "workshops@codeacademy.com"
    },
    tags: ["Web Dev", "Coding"]
  },
  {
    id: 4,
    title: "AI & Machine Learning Conference",
    date: "2025-04-05",
    endDate: "2025-04-06",
    time: "09:00",
    endTime: "18:00",
    description: "A conference on the latest trends in AI and machine learning.",
    location: "Seattle, WA",
    eventType: "InPerson",
    attendees: "412",
    maxAttendees: 1000,
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=400&fit=crop",
    category: "Conference",
    priceType: 'Free',
    type: 'Free',
    organizer: {
      name: "AI Future",
      email: "contact@aifuture.com"
    },
    tags: ["AI", "Machine Learning"]
  },
  {
    id: 5,
    title: "Design Thinking Masterclass",
    date: "2025-04-12",
    endDate: "2025-04-12",
    time: "13:00",
    endTime: "16:00",
    description: "A masterclass on the principles of design thinking.",
    location: "Los Angeles, CA",
    eventType: "InPerson",
    attendees: "67",
    maxAttendees: 80,
    image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop",
    category: "Masterclass",
    priceType: 'Free',
    type: 'Free',
    organizer: {
      name: "Design Studio",
      email: "learn@designstudio.com"
    },
    tags: ["Design", "Creativity"]
  },
];
