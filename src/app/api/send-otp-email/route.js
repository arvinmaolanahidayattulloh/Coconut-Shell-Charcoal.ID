import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();

    // 1. Generate 6 Angka Acak
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // TODO: Di sistem nyata, simpan 'otp' ini ke Database berdasarkan 'email' 
    // agar nanti bisa divalidasi di API verifikasi.

    // 2. Setup Koneksi ke Hosting Email Anda
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // misal: mail.coconutshellcharcoal.id atau smtp.hostinger.com
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER, // CostumerService@coconutshellcharcoal.id
        pass: process.env.SMTP_PASS, // Password email tersebut
      },
    });

    // 3. Kirim Email
    await transporter.sendMail({
      from: '"CS Coconut Shell Charcoal" <CostumerService@coconutshellcharcoal.id>',
      to: email,
      subject: 'Kode OTP Registrasi Akun Anda',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Verifikasi Email</h2>
          <p>Terima kasih telah mendaftar di PT Tunas Kembar Abadi.</p>
          <p>Kode OTP Anda adalah:</p>
          <h1 style="color: #c45e20; letter-spacing: 4px;">${otp}</h1>
          <p>Kode ini berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.</p>
        </div>
      `,
    });

    // Jangan kirim balik 'otp' ke frontend di produksi, ini hanya untuk simulasi testing jika database belum siap!
    return NextResponse.json({ success: true, message: 'OTP Email terkirim', test_otp: otp }, { status: 200 });
  } catch (error) {
    console.error('Error send email:', error);
    return NextResponse.json({ success: false, message: 'Gagal mengirim email' }, { status: 500 });
  }
}
