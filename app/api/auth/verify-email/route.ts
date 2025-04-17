import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/verify-email`, body);
    return NextResponse.json(res.data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.message || 'Server error' },
      { status: error.response?.status || 500 }
    );
  }
}