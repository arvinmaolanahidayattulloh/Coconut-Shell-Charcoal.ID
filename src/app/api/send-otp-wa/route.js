import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ success: false, message: 'Nomor WhatsApp tidak boleh kosong' }, { status: 400 });
    }

    // Pastikan nomor bersih dari karakter non-digit
    let formattedPhone = phone.toString().replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }

    const otpWa = Math.floor(100000 + Math.random() * 900000).toString();

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': process.env.WA_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: `*PT Tunas Kembar Abadi*\n\nHalo,\nKode verifikasi (OTP) WhatsApp Anda adalah: *${otpWa}*\n\nBerlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.\n\n_CostumerService@coconutshellcharcoal.id_`,
      }),
    });

    const result = await response.json();

    // Tangkap pesan error spesifik dari Fonnte
    if (!response.ok || !result.status) {
      const errorMessage = result.reason || result.message || 'Gagal mengirim pesan via Fonnte';
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'OTP WhatsApp berhasil dikirim',
      test_otp_wa: otpWa 
    }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
