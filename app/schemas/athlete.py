from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class AthleteCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)
    position: str = Field(min_length=1, max_length=20)
    date_of_birth: date


class AthleteUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=50)
    last_name: str | None = Field(default=None, min_length=1, max_length=50)
    position: str | None = Field(default=None, min_length=1, max_length=20)
    date_of_birth: date | None = None


class AthleteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    athlete_id: str
    first_name: str
    last_name: str
    position: str
    date_of_birth: date
    created_at: datetime
