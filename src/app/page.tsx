'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import * as Separator from '@radix-ui/react-separator'
import { Paperclip, Camera, UploadCloud, MapPin, FileText, Receipt, FileSpreadsheet, FilePlus2, Clock3 } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

// Types
type ViewType = 'canvas' | 'social' | 'messages' | 'dashboard' | 'reviews' | 'revenue' | 'documents'
type CardType = 'stat' | 'product' | 'vendor' | 'service' | 'auction' | 'advert' | 'logistics' | 'event' | 'chat' | 'storefront' | 'order' | 'draft' | 'report'
type DashboardSection = 'overview' | 'orders' | 'drafts' | 'analytics' | 'shared' | 'vendors' | 'messages' | 'profile' | 'reviews' | 'revenue'
type DocumentsNav = 'overview' | 'history'
type CardStyle = 'default' | 'compact' | 'featured' | 'minimal' | 'glass' | 'gradient'

interface User {
  id: string
  name: string
  avatar: string
  online: boolean
  lastSeen?: string
  email?: string
  role?: 'user' | 'vendor' | 'admin'
}

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: Date
  read: boolean
}

interface Chat {
  id: string
  name: string
  avatar: string
  isGroup: boolean
  lastMessage: string
  lastMessageTime: string
  unread: number
  online: boolean
  participants?: User[]
  messages: Message[]
}

interface Card {
  id: string
  type: CardType
  title: string
  subtitle?: string
  image?: string
  price?: string
  originalPrice?: string
  rating?: number
  reviews?: number
  category?: string
  trend?: string
  value?: string
  status?: string
  progress?: number
  countdown?: string
  bids?: number
  currentBid?: string
  location?: string
  date?: string
  attendees?: number
  description?: string
  tags?: string[]
  style?: CardStyle
  vendor?: {
    name: string
    avatar: string
    verified: boolean
  }
  tracking?: {
    status: string
    location: string
    eta: string
    events: { time: string; location: string; status: string }[]
  }
  orderDetails?: {
    orderId: string
    items: number
    total: string
    status: 'pending' | 'processing' | 'shipped' | 'delivered'
  }
}

interface SidebarItem {
  id: string
  name: string
  sub: string
  icon?: string
  img?: string
  time?: string
  unread?: number
  online?: boolean
  badge?: string
}

interface Post {
  id: string
  user: User
  content: string
  image?: string
  likes: number
  comments: number
  shares: number
  timestamp: string
  liked: boolean
}

interface Review {
  id: string
  user: User
  rating: number
  title: string
  content: string
  timestamp: string
  helpful: number
  images?: string[]
  verified: boolean
  productId?: string
  vendorId?: string
  productName?: string
  vendorName?: string
  productImage?: string
  reply?: {
    vendorName: string
    content: string
    timestamp: string
  }
}

// Extended Mock Data
const CURRENT_USER: User = {
  id: 'me',
  name: 'John Doe',
  avatar: 'https://i.pravatar.cc/150?u=me',
  online: true,
  email: 'john@ereja.com',
  role: 'vendor'
}

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=alice', online: true, role: 'vendor' },
  { id: 'u2', name: 'Bob Smith', avatar: 'https://i.pravatar.cc/150?u=bob', online: false, lastSeen: '2h ago', role: 'user' },
  { id: 'u3', name: 'Carol Davis', avatar: 'https://i.pravatar.cc/150?u=carol', online: true, role: 'vendor' },
  { id: 'u4', name: 'David Wilson', avatar: 'https://i.pravatar.cc/150?u=david', online: false, lastSeen: '5m ago', role: 'user' },
  { id: 'u5', name: 'Eva Martinez', avatar: 'https://i.pravatar.cc/150?u=eva', online: true, role: 'vendor' },
]

const MOCK_CARDS: Card[] = [
  {
    id: 'c1', type: 'stat', title: 'Total Revenue', value: '$124,850', trend: '+24.5%', subtitle: 'vs last month', style: 'default'
  },
  {
    id: 'c2', type: 'product', title: 'Premium Wireless Headphones', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    price: '$299', originalPrice: '$399', rating: 4.8, reviews: 256, category: 'Electronics', style: 'featured',
    vendor: { name: 'TechHub Store', avatar: 'https://i.pravatar.cc/100?u=tech', verified: true }
  },
  {
    id: 'c3', type: 'auction', title: 'Vintage Rolex Submariner', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    currentBid: '$8,450', bids: 47, countdown: '02:34:15', category: 'Luxury Watches', style: 'gradient',
    vendor: { name: 'LuxTime', avatar: 'https://i.pravatar.cc/100?u=lux', verified: true }
  },
  {
    id: 'c4', type: 'vendor', title: 'Luxe Boutique', image: 'https://i.pravatar.cc/150?u=luxe', rating: 4.9, reviews: 1240,
    category: 'Fashion & Apparel', description: 'Premium fashion destination', tags: ['Fashion', 'Luxury', 'Designer'], style: 'glass'
  },
  {
    id: 'c5', type: 'service', title: 'Professional Photography', image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400',
    price: '$150/hr', rating: 4.7, reviews: 89, category: 'Photography', location: 'New York, NY', style: 'default',
    vendor: { name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/100?u=sarah', verified: true }
  },
  {
    id: 'c6', type: 'logistics', title: 'Package #NYC-2847', status: 'In Transit', progress: 65, style: 'compact',
    tracking: { status: 'Out for Delivery', location: 'Brooklyn, NY', eta: 'Today, 3:00 PM',
      events: [
        { time: '10:30 AM', location: 'Brooklyn Distribution Center', status: 'Arrived' },
        { time: '8:00 AM', location: 'JFK Airport', status: 'Departed' },
        { time: 'Yesterday', location: 'Los Angeles, CA', status: 'Shipped' }
      ]
    }
  },
  {
    id: 'c7', type: 'event', title: 'Tech Startup Meetup 2024', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
    date: 'Dec 15, 2024', location: 'San Francisco, CA', attendees: 234, price: '$25', category: 'Networking', style: 'gradient'
  },
  {
    id: 'c8', type: 'advert', title: 'Flash Sale! 50% Off', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
    subtitle: 'Limited time offer on all electronics', countdown: '23:59:59', tags: ['Flash Sale', 'Electronics', '50% Off'], style: 'gradient'
  },
  {
    id: 'c9', type: 'storefront', title: 'Artisan Coffee Co.', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    rating: 4.8, reviews: 567, category: 'Food & Beverage', description: 'Premium specialty coffee', style: 'glass',
    tags: ['Coffee', 'Organic', 'Specialty']
  },
  {
    id: 'c10', type: 'stat', title: 'Active Orders', value: '247', trend: '+12', subtitle: 'pending shipment', style: 'compact'
  },
  {
    id: 'c11', type: 'order', title: 'Order #ORD-2847', orderDetails: { orderId: 'ORD-2847', items: 3, total: '$459.00', status: 'processing' },
    status: 'Processing', style: 'compact'
  },
  {
    id: 'c12', type: 'draft', title: 'Summer Collection Preview', subtitle: '12 items', status: 'Draft', style: 'minimal'
  },
  {
    id: 'c13', type: 'report', title: 'Weekly Sales Report', subtitle: 'Nov 18 - Nov 24', status: 'Ready', style: 'default'
  }
]

const MOCK_CHATS: Chat[] = [
  {
    id: 'chat1', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=alice', isGroup: false,
    lastMessage: 'Is the product still available?', lastMessageTime: '12:45 PM', unread: 2, online: true,
    messages: [
      { id: 'm1', senderId: 'u1', text: 'Hi! I saw your listing for the vintage watch', timestamp: new Date(), read: true },
      { id: 'm2', senderId: 'me', text: 'Hello! Yes, it\'s still available', timestamp: new Date(), read: true },
      { id: 'm3', senderId: 'u1', text: 'Is the product still available?', timestamp: new Date(), read: false }
    ]
  },
  {
    id: 'chat2', name: 'Vendor Partners', avatar: 'https://i.pravatar.cc/150?u=group1', isGroup: true,
    lastMessage: 'New shipment arrived at the warehouse', lastMessageTime: '11:20 AM', unread: 0, online: false,
    participants: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2]], messages: []
  },
  {
    id: 'chat3', name: 'Support AI', avatar: 'https://i.pravatar.cc/150?u=ai', isGroup: false,
    lastMessage: 'How can I help you today?', lastMessageTime: 'Yesterday', unread: 0, online: true, messages: []
  }
]

const MOCK_POSTS: Post[] = [
  {
    id: 'p1', user: MOCK_USERS[0],
    content: 'Just launched my new online store! 🎉 Check out our amazing collection of handcrafted jewelry.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600',
    likes: 234, comments: 45, shares: 12, timestamp: '2h ago', liked: false
  },
  {
    id: 'p2', user: MOCK_USERS[2],
    content: 'Amazing networking event last night! Met so many inspiring entrepreneurs.',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600',
    likes: 156, comments: 28, shares: 8, timestamp: '5h ago', liked: true
  }
]

const VENDORS_LIST: SidebarItem[] = [
  { id: 'v1', name: 'TechHub Store', sub: 'Electronics • 4.8⭐', img: 'https://i.pravatar.cc/100?u=tech', online: true, badge: 'Top Rated' },
  { id: 'v2', name: 'Luxe Boutique', sub: 'Fashion • 4.9⭐', img: 'https://i.pravatar.cc/100?u=luxe', online: true, badge: 'Premium' },
  { id: 'v3', name: 'Artisan Coffee', sub: 'Food & Beverage • 4.7⭐', img: 'https://i.pravatar.cc/100?u=coffee', online: false },
  { id: 'v4', name: 'Modern Living', sub: 'Home Decor • 4.6⭐', img: 'https://i.pravatar.cc/100?u=modern', online: true },
  { id: 'v5', name: 'Rare Finds', sub: 'Collectibles • 4.9⭐', img: 'https://i.pravatar.cc/100?u=rare', online: false, badge: 'Verified' }
]

