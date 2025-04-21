import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth';

export function POST() {
  removeAuthCookie();
  
  return NextResponse.json({
    message: 'Logged out successfully'
  });
}