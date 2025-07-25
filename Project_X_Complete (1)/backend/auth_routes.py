# auth_routes.py

from fastapi import APIRouter, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse
from datetime import timedelta

from database import User
from dependencies import get_db
from auth import hash_password, verify_password, create_access_token

router = APIRouter()

@router.post("/register")
def register(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        return JSONResponse(status_code=400, content={"detail": "Username already exists."})
    
    hashed_pw = hash_password(password)
    new_user = User(username=username, password_hash=hashed_pw, role="user")
    db.add(new_user)
    db.commit()
    
    return {"detail": "Registration successful."}

@router.post("/login")
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    
    access_token = create_access_token(data={"sub": user.username}, expires_delta=timedelta(minutes=60))

    return {
        "detail": "Login successful.",
        "username": user.username,
        "role": user.role,
        "access_token": access_token  # ✅ Important for frontend
    }
