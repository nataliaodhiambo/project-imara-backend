import uuid
from enum import Enum

from sqlalchemy import Column, DateTime, Enum as SQLAlchemyEnum, String, func

from app.database import Base


class UserRole(str, Enum):
    COACH = "COACH"
    SPORTS_SCIENTIST = "SPORTS_SCIENTIST"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(254), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(SQLAlchemyEnum(UserRole, name="user_role"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)