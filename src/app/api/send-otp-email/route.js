import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Inisialisasi Resend dengan API Key dari environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email tidak boleh kosong' }, { status: 400 });
    }

    // Generate 6 digit kode OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Kirim email menggunakan domain resmi Anda
    const { data, error } = await resend.emails.send({
      from: 'Customer Service <CostumerService@coconutshellcharcoal.id>',
      to: [email],
      subject: 'Kode OTP Verifikasi Akun - PT Tunas Kembar Abadi',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #c45e20; margin-top: 0;">PT Tunas Kembar Abadi</h2>
          <p>Halo,</p>
          <p>Gunakan kode verifikasi (OTP) di bawah ini untuk melanjutkan pendaftaran akun Anda:</p>
          <div style="background: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111827;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #6b7280;">Kode ini berlaku selama 5 menit. Jangan berikan kode ini kepada siapa pun.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">Email otomatis dari CostumerService@coconutshellcharcoal.id</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    // Di tahap produksi, simpan variabel 'otp' ini ke database yang terhubung dengan sesi user
    return NextResponse.json({ 
      success: true, 
      message: 'Email OTP berhasil dikirim',
      test_otp: otp // Hapus baris ini nanti saat database sudah siap
    }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