const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    user: MOCK_USERS[0],
    rating: 5,
    title: 'Excellent sound quality!',
    content: 'These headphones exceeded my expectations. The noise cancellation is top-notch and the battery life is incredible. I use them daily for work calls and music. Highly recommend for anyone looking for premium audio experience.',
    timestamp: '2 days ago',
    helpful: 24,
    verified: true,
    productName: 'Premium Wireless Headphones',
    vendorName: 'TechHub Store',
    productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'],
    reply: {
      vendorName: 'TechHub Store',
      content: 'Thank you so much for your wonderful review! We are thrilled to hear you are enjoying your headphones.',
      timestamp: '1 day ago'
    }
  },
  {
    id: 'r2',
    user: MOCK_USERS[1],
    rating: 4,
    title: 'Great product, minor issues',
    content: 'Overall very satisfied with the purchase. The sound quality is amazing and the build quality feels premium. Only giving 4 stars because the app could use some improvements for the EQ settings.',
    timestamp: '1 week ago',
    helpful: 18,
    verified: true,
    productName: 'Premium Wireless Headphones',
    vendorName: 'TechHub Store',
    productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'
  },
  {
    id: 'r3',
    user: MOCK_USERS[2],
    rating: 5,
    title: 'Absolutely stunning timepiece',
    content: 'The vintage Rolex I purchased from LuxTime exceeded all expectations. The condition was exactly as described, and the authentication process gave me complete confidence. Will definitely buy again!',
    timestamp: '3 days ago',
    helpful: 42,
    verified: true,
    productName: 'Vintage Rolex Submariner',
    vendorName: 'LuxTime',
    productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=200'
    ]
  },
  {
    id: 'r4',
    user: MOCK_USERS[3],
    rating: 5,
    title: 'Best photography service in NYC',
    content: 'Sarah captured our corporate event beautifully. Professional, punctual, and delivered photos ahead of schedule. The quality was exceptional and she was great to work with throughout the event.',
    timestamp: '5 days ago',
    helpful: 31,
    verified: true,
    productName: 'Professional Photography',
    vendorName: 'Sarah Chen',
    productImage: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=100',
    reply: {
      vendorName: 'Sarah Chen',
      content: 'Thank you so much! It was a pleasure capturing your event. Looking forward to working with you again!',
      timestamp: '4 days ago'
    }
  },
  {
    id: 'r5',
    user: MOCK_USERS[4],
    rating: 3,
    title: 'Good but delivery was slow',
    content: 'The product quality is good, but it took longer than expected to arrive. Customer service was responsive when I reached out. Would recommend if you are not in a hurry.',
    timestamp: '2 weeks ago',
    helpful: 8,
    verified: true,
    productName: 'Minimalist Desk Lamp',
    vendorName: 'Modern Living',
    productImage: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=100'
  },
  {
    id: 'r6',
    user: { ...MOCK_USERS[0], id: 'u1b', name: 'Michael Brown', avatar: 'https://i.pravatar.cc/150?u=michael' },
    rating: 5,
    title: 'Luxury shopping at its finest',
    content: 'Luxe Boutique offers an exceptional shopping experience. The curated collection is impressive, and the personal styling service was incredibly helpful. My new favorite destination for designer pieces!',
    timestamp: '1 day ago',
    helpful: 15,
    verified: true,
    vendorName: 'Luxe Boutique',
    vendorId: 'v2'
  },
  {
    id: 'r7',
    user: { ...MOCK_USERS[1], id: 'u1c', name: 'Emma Wilson', avatar: 'https://i.pravatar.cc/150?u=emma' },
    rating: 4,
    title: 'Great coffee, cozy atmosphere',
    content: 'Artisan Coffee Co. has become my go-to spot. The single-origin beans are fantastic, and the baristas really know their craft. Only wish they had more seating during peak hours.',
    timestamp: '4 days ago',
    helpful: 22,
    verified: true,
    vendorName: 'Artisan Coffee Co.',
    vendorId: 'v3'
  },
  {
    id: 'r8',
    user: MOCK_USERS[4],
    rating: 5,
    title: 'Found my dream collectible!',
    content: 'Rare Finds helped me locate a limited edition item I had been searching for years. Their authentication process is thorough and the packaging was impeccable. True professionals!',
    timestamp: '6 days ago',
    helpful: 35,
    verified: true,
    productName: 'Limited Edition Collectible',
    vendorName: 'Rare Finds',
    productImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100'
  }
]

// Star Rating Component
const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`${sizeClass} ${star <= rating ? 'text-[#C5A059]' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// Online Status Indicator
const OnlineIndicator = ({ online, size = 'md' }: { online: boolean; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClass = size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
  return <span className={`${sizeClass} rounded-full ${online ? 'bg-green-500 pulse-online' : 'bg-gray-400'} inline-block`} />
}

// Mini Chart Component
const MiniChart = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data)
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`).join(' ')
  return (
    <svg viewBox="0 0 100 100" className="w-full h-16">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  )
}

// Card Components with various styles
const StatCard = ({ card, compact = false }: { card: Card; compact?: boolean }) => (
  <div className={`card-base p-6 bg-[#111b21] rounded-[24px] text-white shadow-xl ${compact ? 'p-4 rounded-xl' : ''}`}>
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">{card.title}</span>
      <button className="text-gray-500 hover:text-white transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>
    <div className="flex items-end gap-3">
      <h4 className={`${compact ? 'text-2xl' : 'text-4xl'} font-extrabold`}>{card.value}</h4>
      <span className="text-emerald-400 text-sm font-bold mb-1">{card.trend}</span>
    </div>
    <p className="text-gray-400 text-sm mt-2">{card.subtitle}</p>
  </div>
)

const ProductCard = ({ card, onClick, style = 'default' }: { card: Card; onClick: () => void; style?: CardStyle }) => {
  const baseClasses = "card-base overflow-hidden cursor-pointer"
  const styleClasses = {
    default: "bg-white rounded-[24px] border border-gray-100 shadow-sm",
    compact: "bg-white rounded-xl border border-gray-100 shadow-sm",
    featured: "bg-white rounded-[24px] border-2 border-emerald-500 shadow-xl",
    minimal: "bg-gray-50 rounded-xl",
    glass: "bg-white/80 backdrop-blur-lg rounded-[24px] border border-white/50 shadow-lg",
    gradient: "bg-gradient-to-br from-white to-gray-50 rounded-[24px] shadow-lg"
  }

  return (
    <div className={`${baseClasses} ${styleClasses[style]}`} onClick={onClick}>
      <div className="relative">
        <img src={card.image} alt={card.title} className={`${style === 'compact' ? 'h-32' : 'h-44'} w-full object-cover`} />
        {card.originalPrice && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">SALE</span>
        )}
        {card.vendor?.verified && (
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified
          </span>
        )}
      </div>
      <div className={`${style === 'compact' ? 'p-3' : 'p-4'}`}>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">{card.category}</span>
        <h4 className="font-bold text-gray-800 mb-1 line-clamp-2 text-sm">{card.title}</h4>
        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={card.rating || 0} />
          <span className="text-xs text-gray-500">({card.reviews})</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold text-lg">{card.price}</span>
            {card.originalPrice && <span className="text-gray-400 line-through text-sm">{card.originalPrice}</span>}
          </div>
          <button className="bg-[#111b21] text-white p-2 rounded-lg hover:bg-emerald-600 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

const AuctionCard = ({ card, onClick }: { card: Card; onClick: () => void }) => (
  <div className="card-base bg-white rounded-[24px] overflow-hidden border-2 border-orange-400 shadow-lg cursor-pointer" onClick={onClick}>
    <div className="relative">
      <img src={card.image} alt={card.title} className="h-40 w-full object-cover" />
      <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 countdown-pulse">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {card.countdown}
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <span className="text-white/80 text-xs font-medium">{card.bids} bids</span>
      </div>
    </div>
    <div className="p-4">
      <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-1 block">Live Auction</span>
      <h4 className="font-bold text-gray-800 mb-2 line-clamp-1">{card.title}</h4>
      <div className="flex justify-between items-end">
        <div>
          <span className="text-gray-500 text-xs">Current Bid</span>
          <p className="text-orange-600 font-extrabold text-xl">{card.currentBid}</p>
        </div>
        <button className="bg-orange-500 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition-all bid-glow">
          Place Bid
        </button>
      </div>
    </div>
  </div>
)

const VendorCard = ({ card, onClick, compact = false }: { card: Card; onClick: () => void; compact?: boolean }) => (
  <div className={`card-base bg-white ${compact ? 'rounded-xl p-4' : 'rounded-[24px] p-5'} border-2 border-emerald-500 shadow-xl cursor-pointer`} onClick={onClick}>
    <div className="flex items-center gap-3 mb-3">
      <img src={card.image} alt={card.title} className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full border-2 border-emerald-500 object-cover`} />
      <div>
        <h4 className="font-bold text-gray-800 leading-none">{card.title}</h4>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{card.category}</span>
      </div>
    </div>
    <div className="flex items-center gap-2 mb-2">
      <StarRating rating={card.rating || 0} />
      <span className="text-xs text-gray-500 font-medium">({card.reviews})</span>
    </div>
    {!compact && card.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{card.description}</p>}
    {!compact && card.tags && (
      <div className="flex flex-wrap gap-1 mb-3">
        {card.tags.slice(0, 3).map((tag, i) => (
          <span key={i} className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-lg">{tag}</span>
        ))}
      </div>
    )}
    <button className="w-full py-2 border-2 border-[#111b21] text-[#111b21] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#111b21] hover:text-white transition-all">
      Visit Store
    </button>
  </div>
)

const ServiceCard = ({ card, onClick }: { card: Card; onClick: () => void }) => (
  <div className="card-base bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm cursor-pointer" onClick={onClick}>
    <div className="relative h-32">
      <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
      <div className="absolute top-3 left-3 bg-purple-500 text-white text-[10px] font-black px-3 py-1 rounded-lg">SERVICE</div>
    </div>
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <img src={card.vendor?.avatar} alt={card.vendor?.name || 'Vendor'} className="w-5 h-5 rounded-full" />
        <span className="text-xs font-medium text-gray-700">{card.vendor?.name}</span>
      </div>
      <h4 className="font-bold text-gray-800 text-sm mb-1">{card.title}</h4>
      <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
        {card.location}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <StarRating rating={card.rating || 0} />
          <span className="text-emerald-600 font-bold mt-1 block">{card.price}</span>
        </div>
        <button className="bg-purple-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-purple-600 transition-all">Book</button>
      </div>
    </div>
  </div>
)

const LogisticsCard = ({ card, onClick }: { card: Card; onClick: () => void }) => (
  <div className="card-base p-5 bg-white rounded-[24px] border border-gray-200 shadow-sm cursor-pointer" onClick={onClick}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <div>
          <h4 className="font-bold text-gray-800 text-sm">{card.title}</h4>
          <span className="text-xs text-emerald-600 font-medium">{card.tracking?.status}</span>
        </div>
      </div>
      <span className="logistics-pulse w-2 h-2 bg-blue-500 rounded-full"></span>
    </div>
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Progress</span>
        <span>{card.progress}%</span>
      </div>
      <Progress value={card.progress} className="h-1.5" />
    </div>
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-center gap-2 text-gray-600 text-xs">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>ETA: {card.tracking?.eta}</span>
      </div>
    </div>
  </div>
)

const EventCard = ({ card, onClick }: { card: Card; onClick: () => void }) => (
  <div className="card-base bg-white rounded-[24px] overflow-hidden shadow-lg cursor-pointer" onClick={onClick}>
    <div className="relative h-32 event-gradient">
      <img src={card.image} alt={card.title} className="w-full h-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-3 left-3 right-3">
        <span className="text-white/80 text-xs font-medium">{card.category}</span>
        <h4 className="text-white font-bold">{card.title}</h4>
      </div>
    </div>
    <div className="p-4">
      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{card.date}</span>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="truncate">{card.location}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <img key={i} src={`https://i.pravatar.cc/30?u=e${i}`} alt="Attendee" className="w-5 h-5 rounded-full border-2 border-white" />
            ))}
          </div>
          <span className="text-xs text-gray-500">+{card.attendees}</span>
        </div>
        <span className="text-purple-600 font-bold text-sm">{card.price}</span>
      </div>
      <button className="w-full py-2 mt-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all">
        Register
      </button>
    </div>
  </div>
)

const AdvertCard = ({ card, onClick }: { card: Card; onClick: () => void }) => (
  <div className="card-base bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[24px] overflow-hidden shadow-xl cursor-pointer" onClick={onClick}>
    <div className="relative h-32">
      <img src={card.image} alt={card.title} className="w-full h-full object-cover opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-lg countdown-pulse">FLASH SALE</div>
      <div className="absolute bottom-3 right-3 bg-white text-black text-xs font-black px-2 py-1 rounded-lg countdown-pulse">{card.countdown}</div>
    </div>
    <div className="p-4 text-white">
      <h4 className="font-bold text-lg mb-1">{card.title}</h4>
      <p className="text-white/80 text-sm mb-3">{card.subtitle}</p>
      <button className="w-full py-2.5 bg-white text-orange-600 rounded-xl text-sm font-black hover:bg-gray-100 transition-all">
        Shop Now
      </button>
    </div>
  </div>
)

const StorefrontCard = ({ card, onClick }: { card: Card; onClick: () => void }) => (
  <div className="card-base bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm cursor-pointer" onClick={onClick}>
    <div className="relative h-24">
      <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
    <div className="relative p-4">
      <div className="absolute -top-6 left-4">
        <img src={card.image} alt={card.title || 'Store'} className="w-12 h-12 rounded-xl border-4 border-white object-cover shadow-lg" />
      </div>
      <div className="pt-6">
        <h4 className="font-bold text-gray-800 text-sm">{card.title}</h4>
        <span className="text-xs text-gray-400">{card.category}</span>
        <div className="flex items-center gap-2 mt-1">
          <StarRating rating={card.rating || 0} />
          <span className="text-xs text-gray-500">({card.reviews})</span>
        </div>
      </div>
    </div>
  </div>
)

