from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from datetime import datetime
from zoneinfo import ZoneInfo
from Backend.database import Base



class TransactionDB(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    category = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)
    description = Column(String(255), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(
    DateTime,
    default=lambda: datetime.now(ZoneInfo("Asia/Kolkata")),
    nullable=False
)
class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=False)

    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)