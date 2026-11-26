import QRCode from 'qrcode';

export async function generateQrBase64(data: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
      color: {
        dark: '#064e3b',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('QR generation failed:', err);
    return '';
  }
}
