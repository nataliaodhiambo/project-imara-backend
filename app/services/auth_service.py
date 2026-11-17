from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")
DUMMY_PASSWORD_HASH = password_context.hash("dummy-password-for-timing")


def hash_password(password: str) -> str:
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password must not exceed 72 UTF-8 bytes")
    return password_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    if len(password.encode("utf-8")) > 72:
        return False
    return password_context.verify(password, hashed_password)


def create_access_token(data: dict) -> str:
    claims = data.copy()
    now = datetime.now(timezone.utc)
    claims.update(iat=now, exp=now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    return jwt.encode(claims, settings.SECRET_KEY, algorithm="HS256")


def credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.email == email.lower()))
    valid = verify_password(password, user.hashed_password if user else DUMMY_PASSWORD_HASH)
    if user is None or not valid:
        raise credentials_exception()
    return user


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        claims = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"],
            options={"require": ["sub", "exp", "iat"]},
        )
        user_id = claims["sub"]
        if not isinstance(user_id, str) or not user_id:
            raise credentials_exception()
    except InvalidTokenError:
        raise credentials_exception() from None
    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception()
    return user