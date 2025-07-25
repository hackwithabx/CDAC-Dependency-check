import os
import shutil
import uuid
import zipfile
import subprocess
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form, Request, Depends, HTTPException, Body
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import SessionLocal, User, Scan, Base, engine, ScanStatusEnum
from dependencies import get_db
from auth import hash_password, get_current_user
from utils.report_generator import generate_pdf
from auth_routes import router as auth_router

# Load environment variables
load_dotenv()
DEPENDENCY_CHECK_CMD = os.getenv("DEPENDENCY_CHECK_CMD")
DEPENDENCY_CHECK_DATA = os.getenv("DEPENDENCY_CHECK_DATA")

# Ensure folders exist
Path("uploads").mkdir(exist_ok=True)
Path("reports").mkdir(exist_ok=True)
Path("templates").mkdir(exist_ok=True)

app = FastAPI()

# Mount auth routes
app.include_router(auth_router, prefix="", tags=["auth"])

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="templates")
Base.metadata.create_all(bind=engine)

# Create admin if not exists
with SessionLocal() as db:
    admin_user = db.query(User).filter(User.role == 'admin').first()
    if not admin_user:
        db.add(User(username="admin", password_hash=hash_password("admin123"), role="admin"))
        db.commit()

# Audit logging helper
def add_audit_log(db: Session, event: str, username: str, action_type: str):
    from database import AuditLog
    db.add(AuditLog(event=event, username=username, action_type=action_type))
    db.commit()

# HTML routes
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/history", response_class=HTMLResponse)
def history_page(request: Request):
    return templates.TemplateResponse("history.html", {"request": request})

@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/register", response_class=HTMLResponse)
def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

