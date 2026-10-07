# Sample data (all FAKE)

- `student_dataset_10_rows_ORIGINAL.xlsx` is the sheet as received. All 10 rows have the SAME register number
  (510423243001), so the importer rejects it with a clear error. That is the correct behaviour: a register
  number is the login, so it must be unique.
- `student_dataset_10_rows_FIXED.xlsx` is the same sheet with register numbers 510423243001..010. It imports cleanly.

Put REAL student data in `private_data/` (listed in .gitignore) and never commit it.
