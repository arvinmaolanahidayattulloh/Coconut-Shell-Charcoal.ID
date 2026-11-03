import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { whatsapp } = await request.json();

    // 1. Generate 6 Angka Acak
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // TODO: Simpan 'otp' ini ke Database berdasarkan 'whatsapp'

    // 2. Kirim pesan ke API Fonnte
    const fonnteToken = process.env.FONNTE_TOKEN; // Token dari dashboard fonnte.com
    
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnteToken,
      },
      body: new URLSearchParams({
        target: whatsapp,
        message: `*PT TUNAS KEMBAR ABADI*\n\nKode OTP WhatsApp Anda adalah: *${otp}*\n\nBerlaku selama 5 menit. JANGAN BERIKAN kode ini kepada siapa pun.`,
        countryCode: '62', 
      }),
    });

    const data = await response.json();

    if (data.status) {
      return NextResponse.json({ success: true, message: 'OTP WA terkirim', test_otp: otp }, { status: 200 });
    } else {
      throw new Error(data.reason || 'Gagal dari gateway WA');
    }
  } catch (error) {
    console.error('Error send WA:', error);
    return NextResponse.json({ success: false, message: 'Gagal mengirim WA' }, { status: 500 });
  }
}