const OrderCard = ({ card, onClick }: { card: Card; onClick: () => void }) => (
  <div className="card-base p-4 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-emerald-300 transition-all" onClick={onClick}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          card.orderDetails?.status === 'processing' ? 'bg-blue-100' :
          card.orderDetails?.status === 'shipped' ? 'bg-purple-100' :
          card.orderDetails?.status === 'delivered' ? 'bg-emerald-100' : 'bg-yellow-100'
        }`}>
          <svg className={`w-5 h-5 ${
            card.orderDetails?.status === 'processing' ? 'text-blue-600' :
            card.orderDetails?.status === 'shipped' ? 'text-purple-600' :
            card.orderDetails?.status === 'delivered' ? 'text-emerald-600' : 'text-yellow-600'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <div>
          <h4 className="font-bold text-gray-800 text-sm">{card.title}</h4>
          <span className="text-xs text-gray-500">{card.orderDetails?.items} items</span>
        </div>
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
        card.orderDetails?.status === 'processing' ? 'bg-blue-100 text-blue-600' :
        card.orderDetails?.status === 'shipped' ? 'bg-purple-100 text-purple-600' :
        card.orderDetails?.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'
      }`}>
        {card.orderDetails?.status}
      </span>
    </div>
    <div className="flex justify-between items-center">
      <span className="font-bold text-emerald-600">{card.orderDetails?.total}</span>
      <button className="text-xs text-gray-500 hover:text-emerald-600 font-medium">View Details →</button>
    </div>
  </div>
)

const DraftCard = ({ card, onClick }: { card: Card; onClick: () => void }) => (
  <div className="card-base p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all" onClick={onClick}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-800 text-sm">{card.title}</h4>
        <span className="text-xs text-gray-500">{card.subtitle}</span>
      </div>
      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg font-bold">{card.status}</span>
    </div>
  </div>
)

const ReportCard = ({ card, onClick }: { card: Card; onClick: () => void }) => (
  <div className="card-base p-4 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={onClick}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-800 text-sm">{card.title}</h4>
        <span className="text-xs text-gray-500">{card.subtitle}</span>
      </div>
      <button className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-600 transition-all">
        View
      </button>
    </div>
  </div>
)

// Sidebar Item Component
const SidebarItemComponent = ({ item, active, onClick, showBadge = true }: { item: SidebarItem; active: boolean; onClick: () => void; showBadge?: boolean }) => (
  <div
    className={`flex items-center px-4 py-3 gap-3 cursor-pointer transition-all border-b border-gray-100 ${active ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : 'hover:bg-gray-50'}`}
    onClick={onClick}
  >
    {item.img ? (
      <div className="relative shrink-0">
        <img src={item.img} alt={item.name} className="w-11 h-11 rounded-full object-cover" />
        {item.online !== undefined && (
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${item.online ? 'bg-green-500' : 'bg-gray-400'}`} />
        )}
      </div>
    ) : (
      <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center text-lg shrink-0">
        {item.icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-0.5">
        <h4 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h4>
        {item.time && <span className="text-[10px] text-gray-400 font-medium">{item.time}</span>}
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500 truncate">{item.sub}</p>
        <div className="flex items-center gap-1">
          {item.badge && showBadge && (
            <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-bold">{item.badge}</span>
          )}
          {item.unread ? (
            <span className="bg-emerald-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{item.unread}</span>
          ) : null}
        </div>
      </div>
    </div>
  </div>
)

// Chat Message Component
const ChatMessage = ({ message, isOwn }: { message: Message; isOwn: boolean }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
    <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isOwn ? 'bg-[#d9fdd3]' : 'bg-white'} shadow-sm`}>
      <p className="text-sm text-gray-800">{message.text}</p>
      <div className="flex items-center gap-1 justify-end mt-1">
        <span className="text-[10px] text-gray-400">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isOwn && (
          <svg className={`w-4 h-4 ${message.read ? 'text-blue-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
          </svg>
        )}
      </div>
    </div>
  </div>
)

