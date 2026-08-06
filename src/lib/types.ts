export type Role = 'user' | 'astrologer' | 'admin'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  phone: string | null
  email: string | null
  name: string | null
  dateOfBirth: string | null
  role: Role
  interests: string[] | null
  isOnboarded: boolean
  isAstrologer: boolean
  avatarUrl: string | null
  bio: string | null
  isBanned: boolean
  banReason: string | null
  createdAt: string
  updatedAt: string
}

export interface AstrologerListItem {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  avatarUrl: string | null
  isBanned: boolean
  createdAt: string
  profileId: string
  bio: string | null
  experience: number | null
  languages: string[] | null
  specializations: string[] | null
  photoUrl: string | null
  rating: string | null
  totalReviews: number | null
  isVerified: boolean
  isActive: boolean
  verificationStatus: VerificationStatus
  document1Url: string | null
  document2Url: string | null
  rejectionReason: string | null
  verifiedAt: string | null
}

export interface Post {
  id: string
  content: string
  mediaUrl: string | null
  mediaType: 'IMAGE' | 'VIDEO' | 'TEXT' | null
  tags: string[]
  createdAt: string
  astrologerId: string
  astrologerName: string | null
  astrologerAvatarUrl: string | null
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Stats {
  totalUsers: number
  totalAstrologers: number
  pendingVerifications: number
  totalPosts: number
  bannedUsers: number
}

export interface ImageKitAuthParams {
  token: string
  expire: number
  signature: string
}
