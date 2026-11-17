from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class SessionCreate(BaseModel):
    drill_type: str = Field(min_length=1, max_length=50)
    planned_duration_mins: int = Field(ge=1, le=600)
    intensity_target: str = Field(min_length=1, max_length=20)


class SessionUpdate(BaseModel):
    drill_type: str | None = Field(default=None, min_length=1, max_length=50)
    planned_duration_mins: int | None = Field(default=None, ge=1, le=600)
    intensity_target: str | None = Field(default=None, min_length=1, max_length=20)


class SessionEnd(BaseModel):
    actual_duration_mins: int = Field(ge=0, le=600)


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: str
    session_date: date
    drill_type: str
    intensity_target: str
    created_at: datetime
    planned_duration_mins: int
    actual_duration_mins: int | None = None
