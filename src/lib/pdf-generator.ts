import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PengajuanSurat } from '@/types/database';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export interface LetterTemplate {
  institutionName: string;
  institutionAddress: string;
  institutionCity: string;
  institutionPhone: string;
  institutionEmail: string;
  signerName: string;
  signerTitle: string;
  signerNIP: string;
}

const defaultTemplate: LetterTemplate = {
  institutionName: 'UNIVERSITAS CONTOH',
  institutionAddress: 'Jl. Pendidikan No. 123',
  institutionCity: 'Kota Pendidikan, 12345',
  institutionPhone: '(021) 1234567',
  institutionEmail: 'info@universitascontoh.ac.id',
  signerName: 'Dr. Ahmad Sulaiman, M.Pd.',
  signerTitle: 'Kepala Bagian Administrasi Akademik',
  signerNIP: '197001011995031001',
};

export function generateSuratKeterangan(
  pengajuan: PengajuanSurat,
  template: LetterTemplate = defaultTemplate
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 25;
  let yPos = 20;

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(template.institutionName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(template.institutionAddress, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text(template.institutionCity, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text(`Telp: ${template.institutionPhone} | Email: ${template.institutionEmail}`, pageWidth / 2, yPos, { align: 'center' });

  // Line
  yPos += 5;
  doc.setLineWidth(1);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);

  // Title
  yPos += 20;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SURAT KETERANGAN', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor: ${pengajuan.nomor_pengajuan}`, pageWidth / 2, yPos, { align: 'center' });

  // Body
  yPos += 15;
  doc.setFontSize(11);
  doc.text('Yang bertanda tangan di bawah ini:', margin, yPos);

  yPos += 10;
  doc.setFontSize(10);
  const signerInfo = [
    ['Nama', template.signerName],
    ['Jabatan', template.signerTitle],
    ['NIP', template.signerNIP],
  ];
  
  signerInfo.forEach(([label, value]) => {
    doc.text(`${label}`, margin + 10, yPos);
    doc.text(':', margin + 45, yPos);
    doc.text(value, margin + 50, yPos);
    yPos += 6;
  });

  yPos += 8;
  doc.setFontSize(11);
  doc.text('Dengan ini menerangkan bahwa:', margin, yPos);

  yPos += 10;
  doc.setFontSize(10);
  const studentInfo = [
    ['Nama', pengajuan.mahasiswa?.nama || '-'],
    ['NIM', pengajuan.mahasiswa?.nim || '-'],
    ['Program Studi', pengajuan.mahasiswa?.program_studi || '-'],
    ['Email', pengajuan.mahasiswa?.email || '-'],
    ['No. HP', pengajuan.mahasiswa?.no_hp || '-'],
  ];
  
  studentInfo.forEach(([label, value]) => {
    doc.text(`${label}`, margin + 10, yPos);
    doc.text(':', margin + 45, yPos);
    doc.text(value, margin + 50, yPos);
    yPos += 6;
  });

  yPos += 10;
  doc.setFontSize(11);
  const textWidth = pageWidth - (margin * 2);
  const letterType = pengajuan.jenis_surat?.nama || 'Surat Keterangan';
  
  const purposeText = `Adalah benar mahasiswa ${template.institutionName} yang mengajukan ${letterType} untuk keperluan: ${pengajuan.keperluan}`;
  const splitPurpose = doc.splitTextToSize(purposeText, textWidth);
  doc.text(splitPurpose, margin, yPos);
  yPos += splitPurpose.length * 6;

  yPos += 10;
  const closingText = 'Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.';
  const splitClosing = doc.splitTextToSize(closingText, textWidth);
  doc.text(splitClosing, margin, yPos);
  yPos += splitClosing.length * 6;

  // Signature
  yPos += 15;
  const signX = pageWidth - margin - 70;
  doc.text(`Kota Pendidikan, ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`, signX, yPos);
  
  yPos += 7;
  doc.text(template.signerTitle, signX, yPos);
  
  yPos += 30;
  doc.setFont('helvetica', 'bold');
  doc.text(template.signerName, signX, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${template.signerNIP}`, signX, yPos);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Dicetak pada: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, footerY);
  doc.text('Dokumen ini dihasilkan secara elektronik', pageWidth - margin, footerY, { align: 'right' });

  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(`${filename}.pdf`);
}

export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output('blob');
}
