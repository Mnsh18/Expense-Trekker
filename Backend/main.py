
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from Backend.database import Base, engine, get_db
from Backend.models import TransactionDB, UserDB
from Backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from sqlalchemy import func


# ----------------------------------------
# FASTAPI APP
# ----------------------------------------

app = FastAPI(title="Expense Tracker API")


# ----------------------------------------
# CORS
# ----------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------
# CREATE DATABASE TABLES
# ----------------------------------------

Base.metadata.create_all(bind=engine)


# ----------------------------------------
# PYDANTIC MODELS
# ----------------------------------------

class Transaction(BaseModel):
    amount: float
    category: str
    type: str


class UserCreate(BaseModel):
    first_name: str
    middle_name: str | None = None
    last_name: str
    email: str
    password: str


# ----------------------------------------
# HOME
# ----------------------------------------

@app.get("/")
def home():
    return {
        "message": "Expense Tracker API is running"
    }


# ==================================================
# AUTHENTICATION
# ==================================================


# ----------------------------------------
# REGISTER
# ----------------------------------------

@app.post("/auth/register", status_code=201)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check whether the email already exists
    existing_user = db.query(UserDB).filter(
        UserDB.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create new user
    new_user = UserDB(
    first_name=user.first_name.strip(),
    middle_name=user.middle_name.strip() if user.middle_name else None,
    last_name=user.last_name.strip(),
    email=user.email.strip(),
    password_hash=hash_password(user.password)
)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user_id": new_user.id,
        "email": new_user.email
    }


# ----------------------------------------
# LOGIN
# ----------------------------------------

@app.post("/auth/login")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # OAuth2 expects the field to be called username.
    # We are using the user's email as the username.
    user = db.query(UserDB).filter(
        UserDB.email == form_data.username
    ).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify entered password against stored hash
    if not verify_password(
        form_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create JWT token
    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ----------------------------------------
# CURRENT USER
# ----------------------------------------

@app.get("/auth/me")
def get_me(
    current_user: UserDB = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "middle_name": current_user.middle_name,
        "last_name": current_user.last_name,
        "email": current_user.email
    }


# ==================================================
# TRANSACTIONS
# ==================================================


# ----------------------------------------
# CREATE TRANSACTION
# ----------------------------------------

@app.post("/transactions", status_code=201)
def create_transaction(
    transaction: Transaction,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    db_transaction = TransactionDB(
        amount=transaction.amount,
        category=transaction.category,
        type=transaction.type,
        user_id=current_user.id
    )

    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    return {
        "message": "Transaction created successfully",
        "data": {
            "id": db_transaction.id,
            "amount": db_transaction.amount,
            "category": db_transaction.category,
            "type": db_transaction.type
        }
    }


# ----------------------------------------
# GET ALL TRANSACTIONS
# ----------------------------------------

@app.get("/transactions")
def get_transactions(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    transactions = db.query(TransactionDB).filter(
        TransactionDB.user_id == current_user.id
    ).all()

    return transactions


# ----------------------------------------
# GET ONE TRANSACTION
# ----------------------------------------

@app.get("/transactions/{transaction_id}")
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    transaction = db.query(TransactionDB).filter(
        TransactionDB.id == transaction_id,
        TransactionDB.user_id == current_user.id
    ).first()

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    return transaction


# ----------------------------------------
# UPDATE TRANSACTION
# ----------------------------------------

@app.patch("/transactions/{transaction_id}")
def update_transaction(
    transaction_id: int,
    transaction: Transaction,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    db_transaction = db.query(TransactionDB).filter(
        TransactionDB.id == transaction_id,
        TransactionDB.user_id == current_user.id
    ).first()

    if db_transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    db_transaction.amount = transaction.amount
    db_transaction.category = transaction.category
    db_transaction.type = transaction.type

    db.commit()
    db.refresh(db_transaction)

    return {
        "message": "Transaction updated successfully",
        "data": {
            "id": db_transaction.id,
            "amount": db_transaction.amount,
            "category": db_transaction.category,
            "type": db_transaction.type
        }
    }


# ----------------------------------------
# DELETE TRANSACTION
# ----------------------------------------

@app.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    transaction = db.query(TransactionDB).filter(
        TransactionDB.id == transaction_id,
        TransactionDB.user_id == current_user.id
    ).first()

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    db.delete(transaction)
    db.commit()

    return {
        "message": "Transaction deleted successfully"
    }


# ==================================================
# SUMMARY
# ==================================================


@app.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    transactions = db.query(TransactionDB).filter(
        TransactionDB.user_id == current_user.id
    ).all()

    total_income = 0
    total_expenses = 0

    for transaction in transactions:

        if transaction.type == "income":
            total_income += transaction.amount

        elif transaction.type == "expense":
            total_expenses += transaction.amount

    balance = total_income - total_expenses

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance
    }
@app.get("/analytics/expenses-by-category")
def get_expenses_by_category(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    results = (
        db.query(
            TransactionDB.category,
            func.sum(TransactionDB.amount).label("total")
        )
        .filter(
            TransactionDB.user_id == current_user.id,
            TransactionDB.type == "expense"
        )
        .group_by(TransactionDB.category)
        .all()
    )

    return [
        {
            "category": category,
            "total": float(total)
        }
        for category, total in results
    ]
