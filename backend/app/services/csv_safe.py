"""CSV helpers. Cells starting with = + - @ can run as formulas when opened in Excel (CSV injection)."""
import csv
import io

_DANGEROUS = ("=", "+", "-", "@", "\t", "\r")


def safe_cell(value) -> str:
    text = "" if value is None else str(value)
    return "'" + text if text.startswith(_DANGEROUS) else text


def to_csv(header: list[str], rows: list[list]) -> str:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(header)
    for row in rows:
        writer.writerow([safe_cell(c) for c in row])
    return buf.getvalue()
