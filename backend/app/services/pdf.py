"""Assignment front page PDF. The layout is a PLACEHOLDER until the college's official format is known."""
import io

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas


def assignment_front_page(*, college: str, student_name: str, register_no: str, department: str,
                          semester: int, section: str | None, subject_code: str, subject_name: str,
                          assignment_no: int) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4
    c.setTitle(f"Assignment {assignment_no} - {subject_code}")
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(w / 2, h - 30 * mm, college)
    c.setFont("Helvetica", 12)
    c.drawCentredString(w / 2, h - 38 * mm, "Velu Nagar, Tiruvannamalai - 606 603")
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(w / 2, h - 70 * mm, f"ASSIGNMENT {assignment_no}")
    rows = [
        ("Subject Code", subject_code), ("Subject Name", subject_name),
        ("Student Name", student_name), ("Register No.", register_no),
        ("Department", department), ("Semester", str(semester)),
        ("Section", section or "-"),
    ]
    y = h - 100 * mm
    for label, value in rows:
        c.setFont("Helvetica-Bold", 12)
        c.drawString(30 * mm, y, f"{label}:")
        c.setFont("Helvetica", 12)
        c.drawString(75 * mm, y, value)
        y -= 11 * mm
    c.setFont("Helvetica", 10)
    c.drawString(30 * mm, 30 * mm, "Staff signature: ______________________")
    c.drawRightString(w - 30 * mm, 30 * mm, "Date: ____________")
    c.showPage()
    c.save()
    return buf.getvalue()
