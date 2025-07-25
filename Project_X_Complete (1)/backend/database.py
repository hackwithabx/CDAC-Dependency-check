# database.py  
# Database setup and ORM models for Project X using SQLAlchemy  

from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Enum  
from sqlalchemy.orm import declarative_base, sessionmaker  
import datetime  
from dotenv import load_dotenv  
import os  
import enum  

# ✅ Load environment variables  
load_dotenv()  

# ✅ Path to local SQLite database from .env  
DATABASE_URL = os.getenv("DATABASE_URL")  

# ✅ Create database engine with SQLite  
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})  

# ✅ Database session factory  
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)  

# ✅ Base class for all model classes  
Base = declarative_base()  


# ✅ Enum for scan status tracking  
class ScanStatusEnum(enum.Enum):  
    uploading = "uploading"  
    extracting = "extracting"  
    scanning = "scanning"  
    report_generating = "report_generating"  
    completed = "completed"  
    failed = "failed"  


# ✅ User table: for login, role, and token  
class User(Base):  
    __tablename__ = "users"  
    id = Column(Integer, primary_key=True, index=True)  
    username = Column(String, unique=True, index=True)  
    password_hash = Column(String)  
    role = Column(String)  # 'admin' or 'user'  
    token = Column(String, nullable=True)  # Optional session token  


# ✅ Scan table: stores uploaded scan info and report status  
class Scan(Base):  
    __tablename__ = "scans"  
    id = Column(Integer, primary_key=True, index=True)  
    scan_id = Column(String, unique=True, index=True)  
    username = Column(String)  
    filename = Column(String)  
    upload_datetime = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))  
    pci_dss = Column(Boolean, default=False)  
    report_path = Column(String)  
    status = Column(Enum(ScanStatusEnum), default=ScanStatusEnum.uploading)  


# ✅ Audit log: records login, report downloads, deletions etc.  
class AuditLog(Base):  
    __tablename__ = "audit_logs"  
    id = Column(Integer, primary_key=True, index=True)  
    event = Column(String)  
    username = Column(String)  
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))  
    action_type = Column(String)  # e.g., scan, report_download, delete  
