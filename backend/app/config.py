"""Application settings, read from environment variables or a .env file."""
from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_SECRET = "dev-only-change-me-dev-only-change-me"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: str = "development"  # development | test | production
    database_url: str = "sqlite:///./kiosk.db"
    db_serverless: bool = False
    secret_key: str = DEV_SECRET
    access_token_minutes: int = 30
    cors_origins: str = "http://localhost:5173,http://localhost:8080,http://localhost:3000"

    # First-login password = the student's date of birth as ddmmyyyy; the student must change it at first login.
    initial_password_format: str = "ddmm"  # ddmm (the college rule: 4 digits)

    # Login protection
    max_failed_logins: int = 5
    lockout_minutes: int = 15
    bcrypt_rounds: int = 12

    # College rules (edit when the college confirms them)
    attendance_min_percent: float = 75.0
    hours_per_day: int = 7
    timezone: str = "Asia/Kolkata"
    college_name: str = "Arunai Engineering College (Autonomous)"
    assignment_numbers: str = "1,2,3,4,5"
    # Leave policy: None = not enforced yet ("-- add from college")
    leave_max_days: int | None = None
    leave_max_past_days: int | None = None
    block_overlapping_leave: bool = True  # refuse a request whose dates overlap an active one
    staff_see_contact: bool = False       # show students' mobile/email to counsellors and HOD

    # Uploads (OD letters, notice attachments) are stored in the database, so they survive redeploys.
    max_upload_bytes: int = 2 * 1024 * 1024
    max_attachments: int = 3

    @model_validator(mode="after")
    def _production_checks(self) -> "Settings":
        if self.env == "production":
            if self.secret_key == DEV_SECRET or len(self.secret_key) < 32:
                raise ValueError("SECRET_KEY must be set to a random value of 32+ characters in production")
            if self.database_url.startswith("sqlite"):
                raise ValueError("Use PostgreSQL (DATABASE_URL) in production, not SQLite")
        return self

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def assignment_number_list(self) -> list[int]:
        return [int(x) for x in self.assignment_numbers.split(",") if x.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
