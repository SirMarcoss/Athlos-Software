from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic.fields import Field
from pydantic.functional_validators import field_validator


class Settings(BaseSettings):

    DATABASE_URL : str
    SECRET_KEY : str = Field(..., min_length=32)
    ALGORITHM : str
    ACCESS_TOKEN_EXPIRE_MINUTES : int = 30
    GEMINI_API_KEY: str = Field(...)


    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key_entropy(cls, v):
        if len(set(v)) < 8: #almeno 8 caratteri univoci
            raise ValueError('SECRET_KEY must have sufficient entropy')
        return v

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings() #It uses that template to create an actual object in memory,
                      # which reads the .env file and keeps the values ready.