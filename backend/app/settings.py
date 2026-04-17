from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="TUNEBOARD_",
        extra="ignore",
    )

    auth_file: str = ""
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175"

    @property
    def auth_path(self) -> Path | None:
        root = Path(__file__).resolve().parent.parent
        if self.auth_file:
            p = Path(self.auth_file)
            if not p.is_absolute():
                p = root / p
            return p if p.exists() else None
        for name in ("browser.json", "oauth.json"):
            p = root / name
            if p.exists():
                return p
        return None

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