# Password reset endpoints
@app.post("/forgot-password")
def forgot_password(username: str = Body(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return JSONResponse(status_code=404, content={"detail": "User not found."})
    return {"detail": f"User {username} exists. Proceed with reset."}

@app.post("/reset-password")
def reset_password(username: str = Body(...), new_password: str = Body(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return JSONResponse(status_code=404, content={"detail": "User not found."})
    user.password_hash = hash_password(new_password)
    db.commit()
    return {"detail": "Password reset successfully."}

# Scan ZIP
@app.post("/scan")
async def scan_zip(
    file: UploadFile = File(...),
    pci_dss: bool = Form(False),
    username: str = Form(...),
    db: Session = Depends(get_db)
):
    scan_id = str(uuid.uuid4())
    source_folder = f"uploads/{scan_id}"
    os.makedirs(source_folder, exist_ok=True)

    db_scan = Scan(
        scan_id=scan_id,
        username=username,
        filename=file.filename,
        pci_dss=pci_dss,
        report_path="",
        status=ScanStatusEnum.uploading,
        upload_datetime=datetime.utcnow()
    )
    db.add(db_scan)
    db.commit()

    try:
        zip_path = os.path.join(source_folder, file.filename)
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        db_scan.status = ScanStatusEnum.extracting
        db.commit()

        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(source_folder)

        scan_target_folder = os.path.abspath(source_folder).replace("\\", "/")
        report_dir = os.path.join(source_folder, "depcheck-report")
        os.makedirs(report_dir, exist_ok=True)

        dependency_check_cmd = [
            DEPENDENCY_CHECK_CMD,
            "--project", scan_id,
            "--scan", scan_target_folder,
            "--format", "ALL",
            "--out", report_dir,
            "--disableAssembly",
            "--noupdate",
            "--data", DEPENDENCY_CHECK_DATA
        ]

        db_scan.status = ScanStatusEnum.scanning
        db.commit()

        result = subprocess.run(dependency_check_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise subprocess.CalledProcessError(result.returncode, dependency_check_cmd, result.stdout, result.stderr)

        db_scan.status = ScanStatusEnum.report_generating
        db.commit()

        from utils.report_generator import extract_vulnerabilities

        dc_report_xml = os.path.join(report_dir, "dependency-check-report.xml")
        if not os.path.exists(dc_report_xml):
            raise FileNotFoundError("dependency-check-report.xml not found")

        vulnerabilities = extract_vulnerabilities(dc_report_xml, scan_target_folder)

        pdf_path = os.path.join("reports", f"{scan_id}.pdf")
        generate_pdf(scan_id, zip_path, pdf_path, pci_dss, vulnerabilities, file.filename)

        final_report_dir = os.path.join("reports", f"{scan_id}_depcheck")
        os.makedirs(final_report_dir, exist_ok=True)
        shutil.move(report_dir, final_report_dir)

        db_scan.report_path = pdf_path
        db_scan.status = ScanStatusEnum.completed
        db.commit()

        add_audit_log(db, event=f"Scan initiated: {scan_id}", username=username, action_type="scan")
        return {"scan_id": scan_id}

    except Exception as e:
        db_scan.status = ScanStatusEnum.failed
        db.commit()
        return JSONResponse(status_code=500, content={"detail": f"Unexpected error: {str(e)}"})

# Authenticated routes
@app.get("/report/{scan_id}")
def get_report(scan_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.scan_id == scan_id).first()
    if not scan:
        return JSONResponse(status_code=404, content={"detail": "Report not found."})

    if current_user.role != "admin" and scan.username != current_user.username:
        return JSONResponse(status_code=403, content={"detail": "Access forbidden."})

    if os.path.exists(scan.report_path):
        add_audit_log(db, event=f"Report downloaded: {scan_id}", username=current_user.username, action_type="report_download")
        return FileResponse(scan.report_path, media_type="application/pdf", filename=f"{scan_id}.pdf")
    return JSONResponse(status_code=404, content={"detail": "Report not found."})

@app.get("/scan_history")
def scan_history(target_user: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin" and not target_user:
        scans = db.query(Scan).all()
    else:
        if target_user and current_user.role != "admin":
            return JSONResponse(status_code=403, content={"detail": "Access forbidden."})
        scans = db.query(Scan).filter(Scan.username == (target_user or current_user.username)).all()

    return [ {
        "scan_id": scan.scan_id,
        "filename": scan.filename,
        "upload_datetime": scan.upload_datetime,
        "pci_dss": scan.pci_dss,
        "report_path": scan.report_path,
        "status": scan.status.value
    } for scan in scans ]

@app.get("/dashboard-stats")
def dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        from utils.report_generator import extract_vulnerabilities

        scans = db.query(Scan).all() if current_user.role == "admin" else db.query(Scan).filter(Scan.username == current_user.username).all()

        risk_levels = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
        latest_scan_date = None

        for scan in scans:
            if not latest_scan_date or scan.upload_datetime > latest_scan_date:
                latest_scan_date = scan.upload_datetime

            xml_path = os.path.join("reports", f"{scan.scan_id}_depcheck", "dependency-check-report.xml")
            source_path = os.path.abspath(os.path.join("uploads", scan.scan_id))

            if os.path.exists(xml_path):
                try:
                    vulns = extract_vulnerabilities(xml_path, source_path)
                    for v in vulns:
                        sev = v.get("severity", "").capitalize()
                        if sev in risk_levels:
                            risk_levels[sev] += 1
                except Exception as e:
                    print(f"⚠️ Skipping scan {scan.scan_id}: {e}")
                    continue

        return {
            "total_scans": len(scans),
            "latest_scan_date": latest_scan_date.isoformat() if latest_scan_date else None,
            "risk_counts": risk_levels
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.delete("/delete_source/{scan_id}")
def delete_uploaded_source(scan_id: str):
    source_folder = os.path.join("uploads", scan_id)
    if os.path.exists(source_folder):
        shutil.rmtree(source_folder)
        return {"detail": f"Source code for scan {scan_id} deleted."}
    return {"detail": f"No source code folder found for scan {scan_id}."}

@app.delete("/delete/{scan_id}")
def delete_scan(scan_id: str):
    pdf_path = os.path.join("reports", f"{scan_id}.pdf")
    depcheck_report_dir = os.path.join("reports", f"{scan_id}_depcheck")
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    if os.path.exists(depcheck_report_dir):
        shutil.rmtree(depcheck_report_dir)
    return {"detail": f"Scan {scan_id} deleted successfully."}
