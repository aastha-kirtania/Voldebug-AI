import PDFDocument from "pdfkit";

export interface CertificateData {
  studentName: string;
  milestoneTitle: string;
  milestoneDescription: string;
  dateEarned: string;
  verificationId: string;
}

export async function generateCertificatePdf(
  stream: NodeJS.WritableStream,
  data: CertificateData
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 40, left: 40, right: 40, bottom: 40 },
      });

      doc.pipe(stream);

      // Define branding colors
      const primaryColor = "#6366f1"; // Electric Indigo
      const accentColor = "#fbbf24";  // Gold
      const textColor = "#1f2937";    // Slate Gray
      const lightGray = "#9ca3af";

      const width = doc.page.width;
      const height = doc.page.height;

      // 1. Draw Outer Border (Electric Indigo)
      doc.rect(20, 20, width - 40, height - 40)
         .lineWidth(4)
         .stroke(primaryColor);

      // 2. Draw Inner Border (Gold)
      doc.rect(26, 26, width - 52, height - 52)
         .lineWidth(1.5)
         .stroke(accentColor);

      // 3. Draw Corner Ornamentation
      // Top-Left corner details
      doc.moveTo(26, 46).lineTo(46, 26).stroke(primaryColor);
      // Top-Right corner details
      doc.moveTo(width - 26, 46).lineTo(width - 46, 26).stroke(primaryColor);
      // Bottom-Left corner details
      doc.moveTo(26, height - 46).lineTo(46, height - 26).stroke(primaryColor);
      // Bottom-Right corner details
      doc.moveTo(width - 26, height - 46).lineTo(width - 46, height - 26).stroke(primaryColor);

      // 4. Header: Brand logo text or title
      doc.y = 85;
      doc.font("Helvetica-Bold")
         .fontSize(16)
         .fillColor(primaryColor)
         .text("V O L D E B U G   A I", { align: "center", characterSpacing: 2 } as any);

      doc.moveDown(1.5);

      // 5. Title: CERTIFICATE OF ACHIEVEMENT
      doc.font("Helvetica-Bold")
         .fontSize(32)
         .fillColor(textColor)
         .text("CERTIFICATE OF ACHIEVEMENT", { align: "center" });

      doc.moveDown(0.8);

      // 6. Subtitle
      doc.font("Helvetica")
         .fontSize(12)
         .fillColor(lightGray)
         .text("THIS IS PROUDLY PRESENTED TO", { align: "center", characterSpacing: 1 } as any);

      doc.moveDown(1.2);

      // 7. Student Name
      doc.font("Helvetica-Bold")
         .fontSize(28)
         .fillColor(primaryColor)
         .text(data.studentName, { align: "center" });

      // Draw name underline
      const nameWidth = doc.widthOfString(data.studentName);
      const startX = (width - nameWidth) / 2;
      doc.moveTo(startX - 15, doc.y + 4)
         .lineTo(startX + nameWidth + 15, doc.y + 4)
         .lineWidth(1.5)
         .stroke(accentColor);

      doc.moveDown(2);

      // 8. Description
      doc.font("Helvetica")
         .fontSize(13)
         .fillColor(textColor)
         .text("for outstanding academic success and milestone completion on Voldebug AI,", { align: "center" });
      
      doc.moveDown(0.4);
      
      doc.font("Helvetica-Bold")
         .fontSize(14)
         .fillColor(textColor)
         .text(`"${data.milestoneTitle}"`, { align: "center" });

      doc.moveDown(0.4);

      doc.font("Helvetica-Oblique")
         .fontSize(11)
         .fillColor(lightGray)
         .text(`(${data.milestoneDescription})`, { align: "center" });

      doc.moveDown(2.5);

      // 9. Signatures and Date Columns
      const columnWidth = 180;
      const startY = height - 155;

      // Left Column: Date
      doc.font("Helvetica")
         .fontSize(10)
         .fillColor(textColor)
         .text(data.dateEarned, 80, startY, { width: columnWidth, align: "center" });
      doc.moveTo(80, startY + 15)
         .lineTo(80 + columnWidth, startY + 15)
         .lineWidth(0.5)
         .stroke(lightGray);
      doc.font("Helvetica")
         .fontSize(9)
         .fillColor(lightGray)
         .text("DATE OF ACHIEVEMENT", 80, startY + 20, { width: columnWidth, align: "center" });

      // Center Ornament: Digital Badge Emblem
      const emblemCenter = width / 2;
      doc.circle(emblemCenter, startY + 10, 24)
         .fillOpacity(0.08)
         .fillAndStroke(accentColor, primaryColor)
         .fillOpacity(1); // Reset opacity
      
      // Star inside emblem
      doc.font("Helvetica-Bold")
         .fontSize(20)
         .fillColor(accentColor)
         .text("★", emblemCenter - 10, startY, { width: 20, align: "center" });

      // Right Column: Signatures
      const rightColumnX = width - 80 - columnWidth;
      doc.font("Helvetica-Bold")
         .fontSize(10)
         .fillColor(textColor)
         .text("Ms. Rivera & Education Team", rightColumnX, startY, { width: columnWidth, align: "center" });
      doc.moveTo(rightColumnX, startY + 15)
         .lineTo(rightColumnX + columnWidth, startY + 15)
         .lineWidth(0.5)
         .stroke(lightGray);
      doc.font("Helvetica")
         .fontSize(9)
         .fillColor(lightGray)
         .text("AUTHORIZED SIGNATURE", rightColumnX, startY + 20, { width: columnWidth, align: "center" });

      // 10. Verification Code Footer
      doc.font("Helvetica")
         .fontSize(8)
         .fillColor(lightGray)
         .text(`Verification ID: ${data.verificationId}`, 40, height - 55, { align: "left" });

      doc.end();

      // Resolve when stream ends successfully
      stream.on("finish", () => {
        resolve();
      });

      stream.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}
