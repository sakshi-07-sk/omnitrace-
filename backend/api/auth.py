from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional, List
import re
from backend.utils.helpers import get_db_connection, verify_password, hash_password, logger, write_audit_log

router = APIRouter(prefix="/auth", tags=["Authentication"])

SECRET_KEY = "omnitrace_jwt_super_secret_key_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str
    username: str

class LoginRequest(BaseModel):
    username: str
    password: str

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        full_name: str = payload.get("name")
        if username is None:
            raise credentials_exception
        return {"username": username, "role": role, "full_name": full_name}
    except JWTError:
        raise credentials_exception

class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in self.allowed_roles:
            logger.warning(f"Access Denied: User {current_user['username']} with role {current_user['role']} tried to access restricted features.")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Requires one of roles {self.allowed_roles}"
            )
        return current_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cursor = conn.cursor()
    username = form_data.username.strip().lower()
    if "@" not in username:
        username = f"{username}@omnitrace.com"
    cursor.execute("SELECT * FROM auth_users WHERE LOWER(username) = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if not user or not verify_password(form_data.password, user["hashed_password"]):
        logger.warning(f"Failed login attempt for username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"], "name": user["full_name"]},
        expires_delta=access_token_expires
    )

    write_audit_log(user["username"], "LOGIN", "Successfully logged into platform.")
    logger.info(f"User {user['username']} logged in successfully with role {user['role']}.")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "full_name": user["full_name"],
        "username": user["username"]
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    role: str
    full_name: str

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

@router.post("/register")
def register(request: UserRegisterRequest):
    allowed_roles = ["Admin", "Investigator", "SysAdmin"]
    if request.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of {allowed_roles}"
        )
    
    email = request.email.strip().lower()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email cannot be empty"
        )
    
    if not EMAIL_REGEX.match(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
        
    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if email exists (stored in username column)
    cursor.execute("SELECT 1 FROM auth_users WHERE username = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_pwd = hash_password(request.password)
    try:
        cursor.execute(
            "INSERT INTO auth_users (username, hashed_password, role, full_name) VALUES (?, ?, ?, ?)",
            (email, hashed_pwd, request.role, request.full_name)
        )
        conn.commit()
    except Exception as e:
        conn.close()
        logger.error(f"Failed to register user {email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during registration"
        )
    
    conn.close()
    
    write_audit_log(email, "REGISTER", f"Successfully registered as {request.role} ({request.full_name}).")
    logger.info(f"User {email} registered successfully with role {request.role}.")
    
    return {"status": "success", "message": f"User {email} successfully registered."}

class UserResponse(BaseModel):
    username: str
    role: str
    full_name: str

@router.get("/users", response_model=List[UserResponse])
def list_users(current_user: dict = Depends(RoleChecker(["Admin"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, role, full_name FROM auth_users")
    users = cursor.fetchall()
    conn.close()
    return [{"username": u["username"], "role": u["role"], "full_name": u["full_name"]} for u in users]

@router.delete("/users/{email}")
def delete_user(email: str, current_user: dict = Depends(RoleChecker(["Admin"]))):
    email = email.strip().lower()
    if email == current_user["username"].strip().lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Self-deletion is not permitted"
        )
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT 1 FROM auth_users WHERE username = ?", (email,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    cursor.execute("DELETE FROM auth_users WHERE username = ?", (email,))
    conn.commit()
    conn.close()
    
    write_audit_log(current_user["username"], "DELETE_USER", f"Deleted user {email}.")
    logger.info(f"User {email} was deleted by admin {current_user['username']}.")
    
    return {"status": "success", "message": f"User {email} deleted successfully."}