// Post Component
const PostCard = ({ post, onComment, isActive }: { post: Post; onComment: (post: Post) => void; isActive: boolean }) => {
  const [liked, setLiked] = useState(post.liked)
  const [likes, setLikes] = useState(post.likes)
  const [saved, setSaved] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')

  const handleLike = () => {
    setLikes(liked ? likes - 1 : likes + 1)
    setLiked(!liked)
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isActive ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-100' : 'border-gray-200'}`}>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar><AvatarImage src={post.user.avatar} /><AvatarFallback>{post.user.name[0]}</AvatarFallback></Avatar>
          <div>
            <h4 className="font-bold text-gray-800 text-sm">{post.user.name}</h4>
            <span className="text-xs text-gray-500">{post.timestamp}</span>
          </div>
          {post.user.online && <OnlineIndicator online={true} size="sm" />}
        </div>
        <p className="text-gray-700 text-sm mb-3">{post.content}</p>
      </div>
      {post.image && <img src={post.image} alt="Post content" className="w-full h-56 object-cover" />}
      <div className="p-4 pt-3">
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <button onClick={handleLike} className={`flex items-center gap-2 text-sm ${liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors`}>
            <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{likes}</span>
          </button>
          <button onClick={() => onComment(post)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <span>{post.comments}</span>
          </button>
          <div className="flex items-center gap-3 text-gray-500">
            <button onClick={() => setSaved((s) => !s)} className={`flex items-center gap-2 text-sm ${saved ? 'text-emerald-600' : 'text-gray-500'} hover:text-emerald-500 transition-colors`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              <span>{saved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>
      {isActive && (
        <div className="px-4 pb-4">
          <div className="flex items-start gap-2">
            <Textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 resize-none min-h-[70px]"
            />
            <Button
              onClick={() => { setCommentDraft('') }}
              className="bg-emerald-500 hover:bg-emerald-600 rounded-xl"
            >
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Review Card Component
const ReviewCard = ({ review, onClick }: { review: Review; onClick?: () => void }) => {
  const [helpful, setHelpful] = useState(review.helpful)
  const [markedHelpful, setMarkedHelpful] = useState(false)

  const handleHelpful = () => {
    if (!markedHelpful) {
      setHelpful(helpful + 1)
      setMarkedHelpful(true)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all" onClick={onClick}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={review.user.avatar} />
            <AvatarFallback>{review.user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-bold text-gray-800 text-sm">{review.user.name}</h4>
              {review.verified && (
                <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded">VERIFIED</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-gray-500">{review.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Product Reference */}
        {(review.productName || review.vendorName) && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
            {review.productImage && (
              <img src={review.productImage} alt={review.productName || ''} className="w-10 h-10 rounded-lg object-cover" />
            )}
            <div className="flex-1 min-w-0">
              {review.productName && <p className="text-xs font-medium text-gray-800 truncate">{review.productName}</p>}
              <p className="text-xs text-gray-500">by {review.vendorName}</p>
            </div>
          </div>
        )}

        {/* Review Content */}
        <h5 className="font-semibold text-gray-800 text-sm mb-1">{review.title}</h5>
        <p className="text-gray-600 text-sm leading-relaxed">{review.content}</p>

        {/* Review Images */}
        {review.images && review.images.length > 0 && (
          <div className="flex gap-2 mt-3">
            {review.images.map((img, i) => (
              <img key={i} src={img} alt="Review" className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity" />
            ))}
          </div>
        )}

        {/* Vendor Reply */}
        {review.reply && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-emerald-500">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gray-700">{review.reply.vendorName}</span>
              <span className="text-xs text-gray-400">• {review.reply.timestamp}</span>
            </div>
            <p className="text-xs text-gray-600">{review.reply.content}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <button 
            onClick={(e) => { e.stopPropagation(); handleHelpful(); }}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${markedHelpful ? 'text-emerald-600' : 'text-gray-500 hover:text-emerald-600'}`}
          >
            <svg className="w-4 h-4" fill={markedHelpful ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            Helpful ({helpful})
          </button>
          <button className="text-xs text-gray-500 hover:text-gray-700 font-medium">Report</button>
        </div>
      </div>
    </div>
  )
}

// Main App Component
export default function Home() {
  // State
  const [currentView, setCurrentView] = useState<ViewType>('canvas')
  const [dashboardSection, setDashboardSection] = useState<DashboardSection>('overview')
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('overview')
  const [cards] = useState<Card[]>(MOCK_CARDS)
  const [chats] = useState<Chat[]>(MOCK_CHATS)
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [posts] = useState<Post[]>(MOCK_POSTS)
  
  const [reviews] = useState<Review[]>(MOCK_REVIEWS)
  const [aiInput, setAiInput] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [showAuctionModal, setShowAuctionModal] = useState(false)
  const [bidAmount, setBidAmount] = useState('')
  const [viewTitle, setViewTitle] = useState('Workspace')
  const [aiExpanded, setAiExpanded] = useState(false)
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [aiAttachments, setAiAttachments] = useState<File[]>([])
  const [isAiDragging, setIsAiDragging] = useState(false)
  const [draggedCard, setDraggedCard] = useState<string | null>(null)
  const [primaryNavCollapsed, setPrimaryNavCollapsed] = useState(false)
  const [activePostComments, setActivePostComments] = useState<Post | null>(null)
  const [commentInput, setCommentInput] = useState('')
  const [activeReplyIndex, setActiveReplyIndex] = useState<number | null>(null)
  const [showRevenueDatePicker, setShowRevenueDatePicker] = useState(false)
  const [revenueRange, setRevenueRange] = useState('This Month')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({ title: '', content: '' })
  const [documentsNav, setDocumentsNav] = useState<DocumentsNav>('overview')

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showCreatePostModal, setShowCreatePostModal] = useState(false)
  const [showNearbyVendors, setShowNearbyVendors] = useState(false)
  const [showMobileSubSidebar, setShowMobileSubSidebar] = useState(false)

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const [currentUser] = useState<User>(CURRENT_USER)

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'user' as 'user' | 'vendor' })
  const [newPost, setNewPost] = useState({ content: '', image: '' })

  // Create post attachments & location
  const [createPostAttachments, setCreatePostAttachments] = useState<File[]>([])
  const [createPostLocation, setCreatePostLocation] = useState<string>('')
  const createFileInputRef = useRef<HTMLInputElement>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const aiTextAreaRef = useRef<HTMLTextAreaElement>(null)
  const aiFileInputRef = useRef<HTMLInputElement>(null)
  const aiCameraInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  // Infinite scroll for posts & comments
  const [postsPage, setPostsPage] = useState(1)
  const postsPageSize = 5
  const feedEndRef = useRef<HTMLDivElement | null>(null)

  const ALL_COMMENTS = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: `c${i + 1}`,
    user: MOCK_USERS[i % MOCK_USERS.length],
    content: `Sample comment #${i + 1}`,
    timestamp: `${i + 1}h ago`
  })), [])
  const [commentsPage, setCommentsPage] = useState(1)
  const commentsPageSize = 6
  const commentsEndRef = useRef<HTMLDivElement | null>(null)

  const visiblePosts = posts.slice(0, postsPage * postsPageSize)
  const visibleComments = ALL_COMMENTS.slice(0, commentsPage * commentsPageSize)

  const handleToggleComments = (post: Post) => {
    setActivePostComments(prev => prev?.id === post.id ? null : post)
  }

  // Sidebar items based on view
  const getSidebarItems = useCallback((view: ViewType): SidebarItem[] => {
    const canvasItems: SidebarItem[] = [
      { id: 'overview', name: 'My Dashboard', sub: 'Last sync: 2m ago', icon: '📊' },
      { id: 'shared', name: 'Shared Canvas', sub: '3 members active', icon: '👥' },
      { id: 'drafts', name: 'Marketplace Drafts', sub: '12 items pending', icon: '🗂️' },
      { id: 'orders', name: 'Order Queue', sub: '8 processing', icon: '📦' },
      { id: 'analytics', name: 'Analytics Hub', sub: 'Weekly report ready', icon: '📈' },
      { id: 'documents', name: 'Documents', sub: 'Templates & history', icon: '📝' },
    ]

    const dashboardItems: SidebarItem[] = [
      { id: 'overview', name: 'Sales Analytics', sub: 'Real-time data', icon: '📊' },
      { id: 'revenue', name: 'Revenue Reports', sub: 'Monthly summary', icon: '💰' },
      { id: 'analytics', name: 'User Metrics', sub: 'Active users', icon: '👥' },
      { id: 'orders', name: 'Order Statistics', sub: 'Fulfillment rate', icon: '📦' }
    ]

    const revenueItems: SidebarItem[] = [
      { id: 'overview', name: 'Sales Analytics', sub: 'Real-time data', icon: '📊' },
      { id: 'revenue', name: 'Revenue Reports', sub: 'Midnight Spreadsheet', icon: '💰' },
      { id: 'analytics', name: 'User Metrics', sub: 'Active users', icon: '👥' },
      { id: 'orders', name: 'Order Statistics', sub: 'Fulfillment rate', icon: '📦' }
    ]

    const documentsItems: SidebarItem[] = [
      { id: 'overview', name: 'Documents Overview', sub: 'Templates & quick actions', icon: '📝' },
      { id: 'history', name: 'Recent Records', sub: 'Issued docs', icon: '⏱️' },
    ]

    switch (view) {
      case 'canvas':
        return canvasItems
      case 'documents':
        return documentsItems
      case 'dashboard':
        return dashboardItems
      case 'revenue':
        return revenueItems
      case 'social':
        return VENDORS_LIST
      case 'messages':
        return chats.map(chat => ({
          id: chat.id, name: chat.name, sub: chat.lastMessage, img: chat.avatar,
          time: chat.lastMessageTime, unread: chat.unread, online: chat.online
        }))
      case 'reviews':
        return [
          { id: 'r1', name: 'All Reviews', sub: `${reviews.length} total reviews`, icon: '⭐' },
          { id: 'r2', name: 'Product Reviews', sub: `${reviews.filter(r => r.productId).length} reviews`, icon: '🛍️' },
          { id: 'r3', name: 'Vendor Reviews', sub: `${reviews.filter(r => r.vendorId).length} reviews`, icon: '🏪' },
          { id: 'r4', name: '5-Star Reviews', sub: `${reviews.filter(r => r.rating === 5).length} reviews`, icon: '🌟' },
          { id: 'r5', name: 'Needs Response', sub: `${reviews.filter(r => !r.reply).length} pending`, icon: '💬' }
        ]
      default:
        return []
    }
  }, [chats, reviews])

  const getViewNotificationCount = (view: ViewType) => {
    if (view === 'messages') return chats.reduce((acc, c) => acc + (c.unread || 0), 0)
    if (view === 'reviews') return reviews.filter(r => !r.reply).length
    if (view === 'social') return posts.length > 0 ? 1 : 0
    return 0
  }

  // Initialize sidebar items with useMemo
  const effectiveSidebarView: ViewType = currentView === 'documents' ? 'canvas' : currentView
  const sidebarItemsMemo = useMemo(() => getSidebarItems(effectiveSidebarView), [effectiveSidebarView, getSidebarItems])

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages])

  // Resize handler
  const handleMouseDown = () => setIsResizing(true)
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    const newWidth = Math.min(Math.max(e.clientX - 75, 280), 500)
    setSidebarWidth(newWidth)
  }, [isResizing])

  const handleMouseUp = useCallback(() => setIsResizing(false), [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const handleAiInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAiInput(e.target.value)
    if (aiTextAreaRef.current) {
      aiTextAreaRef.current.style.height = 'auto'
      aiTextAreaRef.current.style.height = `${Math.min(aiTextAreaRef.current.scrollHeight, 320)}px`
    }
  }

  const handleAiFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setAiAttachments(prev => [...prev, ...Array.from(files)])
  }

  // View switching
  const handleViewSwitch = (view: ViewType) => {
    setCurrentView(view)
    setActiveChat(null)
    setShowNearbyVendors(false)
    setDashboardSection('overview')
    if (isMobile) setShowMobileSubSidebar(true)
    if (isMobile && view === 'messages') {
      setAiExpanded(false) // will be opened explicitly by user
    }
    
    // Set default sidebar item for the view
    const viewItems = getSidebarItems(view)
    if (viewItems.length > 0) {
      setActiveSidebarItem(viewItems[0].id)
    }
    
    switch (view) {
      case 'canvas': setViewTitle('Workspace'); break
      case 'social': setViewTitle('Nearby Vendors'); break
      case 'messages': setViewTitle('Chats'); break
      case 'dashboard': setViewTitle('Analytics'); break
      case 'revenue': setViewTitle('Revenue Reports'); break
      case 'reviews': setViewTitle('Reviews'); break
      case 'documents': setViewTitle('Documents'); break
    }
  }

  // Handle sidebar item click
  const handleSidebarItemClick = (itemId: string) => {
    if (itemId === 'documents') {
      setCurrentView('documents')
      setViewTitle('Documents')
      setDocumentsNav('overview')
      setActiveSidebarItem('documents')
      if (isMobile) setShowMobileSubSidebar(true)
      return
    }
    if (currentView === 'documents') {
      setCurrentView('canvas')
      setDashboardSection(itemId as DashboardSection)
      setActiveSidebarItem(itemId)
      return
    }
    setActiveSidebarItem(itemId)
    if (itemId === 'revenue') {
      setCurrentView('revenue')
      setDashboardSection('revenue')
      setShowRevenueDatePicker(false)
      return
    }
    if (currentView === 'messages') {
      const chat = chats.find(c => c.id === itemId)
      if (chat) setActiveChat(chat)
    } else if (currentView === 'canvas' || currentView === 'dashboard' || currentView === 'revenue') {
      if (currentView === 'revenue') setCurrentView('dashboard')
      setDashboardSection(itemId as DashboardSection)
    }
  }

  // Send message
  const handleSendMessage = () => {
    if (!chatInput.trim() || !activeChat) return
    const newMessage: Message = {
      id: `m${Date.now()}`, senderId: 'me', text: chatInput, timestamp: new Date(), read: false
    }
    setActiveChat(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null)
    setChatInput('')
  }

  // AI Chat
  const handleAIRequest = () => {
    if (!aiInput.trim() && aiAttachments.length === 0) return
    const attachmentNote = aiAttachments.length ? ` [${aiAttachments.length} attachment${aiAttachments.length > 1 ? 's' : ''}]` : ''
    const userMsg = { role: 'user' as const, content: aiInput + attachmentNote }
    setAiMessages(prev => [...prev, userMsg])
    setAiAttachments([])
    
    setTimeout(() => {
      const responses = [
        "I found 3 local plumbers with 4+ stars near you. Would you like me to show them?",
        "I can help you with that! Here are some recommendations based on your preferences.",
        "Your sales have increased by 24% this week. Would you like a detailed breakdown?",
        "I've organized your dashboard to focus on fashion sales as requested."
      ]
      const aiMsg = { role: 'assistant' as const, content: responses[Math.floor(Math.random() * responses.length)] }
      setAiMessages(prev => [...prev, aiMsg])
    }, 1000)
    
    setAiInput('')
    if (aiTextAreaRef.current) aiTextAreaRef.current.style.height = 'auto'
    if (!aiExpanded) setAiExpanded(true)
  }

  // Login
  const handleLogin = () => {
    if (!loginForm.email || !loginForm.password) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' })
      return
    }
    setIsLoggedIn(true)
    setShowLoginModal(false)
    toast({ title: 'Welcome back!', description: 'You have successfully logged in.' })
  }

  // Register
  const handleRegister = () => {
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' })
      return
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }
    setIsLoggedIn(true)
    setShowRegisterModal(false)
    toast({ title: 'Welcome to Ereja!', description: 'Your account has been created successfully.' })
  }

  // Create Post
  const handleCreatePost = () => {
    if (!newPost.content.trim()) {
      toast({ title: 'Error', description: 'Please add some content', variant: 'destructive' })
      return
    }
    setShowCreatePostModal(false)
    setNewPost({ content: '', image: '' })
    setCreatePostAttachments([])
    setCreatePostLocation('')
    toast({ title: 'Post Created!', description: 'Your post has been published.' })
  }

  const handleCreateFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const arr = Array.from(files)
    setCreatePostAttachments((prev) => [...prev, ...arr])
    // preview first image if none set
    const first = arr[0]
    if (first && first.type.startsWith('image/')) {
      const url = URL.createObjectURL(first)
      setNewPost((p) => ({ ...p, image: url }))
    }
  }

  const handlePickLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Location Unavailable', description: 'Geolocation is not supported by your browser.', variant: 'destructive' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        setCreatePostLocation(coords)
        toast({ title: 'Location set', description: coords })
      },
      (err) => {
        toast({ title: 'Location Error', description: err.message, variant: 'destructive' })
      }
    )
  }

  // Infinite scroll observers
  useEffect(() => {
    if (!feedEndRef.current) return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setPostsPage((p) => {
            const maxPages = Math.ceil(posts.length / postsPageSize)
            return p < maxPages ? p + 1 : p
          })
        }
      })
    }, { root: null, rootMargin: '400px' })
    obs.observe(feedEndRef.current)
    return () => obs.disconnect()
  }, [feedEndRef])

  useEffect(() => {
    if (!commentsEndRef.current) return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setCommentsPage((p) => {
          const maxPages = Math.ceil(ALL_COMMENTS.length / commentsPageSize)
          return p < maxPages ? p + 1 : p
        })
      })
    }, { root: null, rootMargin: '200px' })
    obs.observe(commentsEndRef.current)
    return () => obs.disconnect()
  }, [commentsEndRef])

  // Place Bid
  const handlePlaceBid = () => {
    if (!bidAmount || !selectedCard) return
    toast({ title: 'Bid Placed!', description: `Your bid of $${bidAmount} has been placed.` })
    setShowAuctionModal(false)
    setBidAmount('')
  }

  // Card click
  const handleCardClick = (card: Card) => {
    setSelectedCard(card)
    if (card.type === 'auction') setShowAuctionModal(true)
  }

  // Render card
  const renderCard = (card: Card) => {
    const props = { card, onClick: () => handleCardClick(card) }
    switch (card.type) {
      case 'stat': return <StatCard key={card.id} {...props} compact={card.style === 'compact'} />
      case 'product': return <ProductCard key={card.id} {...props} style={card.style || 'default'} />
      case 'auction': return <AuctionCard key={card.id} {...props} />
      case 'vendor': return <VendorCard key={card.id} {...props} compact={card.style === 'compact'} />
      case 'service': return <ServiceCard key={card.id} {...props} />
      case 'logistics': return <LogisticsCard key={card.id} {...props} />
      case 'event': return <EventCard key={card.id} {...props} />
      case 'advert': return <AdvertCard key={card.id} {...props} />
      case 'storefront': return <StorefrontCard key={card.id} {...props} />
      case 'order': return <OrderCard key={card.id} {...props} />
      case 'draft': return <DraftCard key={card.id} {...props} />
      case 'report': return <ReportCard key={card.id} {...props} />
      default: return null
    }
  }

  // Filter sidebar items
  const filteredSidebarItems = sidebarItemsMemo.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get cards for dashboard section
  const getSectionCards = () => {
    switch (dashboardSection) {
      case 'orders': return cards.filter(c => c.type === 'order' || c.type === 'logistics')
      case 'drafts': return cards.filter(c => c.type === 'draft' || c.type === 'product')
      case 'analytics': return cards.filter(c => c.type === 'report' || c.type === 'stat')
      default: return cards.filter(c => ['product', 'auction', 'vendor', 'service', 'event', 'advert', 'storefront', 'stat'].includes(c.type))
    }
  }

  const renderMonth = (label: string, offset: number, days: number, range?: [number, number]) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-semibold text-[#0F172A]">
        <span>{label}</span>
        <span className="text-xs text-gray-500">2026</span>
      </div>
      <div className="grid grid-cols-7 text-[11px] text-gray-400">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => <span key={d} className="text-center py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm">
        {Array.from({ length: offset }).map((_, i) => <span key={`b-${label}-${i}`} className="py-1.5" />)}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1
          const inRange = range && day >= range[0] && day <= range[1]
          return (
            <span
              key={`${label}-${day}`}
              className={`text-center py-1.5 rounded-full cursor-pointer transition-colors ${inRange ? 'bg-[#3B82F6] text-white shadow' : 'hover:bg-blue-50 text-[#0F172A]'}`}
            >
              {day}
            </span>
          )
        })}
      </div>
    </div>
  )

  const revenueSeries = [48, 62, 70, 64, 86, 104, 120, 142, 155, 180]
  const revenueMax = Math.max(...revenueSeries)
  const areaLinePoints = revenueSeries.map((v, i) => {
    const x = (i / (revenueSeries.length - 1)) * 100
    const y = 120 - (v / revenueMax) * 100
    return `${x},${y}`
  }).join(' ')
  const areaPath = `M0,120 L${areaLinePoints.replace(/ /g, ' L')} L100,120 Z`
  const scrubIndex = 6
  const scrubX = (scrubIndex / (revenueSeries.length - 1)) * 100
  const scrubValue = revenueSeries[scrubIndex]

  const donutSlices = [
    { label: 'Subscriptions', value: 58, color: '#3B82F6' },
    { label: 'Marketplace', value: 22, color: '#00E5E5' },
    { label: 'Services', value: 15, color: '#6366F1' },
  ]
  const donutTotal = donutSlices.reduce((acc, s) => acc + s.value, 0)
  let donutCursor = 0
  const donutGradient = donutSlices.map((slice) => {
    const start = donutCursor
    const end = start + (slice.value / 100) * 360
    donutCursor = end
    return `${slice.color} ${start}deg ${end}deg`
  }).concat(`${donutCursor < 360 ? '#E5E7EB ' + donutCursor + 'deg 360deg' : ''}`).join(', ')

  const documentTemplates = [
    {
      id: 'invoice',
      title: 'Invoice Template',
      description: 'Bill clients with tax, terms, and payment links.',
      accent: 'bg-emerald-50 text-emerald-700',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: 'credit',
      title: 'Credit Note',
      description: 'Issue adjustments and store credits in seconds.',
      accent: 'bg-blue-50 text-blue-700',
      icon: <Receipt className="w-5 h-5" />,
    },
    {
      id: 'quote',
      title: 'Quotation',
      description: 'Send polished quotes with sign + pay options.',
      accent: 'bg-purple-50 text-purple-700',
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
  ]

  const recentDocuments = [
    { id: 'd1', date: 'Mar 16, 2026', type: 'Invoice', recipient: 'Acme Corp', amount: '$4,200', status: 'Sent' },
    { id: 'd2', date: 'Mar 15, 2026', type: 'Quotation', recipient: 'Northwind', amount: '$7,150', status: 'Pending' },
    { id: 'd3', date: 'Mar 14, 2026', type: 'Credit Note', recipient: 'Lumina Labs', amount: '-$620', status: 'Issued' },
    { id: 'd4', date: 'Mar 13, 2026', type: 'Invoice', recipient: 'Orbit Design', amount: '$2,980', status: 'Paid' },
    { id: 'd5', date: 'Mar 12, 2026', type: 'Invoice', recipient: 'Foxtrot LLC', amount: '$1,240', status: 'Draft' },
  ]
  const docStatusStyles: Record<string, string> = {
    Sent: 'bg-blue-50 text-blue-700',
    Pending: 'bg-amber-50 text-amber-700',
    Issued: 'bg-indigo-50 text-indigo-700',
    Paid: 'bg-emerald-50 text-emerald-700',
    Draft: 'bg-gray-100 text-gray-600',
  }

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center min-h-screen bg-[#DADBD3] p-0 lg:p-4">
        <div className="flex w-full h-screen lg:h-[calc(100vh-2rem)] lg:rounded-2xl shadow-2xl bg-white overflow-hidden relative border border-gray-200">
          
          {/* Global OS Rail */}
          <aside className={`bg-[#111b21] flex flex-col items-center py-5 gap-6 shrink-0 z-50 transition-all duration-400 relative ${primaryNavCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-[75px]'}`}>
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <button
              className="absolute top-3 right-2 text-gray-400 hover:text-white transition-colors"
              onClick={() => setTimeout(() => setPrimaryNavCollapsed((prev) => !prev), 140)}
            >
              {primaryNavCollapsed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M5 12h14m-7-7 7 7-7 7" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M19 12H5m7-7-7 7 7 7" /></svg>
              )}
            </button>

            <nav className="flex flex-col gap-5 text-gray-400">
              {[
                { view: 'canvas' as ViewType, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>, label: 'Infinity Canvas' },
                { view: 'social' as ViewType, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, label: 'Social Feed' },
                { view: 'messages' as ViewType, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>, label: 'Messaging' },
                { view: 'reviews' as ViewType, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>, label: 'Reviews' },
                { view: 'dashboard' as ViewType, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, label: 'Analytics' },
              ].map(({ view, icon, label }) => {
                const badge = getViewNotificationCount(view)
                return (
                  <Tooltip key={view}>
                    <TooltipTrigger asChild>
                      <button onClick={() => handleViewSwitch(view)} className={`relative hover:text-white transition-colors p-1.5 ${currentView === view ? 'text-emerald-400' : ''}`}>
                        {icon}
                        {badge > 0 && (
                          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-[#111b21]" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                )
              })}
            </nav>

            <div className="mt-auto flex flex-col gap-5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setAiExpanded(!aiExpanded)} className="text-emerald-500 hover:scale-110 transition-transform">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">AI Assistant</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => isLoggedIn ? setShowProfileModal(true) : setShowLoginModal(true)} className="relative">
                    <Avatar className="w-10 h-10 border-2 border-emerald-500 cursor-pointer hover:scale-105 transition-transform">
                      <AvatarImage src={isLoggedIn ? currentUser.avatar : undefined} />
                      <AvatarFallback className="bg-gray-600 text-white text-xs">?</AvatarFallback>
                    </Avatar>
                    {isLoggedIn && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#111b21]" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{isLoggedIn ? currentUser.name : 'Login'}</TooltipContent>
              </Tooltip>
            </div>
          </aside>
          {primaryNavCollapsed && (
            <button
              className="absolute left-2 top-3 z-50 bg-[#111b21] text-white rounded-full p-2 shadow-lg hover:scale-105 transition-transform"
              onClick={() => setTimeout(() => setPrimaryNavCollapsed(false), 120)}
              aria-label="Expand sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M5 12h14m-7-7 7 7-7 7" /></svg>
            </button>
          )}

          {/* Mobile Sub-Sidebar (sheet) */}
          <Sheet open={showMobileSubSidebar} onOpenChange={setShowMobileSubSidebar}>
            <SheetContent side="left" className="p-0 w-[80vw] max-w-md">
              <SheetHeader className="px-4 py-3 border-b">
                <SheetTitle>{viewTitle}</SheetTitle>
              </SheetHeader>
              <div className="p-3">
                <div className="bg-gray-100 flex items-center px-3 rounded-xl">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent w-full text-sm py-2.5 px-3 outline-none" />
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-140px)] px-2 pb-4">
                {filteredSidebarItems.map((item) => (
                  <SidebarItemComponent key={item.id} item={item} active={activeSidebarItem === item.id} onClick={() => handleSidebarItemClick(item.id)} />
                ))}
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Resizable Sub-Sidebar (desktop) */}
          <div ref={sidebarRef} style={{ width: sidebarWidth }} className="border-r border-gray-200 bg-white flex-col z-40 relative min-w-[280px] max-w-[500px] hidden md:flex">
            <header className="h-[60px] px-5 flex items-center justify-between shrink-0 bg-[#f0f2f5]">
              <h2 className="font-bold text-lg text-gray-800">{viewTitle}</h2>
              <div className="flex gap-3 text-gray-500">
                {currentView === 'social' && (
                  <button onClick={() => setShowNearbyVendors(true)} className="hover:text-emerald-600 transition-colors" title="View all vendors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  </button>
                )}
                {currentView === 'social' && (
                  <button onClick={() => setShowCreatePostModal(true)} className="hover:text-black transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  </button>
                )}
              </div>
            </header>

            <div className="p-2">
              <div className="bg-gray-100 flex items-center px-3 rounded-xl">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent w-full text-sm py-2.5 px-3 outline-none" />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {filteredSidebarItems.map((item) => (
                <SidebarItemComponent key={item.id} item={item} active={activeSidebarItem === item.id} onClick={() => handleSidebarItemClick(item.id)} />
              ))}
            </ScrollArea>

            {/* Resize Handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-emerald-400 transition-colors group"
              onMouseDown={handleMouseDown}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gray-300 rounded-full group-hover:bg-emerald-500 transition-colors" />
            </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col relative overflow-hidden">
            
            {/* Canvas View */}
            {currentView === 'canvas' && (
              <>
                <header className="h-[60px] px-6 flex items-center justify-between glass-panel border-b border-gray-200 shrink-0 z-30">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                    <h3 className="font-semibold text-gray-700">
                      {dashboardSection === 'overview' ? 'Infinity Workspace' :
                       dashboardSection === 'orders' ? 'Order Queue' :
                       dashboardSection === 'drafts' ? 'Marketplace Drafts' :
                       dashboardSection === 'analytics' ? 'Analytics Hub' :
                       dashboardSection === 'shared' ? 'Shared Canvas' : 'Dashboard'}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {dashboardSection === 'overview' ? 'All Items' :
                       dashboardSection === 'orders' ? '8 Processing' :
                       dashboardSection === 'drafts' ? '12 Pending' :
                       dashboardSection === 'analytics' ? 'Weekly' : 'Active'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      <img src="https://i.pravatar.cc/100?u=a" alt="Team member" className="w-7 h-7 rounded-full border-2 border-white" />
                      <img src="https://i.pravatar.cc/100?u=b" alt="Team member" className="w-7 h-7 rounded-full border-2 border-white" />
                      <div className="w-7 h-7 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-emerald-700">+4</div>
                    </div>
                    <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                      Publish
                    </button>
                  </div>
                </header>

                <ScrollArea className="flex-1 p-6 canvas-bg">
                  <div className={`grid gap-5 ${
                    dashboardSection === 'orders' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                    dashboardSection === 'drafts' ? 'grid-cols-1 sm:grid-cols-2' :
                    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  } content-start`}>
                    {getSectionCards().map((card) => (
                      <div key={card.id} draggable onDragStart={() => setDraggedCard(card.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => setDraggedCard(null)} className="transform transition-transform">
                        {renderCard(card)}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}

            {/* Social Feed View */}
            {currentView === 'social' && (
              <>
                <header className="h-[60px] px-6 flex items-center justify-between glass-panel border-b border-gray-200 shrink-0 z-30">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 bg-purple-500 rounded-full"></span>
                    <h3 className="font-semibold text-gray-700">Social Feed</h3>
                  </div>
                  <button onClick={() => setShowCreatePostModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Create Post
                  </button>
                </header>

                <ScrollArea className="flex-1 p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className={`mx-auto w-full ${activePostComments && !isMobile ? 'max-w-6xl' : 'max-w-4xl'}`}>
                    {activePostComments && !isMobile ? (
                      <div className="flex gap-2">
                        <div className="flex-1 pr-1 space-y-2">
                          {visiblePosts.map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            isActive={activePostComments?.id === post.id}
                            onComment={handleToggleComments}
                          />
                          ))}
                          <div ref={feedEndRef} />
                        </div>
                        <div className="flex-1 pl-1">
                          <div className="bg-white border border-emerald-200 rounded-2xl shadow-lg overflow-hidden flex flex-col h-full">
                            <div className="flex items-center justify-between px-4 py-3 border-b">
                              <div>
                                <h4 className="font-semibold text-gray-800 text-sm">{activePostComments.user.name}</h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Nairobi, KE · 2km away</p>
                              </div>
                              <button onClick={() => setActivePostComments(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                            <div className="h-24 bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center text-[11px] text-gray-500">Map & location preview</div>
                            <ScrollArea className="flex-1 px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                              <div className="space-y-2">
                                {visibleComments.map((comment, i) => (
                                  <div key={comment.id} className="bg-gray-50 rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">{comment.user.name[0]}</div>
                                      <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-800">{comment.user.name}</p>
                                        <span className="text-[10px] text-gray-400">{comment.timestamp}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                        <button className="hover:text-emerald-600">👍</button>
                                        <button className="hover:text-rose-500">👎</button>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                    <div className="flex gap-2 mt-2 text-[11px] text-gray-500 items-center">
                                      <button className="hover:text-emerald-600" onClick={() => setActiveReplyIndex(i)}>Reply</button>
                                      <div className="flex gap-1">
                                        {['😀','😍','🔥','🎉'].map((emo) => (
                                          <button key={emo} className="hover:scale-110 transition-transform">{emo}</button>
                                        ))}
                                      </div>
                                    </div>
                                    {activeReplyIndex === i && (
                                      <div className="mt-2 flex gap-2 items-start">
                                        <div className="flex flex-col gap-2 flex-1">
                                          <div className="flex items-center gap-2 text-gray-500">
                                            <button className="hover:text-gray-700" title="Attach" onClick={() => createFileInputRef.current?.click()}>
                                              <Paperclip className="w-4 h-4" />
                                            </button>
                                            <button className="hover:text-gray-700" title="Location" onClick={handlePickLocation}>
                                              <MapPin className="w-4 h-4" />
                                            </button>
                                            <div className="flex gap-1">
                                              {['😀','😍','🔥'].map((emo) => (
                                                <button key={emo} className="hover:scale-110 transition-transform">{emo}</button>
                                              ))}
                                            </div>
                                          </div>
                                          <Textarea value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Reply..." className="flex-1 resize-none min-h-[70px]" />
                                        </div>
                                        <Button onClick={() => { setCommentInput(''); setActiveReplyIndex(null) }} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl">Send</Button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                <div ref={commentsEndRef} />
                              </div>
                            </ScrollArea>
                            <div className="border-t p-3">
                              <div className="flex items-center gap-2 mb-2 text-xl">
                                {['😀','😍','🔥','👌','👏'].map((emo) => (
                                  <button key={emo} className="hover:scale-110 transition-transform">{emo}</button>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 mb-2 text-gray-500">
                                <button className="hover:text-gray-700" title="Attach">
                                  <Paperclip className="w-4 h-4" />
                                </button>
                                <button className="hover:text-gray-700" title="Location">
                                  <MapPin className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <Textarea value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Add a comment..." className="flex-1 resize-none min-h-[60px]" />
                                <Button onClick={() => setCommentInput('')} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl">Send</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {visiblePosts.map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            isActive={activePostComments?.id === post.id}
                            onComment={handleToggleComments}
                          />
                        ))}
                        <div ref={feedEndRef} />
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Comments modal mobile */}
                {activePostComments && isMobile && (
                  <Dialog open={true} onOpenChange={() => setActivePostComments(null)}>
                    <DialogContent className="w-[95vw] max-w-full p-4">
                      <DialogHeader>
                        <DialogTitle>Comments</DialogTitle>
                        <DialogDescription>{activePostComments.user.name} · Nairobi, KE</DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-64 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="space-y-3">
                          {visibleComments.slice(0, 5).map((comment, i) => (
                            <div key={comment.id} className="bg-gray-50 rounded-xl p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">{comment.user.name[0]}</div>
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-gray-800">{comment.user.name}</p>
                                  <span className="text-[10px] text-gray-400">{comment.timestamp}</span>
                                </div>
                                <div className="flex gap-1 text-sm text-gray-500">
                                  {['😀','😍','🔥'].map((emo) => (
                                    <button key={emo} className="hover:scale-110 transition-transform">{emo}</button>
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                              <div className="flex gap-2 mt-2 text-[11px] text-gray-500">
                                <button className="hover:text-emerald-600">Like</button>
                                <button className="hover:text-emerald-600" onClick={() => setActiveReplyIndex(i)}>Reply</button>
                              </div>
                              {activeReplyIndex === i && (
                                <div className="mt-2 flex gap-2 items-start">
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <button className="hover:text-gray-700" title="Attach" onClick={() => createFileInputRef.current?.click()}>
                                      <Paperclip className="w-4 h-4" />
                                    </button>
                                    <button className="hover:text-gray-700" title="Location" onClick={handlePickLocation}>
                                      <MapPin className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <Textarea value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Reply..." className="flex-1 resize-none min-h-[70px]" />
                                  <Button onClick={() => { setCommentInput(''); setActiveReplyIndex(null) }} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl">Send</Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="flex items-center gap-2 mt-3 text-gray-500">
                        <button className="hover:text-gray-700" title="Attach">
                          <Paperclip className="w-4 h-4" />
                        </button>
                        <button className="hover:text-gray-700" title="Location">
                          <MapPin className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Textarea value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Add a reply..." className="flex-1 resize-none min-h-[80px]" />
                        <Button onClick={() => setCommentInput('')} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl">Send</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}

            {/* Messages View */}
            {currentView === 'messages' && (
              <>
                {activeChat ? (
                  <>
                    <header className="h-[60px] px-5 flex items-center justify-between glass-panel border-b border-gray-200 shrink-0 z-30">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setActiveChat(null)} className="text-gray-500 hover:text-gray-700">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <img src={activeChat.avatar} alt={activeChat.name} className="w-9 h-9 rounded-full" />
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm">{activeChat.name}</h3>
                          <span className="text-xs text-gray-500">{activeChat.online ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    </header>

                    <ScrollArea className="flex-1 p-4 bg-[#efeae2]">
                      <div className="max-w-2xl mx-auto">
                        {activeChat.messages.map((msg) => <ChatMessage key={msg.id} message={msg} isOwn={msg.senderId === 'me'} />)}
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>

                    <div className="p-3 bg-[#f0f2f5] border-t border-gray-200">
                      <div className="flex items-center gap-2 max-w-2xl mx-auto">
                        <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="flex-1 bg-white rounded-xl text-sm" />
                        <Button onClick={handleSendMessage} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl px-4">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <header className="h-[60px] px-6 flex items-center justify-between glass-panel border-b border-gray-200 shrink-0 z-30">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                        <h3 className="font-semibold text-gray-700">Messages</h3>
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-blue-700 transition-all">
                        New Chat
                      </button>
                    </header>

                    <div className="flex-1 flex items-center justify-center bg-[#efeae2]">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-1">Select a conversation</h3>
                        <p className="text-gray-500 text-sm">Choose a chat from the sidebar</p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Dashboard View */}
            {currentView === 'dashboard' && (
              <>
                <header className="h-[60px] px-6 flex items-center justify-between glass-panel border-b border-gray-200 shrink-0 z-30">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>
                    <h3 className="font-semibold text-gray-700">Analytics Dashboard</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <select className="bg-gray-100 border-none rounded-xl px-3 py-2 text-xs font-medium">
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                      <option>Last 90 days</option>
                    </select>
                    <button className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-orange-700 transition-all">
                      Export
                    </button>
                  </div>
                </header>

                <ScrollArea className="flex-1 p-6 bg-gray-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                      { title: 'Total Revenue', value: '$124,850', trend: '+24%', color: '#00a884', data: [20, 35, 25, 40, 30, 45, 50] },
                      { title: 'Active Orders', value: '247', trend: '+12%', color: '#3b82f6', data: [100, 150, 120, 180, 200, 220, 247] },
                      { title: 'New Customers', value: '1,842', trend: '+8%', color: '#8b5cf6', data: [800, 900, 1000, 1200, 1400, 1600, 1842] },
                      { title: 'Conversion Rate', value: '4.8%', trend: '+3.2%', color: '#f97316', data: [2, 2.5, 3, 3.5, 4, 4.5, 4.8] }
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-500 text-xs font-medium">{stat.title}</span>
                          <span className="text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">{stat.trend}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                        <MiniChart data={stat.data} color={stat.color} />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-4">Top Selling Products</h3>
                      <div className="space-y-3">
                        {cards.filter(c => c.type === 'product').slice(0, 4).map((product, i) => (
                          <div key={product.id} className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-300 w-5">{i + 1}</span>
                            <img src={product.image} alt={product.title || 'Product'} className="w-10 h-10 rounded-xl object-cover" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-800 text-xs truncate">{product.title}</h4>
                              <span className="text-xs text-gray-500">{product.category}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-600 text-sm">{product.price}</p>
                              <span className="text-xs text-gray-500">{product.reviews} sold</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        {[
                          { action: 'New order placed', detail: '#ORD-2847 - $299', time: '2 min ago', icon: '📦', bg: 'bg-blue-100' },
                          { action: 'Auction ended', detail: 'Vintage Rolex - $8,450', time: '15 min ago', icon: '🔨', bg: 'bg-orange-100' },
                          { action: 'New vendor joined', detail: 'Artisan Coffee Co.', time: '1 hour ago', icon: '🏪', bg: 'bg-purple-100' },
                          { action: 'Payment received', detail: '$1,250 from Luxe Boutique', time: '2 hours ago', icon: '💰', bg: 'bg-emerald-100' }
                        ].map((activity, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${activity.bg}`}>{activity.icon}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-800 text-xs">{activity.action}</h4>
                              <span className="text-xs text-gray-500 truncate block">{activity.detail}</span>
                            </div>
                            <span className="text-xs text-gray-400">{activity.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </>
            )}

            {/* Revenue Reports View */}
            {currentView === 'revenue' && (
              <div className="flex-1 overflow-auto bg-[#F9FBFF]">
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-white/60 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#3B82F6] rounded-full" />
                    <h3 className="font-semibold text-[#0F172A]">Revenue Reports</h3>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowRevenueDatePicker((v) => !v)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-md text-sm font-semibold text-[#0F172A] hover:shadow-lg transition-all"
                    >
                      <span>{revenueRange}</span>
                      <svg className="w-4 h-4 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M6 9l6 6 6-6" /></svg>
                    </button>
                    {showRevenueDatePicker && (
                      <div className="absolute right-0 mt-3 w-[420px] bg-white/70 backdrop-blur-2xl shadow-2xl rounded-2xl border border-white/60 p-4 space-y-3">
                        <div className="flex items-center justify-between text-[#0F172A]">
                          <span className="text-sm font-semibold">Select range</span>
                          <button onClick={() => setShowRevenueDatePicker(false)} className="text-gray-500 hover:text-gray-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-4">
                          <div className="flex flex-col gap-2">
                            {['Today', 'Last 7 Days', 'This Month', 'Fiscal Year'].map((preset) => (
                              <button
                                key={preset}
                                onClick={() => { setRevenueRange(preset); setShowRevenueDatePicker(false) }}
                                className={`text-sm text-left px-3 py-2 rounded-xl transition-all ${revenueRange === preset ? 'bg-[#3B82F6] text-white shadow-lg' : 'bg-white/70 text-[#0F172A] hover:bg-blue-50'}`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-[#0F172A]">
                            {renderMonth('March', 4, 31, revenueRange === 'Last 7 Days' ? [20, 26] : revenueRange === 'Fiscal Year' ? [1, 31] : undefined)}
                            {renderMonth('April', 1, 30, revenueRange === 'Fiscal Year' ? [1, 30] : [5, 18])}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </header>

                <div className="max-w-6xl mx-auto p-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { label: 'Total Revenue', value: '$1.24M', change: '+12.4%' },
                      { label: 'Avg Order Value', value: '$182.40', change: '+4.2%' },
                      { label: 'Net Retention', value: '108%', change: '+3.1%' }
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">{kpi.label}</span>
                          <span className="text-xs font-bold text-[#3B82F6]">{kpi.change}</span>
                        </div>
                        <p className="text-2xl font-bold text-[#0F172A]">{kpi.value}</p>
                        <div className="mt-3 h-2 rounded-full bg-white/60 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#3B82F6] via-[#00E5E5] to-[#3B82F6]" style={{ width: '82%' }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[2fr_1fr] items-stretch">
                    <div className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Revenue Flow</p>
                          <h4 className="text-xl font-bold text-[#0F172A]">Midnight Spreadsheet</h4>
                        </div>
                        <span className="text-xs font-semibold text-[#3B82F6] bg-[#3B82F6]/10 px-3 py-1 rounded-full">Area Chart</span>
                      </div>
                      <div className="relative h-72 rounded-2xl bg-white/40 border border-white/60 overflow-hidden">
                        <svg viewBox="0 0 100 120" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                          <defs>
                            <linearGradient id="revGradient" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.55" />
                              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d={areaPath} fill="url(#revGradient)" />
                          <polyline points={areaLinePoints} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          <line x1={scrubX} x2={scrubX} y1="0" y2="120" stroke="#0EA5E9" strokeWidth="1.2" strokeDasharray="4 4" />
                          <circle cx={scrubX} cy={120 - (scrubValue / revenueMax) * 100} r="2.2" fill="#00E5E5" stroke="#0F172A" strokeWidth="0.6" />
                        </svg>
                        <div className="absolute top-4 right-4 bg-[#0F172A] text-white text-xs px-3 py-2 rounded-xl shadow-lg">
                          <p className="font-semibold">Hover Scrubber</p>
                          <p className="text-[11px] text-gray-200">Week 28 · ${scrubValue}k</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Channel Split</p>
                          <h4 className="text-lg font-bold text-[#0F172A]">Donut Chart</h4>
                        </div>
                        <span className="text-xs font-semibold text-[#00E5E5] bg-[#00E5E5]/10 px-3 py-1 rounded-full">Live</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative w-44 h-44 mx-auto">
                          <div className="w-full h-full rounded-full shadow-inner" style={{ background: `conic-gradient(${donutGradient})` }} />
                          <div className="absolute inset-4 rounded-full bg-white/80 backdrop-blur-xl border border-white/60 flex flex-col items-center justify-center text-center">
                            <p className="text-xs text-gray-500">Total Revenue</p>
                            <p className="text-xl font-bold text-[#0F172A]">$482k</p>
                            <span className="text-[11px] text-[#3B82F6] font-semibold">+9.4%</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          {donutSlices.map((slice) => (
                            <div key={slice.label} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ background: slice.color }} />
                                <p className="text-sm font-semibold text-[#0F172A]">{slice.label}</p>
                              </div>
                              <p className="text-sm text-gray-600">{slice.value}%</p>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-2 border-t border-white/60">
                            <p className="text-sm font-semibold text-[#0F172A]">Unmapped</p>
                            <p className="text-sm text-gray-600">{(100 - donutTotal).toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { title: 'Payouts Scheduled', value: '$182k', badge: 'Today' },
                      { title: 'Refund Rate', value: '1.2%', badge: 'Healthy' },
                      { title: 'ARPU', value: '$42.10', badge: '↑ 6%' },
                    ].map((item) => (
                      <div key={item.title} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{item.title}</p>
                          <p className="text-xl font-bold text-[#0F172A]">{item.value}</p>
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#3B82F6]/10 text-[#3B82F6]">{item.badge}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Documents View */}
            {currentView === 'documents' && (
              <div className="flex-1 overflow-auto bg-gray-50">
                <header className="h-[60px] px-6 flex items-center justify-between glass-panel border-b border-gray-200 shrink-0 z-30">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    <div>
                      <h3 className="font-semibold text-gray-800">Documents Overview</h3>
                      <p className="text-xs text-gray-500">Templates, issuance, and history</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(['overview', 'history'] as DocumentsNav[]).map((nav) => (
                      <Button
                        key={nav}
                        variant={documentsNav === nav ? 'default' : 'outline'}
                        size="sm"
                        className={`rounded-full ${documentsNav === nav ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'border-gray-200 text-gray-700'}`}
                        onClick={() => { setDocumentsNav(nav); setActiveSidebarItem(nav) }}
                      >
                        {nav === 'overview' ? 'Overview' : 'History'}
                      </Button>
                    ))}
                  </div>
                </header>

                <ScrollArea className="flex-1 p-6 bg-gray-50">
                  {documentsNav === 'overview' && (
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                      {documentTemplates.map((template) => (
                        <div key={template.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${template.accent}`}>
                                {template.icon}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 text-sm">{template.title}</h4>
                                <p className="text-xs text-gray-500">{template.description}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[11px] border-gray-200 bg-gray-50">Template</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" /> Avg. time: 42s</span>
                            <span className="text-emerald-600 font-semibold">Auto-fill ready</span>
                          </div>
                          <div className="flex gap-2">
                            <Button className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm">
                              <FilePlus2 className="w-4 h-4 mr-2" /> Create New
                            </Button>
                            <Button variant="outline" className="rounded-xl text-sm border-gray-200">Preview</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm">Recent Records</h4>
                        <p className="text-xs text-gray-500">Already issued documents with status</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl border-gray-200">Export CSV</Button>
                        <Button size="sm" className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white">New Document</Button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-700">
                        <thead className="text-xs uppercase text-gray-500 bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 font-semibold">Date</th>
                            <th className="px-4 py-2 font-semibold">Type</th>
                            <th className="px-4 py-2 font-semibold">Recipient</th>
                            <th className="px-4 py-2 font-semibold">Amount</th>
                            <th className="px-4 py-2 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {recentDocuments.map((doc) => (
                            <tr key={doc.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-gray-700">{doc.date}</td>
                              <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-800">{doc.type}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-700">{doc.recipient}</td>
                              <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">{doc.amount}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${docStatusStyles[doc.status] || 'bg-gray-100 text-gray-600'}`}>
                                  {doc.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Reviews View */}
            {currentView === 'reviews' && (
              <>
                <header className="h-[60px] px-6 flex items-center justify-between glass-panel border-b border-gray-200 shrink-0 z-30">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
                    <h3 className="font-semibold text-gray-700">Reviews & Ratings</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <select className="bg-gray-100 border-none rounded-xl px-3 py-2 text-xs font-medium">
                      <option>All Ratings</option>
                      <option>5 Stars</option>
                      <option>4 Stars</option>
                      <option>3 Stars</option>
                      <option>2 Stars</option>
                      <option>1 Star</option>
                    </select>
                    <button
                      className="bg-yellow-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-yellow-600 transition-all flex items-center gap-2"
                      onClick={() => { setShowReviewForm(true); setNewReview({ title: '', content: '' }) }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                      Write Review
                    </button>
                  </div>
                </header>

                <ScrollArea className="flex-1 p-6 bg-gray-50">
                  {showReviewForm && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-yellow-100 mb-6">
                      <h4 className="font-semibold text-gray-800 mb-3">Write a Review</h4>
                      <div className="space-y-3">
                        <Input
                          placeholder="Review title"
                          value={newReview.title}
                          onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                          className="bg-gray-50"
                        />
                        <Textarea
                          placeholder="Share your experience..."
                          value={newReview.content}
                          onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                          className="min-h-[140px]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                          <Button className="bg-yellow-500 hover:bg-yellow-600" onClick={() => { setShowReviewForm(false); setNewReview({ title: '', content: '' }) }}>
                            Submit
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-gray-800">4.7</span>
                          <p className="text-xs text-gray-500">Avg Rating</p>
                        </div>
                      </div>
                      <StarRating rating={5} size="sm" />
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-gray-800">{reviews.filter(r => r.verified).length}</span>
                          <p className="text-xs text-gray-500">Verified Reviews</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-gray-800">{reviews.filter(r => r.reply).length}</span>
                          <p className="text-xs text-gray-500">With Replies</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-gray-800">{reviews.reduce((acc, r) => acc + r.helpful, 0)}</span>
                          <p className="text-xs text-gray-500">Helpful Marks</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}

            {/* AI Assistant */}
            {/* Desktop: keep floating panel behavior */}
            {!isMobile && currentView !== 'messages' && (
              <div className={`absolute bottom-4 ${aiExpanded ? 'left-4 right-4' : 'left-1/2 -translate-x-1/2'} transition-all duration-300 z-50`}>
                <div
                  className={`glass-panel ${aiExpanded ? 'rounded-3xl p-4' : 'rounded-2xl p-2'} shadow-2xl border border-white flex ${aiExpanded ? 'flex-row gap-4' : 'items-center gap-3'}`}
                  style={{ width: aiExpanded ? 'min(calc(100vw - 32px), 920px)' : '92%', maxWidth: aiExpanded ? '920px' : '520px' }}
                  onDragOver={(e) => { e.preventDefault(); setIsAiDragging(true) }}
                  onDragLeave={() => setIsAiDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsAiDragging(false); handleAiFiles(e.dataTransfer.files) }}
                >
                  {/* Collapsed */}
                  {!aiExpanded && (
                    <>
                      <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <Input value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAIRequest()} placeholder="Ask your AI Shop Assistant..." className="flex-1 bg-transparent border-none text-sm font-medium focus-visible:ring-0" />
                      <Button onClick={handleAIRequest} className="bg-[#111b21] hover:bg-[#1a2a35] text-white px-3 py-1.5 rounded-lg text-xs font-bold">Ask AI</Button>
                      <button onClick={() => setAiExpanded(true)} className="text-gray-400 hover:text-gray-600 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                      </button>
                    </>
                  )}

                  {/* Expanded */}
                  {aiExpanded && (
                    <>
                      <div className={`flex-1 flex flex-col gap-3 ${isAiDragging ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-white rounded-2xl' : ''}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          </div>
                          <span className="font-bold text-gray-800 text-sm">AI Assistant</span>
                          <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={() => aiFileInputRef.current?.click()}>
                              <Paperclip className="w-4 h-4" />
                            </Button>
                            <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={() => aiCameraInputRef.current?.click()}>
                              <Camera className="w-4 h-4" />
                            </Button>
                            <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={() => aiFileInputRef.current?.click()}>
                              <UploadCloud className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Textarea
                            ref={aiTextAreaRef}
                            value={aiInput}
                            onChange={handleAiInputChange}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleAIRequest()
                              }
                            }}
                            placeholder="Type or paste your question, Shift+Enter for new line..."
                            className="flex-1 bg-white border-gray-200 text-sm min-h-[100px] max-h-60 resize-none"
                          />
                          {aiAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 text-xs text-gray-700">
                              {aiAttachments.map((file, idx) => (
                                <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-lg">
                                  {file.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 items-center">
                            <Button onClick={handleAIRequest} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl px-4">
                              Send
                            </Button>
                            <p className="text-[11px] text-gray-500">Drag & drop files or tap clip/camera/cloud to attach</p>
                          </div>
                          <input
                            ref={aiFileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => handleAiFiles(e.target.files)}
                          />
                          <input
                            ref={aiCameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleAiFiles(e.target.files)}
                          />
                        </div>
                      </div>

                      <div className="w-64 border-left border-gray-200 pl-4 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-500">Conversation</span>
                          <button onClick={() => setAiExpanded(false)} className="text-gray-400 hover:text-gray-600 p-0.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                        <ScrollArea className="flex-1 max-h-40">
                          {aiMessages.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Start a conversation...</p>
                          ) : (
                            <div className="space-y-2">
                              {aiMessages.map((msg, i) => (
                                <div key={i} className={`p-2 rounded-lg text-xs ${msg.role === 'user' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                                  {msg.content}
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Mobile: dialog modal */}
            {isMobile && aiExpanded && (
              <Dialog open={aiExpanded} onOpenChange={setAiExpanded}>
                <DialogContent
                  className="w-screen max-w-full sm:max-w-lg p-4 gap-4"
                  onDragOver={(e) => { e.preventDefault(); setIsAiDragging(true) }}
                  onDragLeave={() => setIsAiDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsAiDragging(false); handleAiFiles(e.dataTransfer.files) }}
                >
                  <DialogHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div>
                        <DialogTitle className="text-sm">AI Assistant</DialogTitle>
                        <DialogDescription>Ask, attach, and get answers.</DialogDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={() => aiFileInputRef.current?.click()}>
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={() => aiCameraInputRef.current?.click()}>
                        <Camera className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={() => aiFileInputRef.current?.click()}>
                        <UploadCloud className="w-4 h-4" />
                      </Button>
                      {aiAttachments.length > 0 && (
                        <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                          {aiAttachments.length} attached
                        </span>
                      )}
                    </div>
                  </DialogHeader>

                  <div className={`flex flex-col ${isAiDragging ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-white rounded-2xl p-2' : ''}`}>
                    <Textarea
                      ref={aiTextAreaRef}
                      value={aiInput}
                      onChange={handleAiInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleAIRequest()
                        }
                      }}
                      placeholder="Type or paste your question. Shift+Enter for new line..."
                      className="bg-white border-gray-200 text-sm resize-none min-h-[200px] max-h-[420px] w-full"
                    />
                    {aiAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs text-gray-700 mt-2">
                        {aiAttachments.map((file, idx) => (
                          <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-lg">
                            {file.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 items-center mt-3">
                      <Button onClick={handleAIRequest} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl px-4">
                        Send
                      </Button>
                      <p className="text-[11px] text-gray-500">Tap icons to attach or drag & drop files.</p>
                    </div>
                    <input
                      ref={aiFileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleAiFiles(e.target.files)}
                    />
                    <input
                      ref={aiCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleAiFiles(e.target.files)}
                    />
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-500">Conversation</span>
                    </div>
                    <ScrollArea className="h-40">
                      {aiMessages.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Start a conversation...</p>
                      ) : (
                        <div className="space-y-2">
                          {aiMessages.map((msg, i) => (
                            <div key={i} className={`p-2 rounded-lg text-xs ${msg.role === 'user' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                              {msg.content}
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </main>
        </div>

        {/* Login Modal */}
        <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Welcome Back</DialogTitle>
              <DialogDescription>Sign in to your Ereja account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="mt-1" />
              </div>
              <Button onClick={handleLogin} className="w-full bg-emerald-500 hover:bg-emerald-600">Sign In</Button>
              <div className="text-center text-sm text-gray-500">
                Don't have an account? <button onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }} className="text-emerald-600 font-medium hover:underline">Register</button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Register Modal */}
        <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Account</DialogTitle>
              <DialogDescription>Join Ereja as a user or vendor</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" placeholder="you@example.com" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="reg-password">Password</Label>
                <Input id="reg-password" type="password" placeholder="••••••••" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" placeholder="••••••••" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Account Type</Label>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setRegisterForm({ ...registerForm, role: 'user' })} className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${registerForm.role === 'user' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}>
                    👤 User
                  </button>
                  <button onClick={() => setRegisterForm({ ...registerForm, role: 'vendor' })} className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${registerForm.role === 'vendor' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}>
                    🏪 Vendor
                  </button>
                </div>
              </div>
              <Button onClick={handleRegister} className="w-full bg-emerald-500 hover:bg-emerald-600">Create Account</Button>
              <div className="text-center text-sm text-gray-500">
                Already have an account? <button onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }} className="text-emerald-600 font-medium hover:underline">Sign In</button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Modal */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>My Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-gray-800">{currentUser.name}</h3>
                  <p className="text-sm text-gray-500">{currentUser.email}</p>
                  <Badge className="mt-1" variant={currentUser.role === 'vendor' ? 'default' : 'secondary'}>
                    {currentUser.role === 'vendor' ? '🏪 Vendor' : '👤 User'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xl font-bold text-gray-800">24</p>
                  <span className="text-xs text-gray-500">Orders</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xl font-bold text-gray-800">8</p>
                  <span className="text-xs text-gray-500">Drafts</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xl font-bold text-gray-800">3</p>
                  <span className="text-xs text-gray-500">Auctions</span>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Settings</Button>
                <Button variant="outline" className="w-full justify-start gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> My Orders</Button>
                <Button variant="outline" className="w-full justify-start gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> Saved Items</Button>
              </div>
              <Button variant="destructive" className="w-full" onClick={() => { setIsLoggedIn(false); setShowProfileModal(false); }}>Sign Out</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Post Modal */}
        <Dialog open={showCreatePostModal} onOpenChange={setShowCreatePostModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Post</DialogTitle>
              <DialogDescription>Share something with your network</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar><AvatarImage src={currentUser.avatar} /><AvatarFallback>{currentUser.name[0]}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <Textarea value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} placeholder="What's on your mind?" className="min-h-[120px] resize-none" />
                  <div className="flex items-center gap-2 mt-2 text-gray-600">
                    <button title="Attach" className="hover:text-gray-800" onClick={() => createFileInputRef.current?.click()}>
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button title="Use my location" className="hover:text-gray-800" onClick={handlePickLocation}>
                      <MapPin className="w-5 h-5" />
                    </button>
                    {createPostLocation && <span className="text-xs text-gray-500">Location: {createPostLocation}</span>}
                  </div>
                  {createPostAttachments.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {createPostAttachments.map((f, idx) => (
                        <div key={idx} className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center text-xs text-gray-700">
                          {f.type.startsWith('image/') ? <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" /> : <span className="p-2">{f.name}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label>Image URL (optional)</Label>
                <Input value={newPost.image} onChange={(e) => setNewPost({ ...newPost, image: e.target.value })} placeholder="https://..." className="mt-1" />
              </div>
              <input ref={createFileInputRef} type="file" multiple className="hidden" onChange={(e) => handleCreateFiles(e.target.files)} />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCreatePostModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleCreatePost} className="flex-1 bg-purple-500 hover:bg-purple-600">Post</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Auction Modal */}
        <Dialog open={showAuctionModal} onOpenChange={setShowAuctionModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Place Your Bid</DialogTitle>
              <DialogDescription>{selectedCard?.title}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <img src={selectedCard?.image} alt={selectedCard?.title || 'Item'} className="w-full h-40 object-cover rounded-xl" />
                <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {selectedCard?.countdown}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Current Bid</span>
                  <span className="text-orange-600 font-bold text-xl">{selectedCard?.currentBid}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-500 text-sm">Total Bids</span>
                  <span className="text-gray-700 font-medium">{selectedCard?.bids} bids</span>
                </div>
              </div>
              <div>
                <Label>Your Bid (USD)</Label>
                <Input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder="Enter amount" className="mt-1" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowAuctionModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={handlePlaceBid} className="flex-1 bg-orange-500 hover:bg-orange-600">Place Bid</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Product/Service Detail Modal */}
        <Dialog open={!!selectedCard && !showAuctionModal} onOpenChange={() => setSelectedCard(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden p-0">
            {selectedCard && (
              <div className="flex flex-col md:flex-row h-full">
                {/* Left: Image Gallery */}
                <div className="md:w-1/2 bg-gray-100 relative">
                  <img 
                    src={selectedCard.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'} 
                    alt={selectedCard.title || 'Item'} 
                    className="w-full h-64 md:h-full object-cover" 
                  />
                  {selectedCard.originalPrice && (
                    <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-lg">
                      {Math.round((1 - parseFloat(selectedCard.price?.replace(/[^0-9.]/g, '') || '0') / parseFloat(selectedCard.originalPrice.replace(/[^0-9.]/g, '') || '1')) * 100)}% OFF
                    </span>
                  )}
                  {selectedCard.vendor?.verified && (
                    <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                  {/* Image thumbnails */}
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${i === 1 ? 'border-emerald-500' : 'border-white/50'} cursor-pointer`}>
                        <img src={selectedCard.image || `https://picsum.photos/100?random=${i}`} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Details */}
                <div className="md:w-1/2 flex flex-col max-h-[60vh] md:max-h-[80vh]">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 shrink-0">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{selectedCard.category}</span>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedCard.title}</h2>
                    {selectedCard.rating && (
                      <div className="flex items-center gap-3 mb-3">
                        <StarRating rating={selectedCard.rating} size="md" />
                        <span className="text-sm text-gray-500">{selectedCard.rating} ({selectedCard.reviews} reviews)</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-emerald-600">{selectedCard.price}</span>
                      {selectedCard.originalPrice && (
                        <span className="text-xl text-gray-400 line-through">{selectedCard.originalPrice}</span>
                      )}
                      {selectedCard.originalPrice && selectedCard.price && (
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">
                          Save ${(parseFloat(selectedCard.originalPrice.replace(/[^0-9.]/g, '')) - parseFloat(selectedCard.price.replace(/[^0-9.]/g, ''))).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <ScrollArea className="flex-1 p-6">
                    {/* Description */}
                    <div className="mb-6">
                      <h3 className="font-bold text-gray-800 mb-2">Description</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {selectedCard.description || `This ${selectedCard.type} offers exceptional quality and value. Perfect for anyone looking for premium features and reliable performance. Our products are carefully selected and verified to ensure the best experience for our customers.`}
                      </p>
                    </div>

                    {/* Tags */}
                    {selectedCard.tags && selectedCard.tags.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCard.tags.map((tag, i) => (
                            <span key={i} className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-lg">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Service-specific: Location & Availability */}
                    {selectedCard.type === 'service' && (
                      <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-2">Service Details</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {selectedCard.location || 'New York, NY'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Available: Mon-Sat, 9AM-6PM
                          </div>
                          <div className="flex items-center gap-2 text-sm text-emerald-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Instant booking available
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Event-specific: Date & Location */}
                    {selectedCard.type === 'event' && (
                      <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-2">Event Details</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {selectedCard.date || 'December 15, 2024'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {selectedCard.location || 'San Francisco, CA'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {selectedCard.attendees || 234} attending
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Logistics-specific: Tracking */}
                    {selectedCard.type === 'logistics' && selectedCard.tracking && (
                      <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-2">Tracking Timeline</h3>
                        <div className="space-y-3">
                          {selectedCard.tracking.events.map((event, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                {i < selectedCard.tracking!.events.length - 1 && <div className="w-0.5 h-8 bg-gray-200" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{event.status}</p>
                                <p className="text-xs text-gray-500">{event.location} • {event.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vendor Info */}
                    {selectedCard.vendor && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <img src={selectedCard.vendor.avatar} alt={selectedCard.vendor.name} className="w-12 h-12 rounded-full" />
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800">{selectedCard.vendor.name}</h4>
                            {selectedCard.vendor.verified && (
                              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" clipRule="evenodd" />
                                </svg>
                                Verified Vendor
                              </span>
                            )}
                          </div>
                          <Button variant="outline" size="sm" className="text-xs">View Store</Button>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>⭐ 4.8 avg rating</span>
                          <span>📦 1.2k sales</span>
                          <span>🕐 responds in ~2h</span>
                        </div>
                      </div>
                    )}

                    {/* Reviews Preview */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-800">Reviews</h3>
                        <button className="text-xs text-emerald-600 font-medium hover:underline">See all</button>
                      </div>
                      <div className="space-y-3">
                        {reviews.filter(r => r.productName === selectedCard.title || r.vendorName === selectedCard.vendor?.name).slice(0, 2).map((review) => (
                          <div key={review.id} className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <img src={review.user.avatar} alt={review.user.name} className="w-6 h-6 rounded-full" />
                              <span className="text-xs font-medium text-gray-800">{review.user.name}</span>
                              <StarRating rating={review.rating} size="sm" />
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{review.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>

                  {/* Actions Footer */}
                  <div className="p-4 border-t border-gray-100 shrink-0 bg-white">
                    <div className="flex gap-3">
                      {selectedCard.type === 'product' && (
                        <>
                          <Button variant="outline" className="flex-1 gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Chat
                          </Button>
                          <Button className="flex-1 gap-2 bg-emerald-500 hover:bg-emerald-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                          </Button>
                        </>
                      )}
                      {selectedCard.type === 'service' && (
                        <>
                          <Button variant="outline" className="flex-1 gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Message
                          </Button>
                          <Button className="flex-1 gap-2 bg-purple-500 hover:bg-purple-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Book Now
                          </Button>
                        </>
                      )}
                      {selectedCard.type === 'event' && (
                        <>
                          <Button variant="outline" className="flex-1 gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                          </Button>
                          <Button className="flex-1 gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                            Register • {selectedCard.price}
                          </Button>
                        </>
                      )}
                      {selectedCard.type === 'vendor' && (
                        <>
                          <Button variant="outline" className="flex-1 gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Follow
                          </Button>
                          <Button className="flex-1 gap-2 bg-emerald-500 hover:bg-emerald-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Contact
                          </Button>
                        </>
                      )}
                      {selectedCard.type === 'logistics' && (
                        <Button className="w-full gap-2 bg-blue-500 hover:bg-blue-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          Track on Map
                        </Button>
                      )}
                      {!['product', 'service', 'event', 'vendor', 'logistics'].includes(selectedCard.type) && (
                        <Button className="w-full bg-emerald-500 hover:bg-emerald-600">View Details</Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
