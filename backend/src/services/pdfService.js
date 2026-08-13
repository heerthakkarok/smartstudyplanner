const PDFDocument = require('pdfkit');

const generateStudyPlanPDF = (user, exam, subjectsWithTopics, tasks) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header Banner
      doc
        .fillColor('#1e293b')
        .rect(0, 0, 595.28, 90)
        .fill();

      doc
        .fillColor('#ffffff')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('Smart Study Planner', 40, 25);

      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text('Official Adaptive Study Schedule', 40, 52);

      // Student & Exam Overview Box
      doc.moveDown(3);
      doc
        .fillColor('#f8fafc')
        .rect(40, 110, 515, 110)
        .fill()
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .stroke();

      doc
        .fillColor('#0f172a')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Student: ${user.name} (${user.email})`, 55, 125)
        .text(`Exam Target: ${exam.name}`, 55, 145)
        .text(`Exam Date: ${new Date(exam.examDate).toLocaleDateString()}`, 55, 165)
        .text(`Target Score: ${exam.targetScore || 90}%`, 320, 125)
        .text(`Daily Study Limit: ${exam.dailyStudyHours} Hours/Day`, 320, 145)
        .text(`Preferred Times: ${(exam.preferredStudyTimes || ['evening']).join(', ')}`, 320, 165);

      // Timetable Title
      doc.moveDown(4);
      doc
        .fillColor('#0f172a')
        .fontSize(15)
        .font('Helvetica-Bold')
        .text('Complete Study Timetable', 40, 240);

      // Timetable Table Header
      let y = 265;
      doc
        .fillColor('#2563eb')
        .rect(40, y, 515, 25)
        .fill();

      doc
        .fillColor('#ffffff')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Date', 45, y + 7)
        .text('Start - End', 115, y + 7)
        .text('Duration', 185, y + 7)
        .text('Subject', 235, y + 7)
        .text('Topic', 335, y + 7)
        .text('Priority', 455, y + 7)
        .text('Status', 505, y + 7);

      y += 25;

      // Render Rows
      doc.font('Helvetica').fontSize(8);
      tasks.forEach((task, index) => {
        if (y > 750) {
          doc.addPage();
          y = 40;
        }

        const isEven = index % 2 === 0;
        doc
          .fillColor(isEven ? '#ffffff' : '#f1f5f9')
          .rect(40, y, 515, 22)
          .fill();

        const dateStr = new Date(task.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
        
        // Calculate End Time
        const [h, m] = (task.startTime || '09:00').split(':').map(Number);
        const startMins = h * 60 + m;
        const endMins = startMins + (task.duration || 1) * 60;
        const endH = Math.floor(endMins / 60) % 24;
        const endM = endMins % 60;
        const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        doc
          .fillColor('#1e293b')
          .text(dateStr, 45, y + 6)
          .text(`${task.startTime} - ${endTimeStr}`, 115, y + 6)
          .text(`${task.duration}h`, 185, y + 6)
          .text(task.subjectId?.name || 'Subject', 235, y + 6, { width: 90, ellipsis: true })
          .text(task.topicId?.name || 'Topic', 335, y + 6, { width: 110, ellipsis: true })
          .text((task.priority || 'medium').toUpperCase(), 455, y + 6)
          .text((task.status || 'pending').toUpperCase(), 505, y + 6);

        y += 22;
      });

      // Footer
      doc
        .fontSize(8)
        .fillColor('#94a3b8')
        .text(`Generated automatically by Smart Study Planner on ${new Date().toLocaleDateString()}`, 40, 800, {
          align: 'center',
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateStudyPlanPDF,
};
