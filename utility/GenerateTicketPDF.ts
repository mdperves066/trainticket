import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function GenerateTicketPDF(user: any, train_name: string, from: any, to: any, seat_name: string, seat_numbers: number[], date: string, departure: any, reach: any, price: number) {
    const generatePDF = async () => {
        const doc = new jsPDF();
        
        // Add green border around the entire page
        const margin = 8;
        doc.setLineWidth(1.5);
        doc.setDrawColor(34, 197, 94);
        doc.rect(margin, margin, doc.internal.pageSize.getWidth() - 2 * margin, doc.internal.pageSize.getHeight() - 2 * margin);

        // Add title in the middle with golden color
        doc.setFontSize(20);
        doc.setTextColor(255, 215, 0); // Golden color
        doc.text('BANGLADESH RAILWAY', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

        // Measure the height of the title text
        let previousY = 20 + doc.getTextDimensions('Bangladesh Railway').h + 10;

        // Add Ticket Details in green color
        doc.setFontSize(16);
        doc.setTextColor(22, 163, 74); 
        doc.text('Online Ticket', doc.internal.pageSize.getWidth() / 2, previousY, { align: 'center' });

        // Measure the height of the 'Online Ticket' text
        previousY += doc.getTextDimensions('Online Ticket').h + 10;

        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        const tableX = 15;
        doc.text(`Dear ${user.name},`, tableX, previousY);
        
        previousY += doc.getTextDimensions(`Dear ${user.name},`).h + 1;

        doc.text('Your request to book the following ticket has been confirmed. You can travel on the train mentioned in the ticket subject by showing the online or offline copy of this ticket.', tableX, previousY, { align: 'left', maxWidth: doc.internal.pageSize.getWidth() - 30 });

        // Measure the height of the long text
        previousY += doc.getTextDimensions('Your Request to book the following ticket has been confirmed. You can travel on the train mentioned in the ticket subject by showing the online or offline copy of this ticket.').h + 10;

        // Custom draw function for header rows
        const drawHeaderRow = (data: any) => {
            doc.setFillColor(0, 200, 83); // Green color
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(255, 255, 255); // White color
            doc.text(data.cell.text, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { align: 'center', baseline: 'middle' });
        };

        // Draw the first table (Ticket Details)
        autoTable(doc, {
            startY: previousY + 5,
            headStyles: { fillColor: [255, 215, 0] }, // Golden color for header
            body: [
                [{ content: 'Train Details', colSpan: 2, styles: { halign: 'center', fillColor: [0, 200, 83], textColor: [255, 255, 255], fontStyle: "bold",fontSize:11} }],
                ['Train', train_name],
                ['Seat Types', seat_name],
                ['Seat Numbers', seat_numbers.join(', ')],
                ['From', from],
                ['To', to],
                ['Journey Date', date],
                ['Departure Time', departure],
                ['Reach Time', reach],
                ['Price', `${price} Tk`]
            ],
            theme: 'grid',
            styles: {
                lineColor: [107, 114, 128], 
                lineWidth: 0.5,
                fontSize: 9 // Decrease font size to 9
            },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 'auto' }
            },
            didDrawCell: (data) => {
                if (data.row.index === 0) {
                    drawHeaderRow(data);
                }
            }
        });

        previousY = (doc as any).autoTable.previous.finalY + 20; 
        // Draw the second table (Passenger Details)
        autoTable(doc, {
            startY: previousY,
            headStyles: { fillColor: [255, 215, 0] }, // Golden color for header
            body: [
                [{ content: 'Passenger Details', colSpan: 2, styles: { halign: 'center', fillColor: [0, 200, 83], textColor: [255, 255, 255], fontStyle: "bold",fontSize:11 } }],
                ['Name', user.name],
                ['Email', user.email],
                ['NID No.', user.nid],
                ['Phone', user.phone],
                ['Address', user.location]
            ],
            theme: 'grid',
            styles: {
                lineColor: [107, 114, 128], 
                lineWidth: 0.5,
                fontSize: 9 // Decrease font size to 9
            },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 'auto' }
            },
            didDrawCell: (data) => {
                if (data.row.index === 0) {
                    drawHeaderRow(data);
                }
            }
        });

        doc.setFontSize(16);
        doc.setTextColor(107, 114, 128);  
        doc.text('Thank you for booking with us. Wishing you a happy and safe journey!', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() -50, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);  
        doc.text('for any query reach us at', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() -20, { align: 'center' });
        doc.setTextColor(255, 215, 0);
        doc.text('bdrailway@gmail.com', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() -15, { align: 'center' });

        const imgUrl = '/rlogo.png';
        const imgBase64 = await fetch(imgUrl)
            .then(response => response.blob())
            .then(blob => new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }));

        const imgWidth = 100; // Adjust the width of the watermark
        const imgHeight = 137; // Adjust the height of the watermark
        const x = (doc.internal.pageSize.getWidth() - imgWidth) / 2;
        const y = (doc.internal.pageSize.getHeight() - imgHeight) / 2;

        // Set global transparency to 0.1
        doc.setGState(new (doc as any).GState({ opacity: 0.1 }));

        // Add the watermark image
        doc.addImage(imgBase64, 'PNG', x, y, imgWidth, imgHeight, '', 'FAST');

        // Reset global transparency to 1
        doc.setGState(new (doc as any).GState({ opacity: 1 }));

        doc.save('ticket.pdf');
    };

    generatePDF();
}