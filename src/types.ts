export interface User {
  id: string;
  email: string;
  username: string;
  city: string;
  avatarUrl: string;
  rating: number;
  ratingCount: number;
  completedSwaps: number;
  bio: string;
  isVerified: boolean;
  isBlocked: boolean;
  isAdmin: boolean;
  createdAt: string;
  phone?: string;
  phoneVerified?: boolean;
  supabaseUserId?: string;
}

export interface Item {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  title: string;
  description: string;
  category: string;
  condition: 'Yeni' | 'Az Kullanılmış' | 'Kullanılmış';
  targetSwap: string; // This can now be a category choice!
  city: string;
  imageUrl: string;
  createdAt: string;
  isModerated: boolean;
  reportsCount: number;
  views: number;
  estimatedValue?: number; // Approximate estimated value in TL
  userRating?: number;
  userRatingCount?: number;
}

export interface SwapOffer {
  id: string;
  proposerId: string;
  proposerUsername: string;
  proposerItemId: string;
  proposerItemTitle: string;
  proposerItemImage: string;
  receiverId: string;
  receiverUsername: string;
  receiverItemId: string;
  receiverItemTitle: string;
  receiverItemImage: string;
  message?: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  proposerRated: boolean;
  receiverRated: boolean;
  createdAt: string;
  monetaryType?: 'give' | 'take' | 'none'; // give = proposer pays cash to receiver, take = proposer requests cash from receiver
  monetaryAmount?: number; // Cash adjustment in TL
}

export interface ChatMessage {
  id: string;
  swapId: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImageUrl: string;
  reporterId: string;
  reporterUsername: string;
  reason: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface AppAnalytics {
  totalUsers: number;
  totalItems: number;
  totalSwaps: number;
  totalCompletedSwaps: number;
  categoryDistribution: { [key: string]: number };
  totalViews: number;
  activeUsersCount: number;
  dailyStats: {
    date: string;
    registrations: number;
    listings: number;
    swaps: number;
  }[];
}
