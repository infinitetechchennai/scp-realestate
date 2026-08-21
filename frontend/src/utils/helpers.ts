import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatCurrencyFull(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export function getDaysRemaining(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'available': return 'text-green-700 bg-green-100 border-green-300';
    case 'token_booked': return 'text-orange-700 bg-orange-100 border-orange-300';
    case 'confirmed': return 'text-red-700 bg-red-100 border-red-300';
    case 'sold': return 'text-gray-700 bg-gray-200 border-gray-400';
    default: return 'text-gray-600 bg-gray-100 border-gray-300';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'available': return 'Available';
    case 'token_booked': return 'Token Booked';
    case 'confirmed': return 'Confirmed';
    case 'sold': return 'Sold';
    case 'token_paid': return 'Token Paid';
    case 'cancelled': return 'Cancelled';
    case 'expired': return 'Expired';
    case 'pending': return 'Pending';
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    case 'suspended': return 'Suspended';
    case 'active': return 'Active';
    case 'inactive': return 'Inactive';
    case 'completed': return 'Completed';
    default: return status;
  }
}
