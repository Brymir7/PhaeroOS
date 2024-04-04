from email.policy import HTTP
from fastapi import APIRouter, Depends, HTTPException, status, Cookie
from typing import Annotated, Union
from fastapi.responses import JSONResponse
import requests
from sqlmodel import Session
from db.database import get_db
from db.crud import (
    create_daily_note,
    create_user,
    create_google_user,
    get_user_by_email,
    create_streak_user,
    get_user_by_name,
    create_user_settings,
    create_subscription_user,
    create_daily_allowances_user,
    update_subscription_user,
)
import db.crud as crud
from schemas.types import (
    userSignUpInformation,
    userLoginInformation,
    GoogleAuthCode,
)
from os import urandom
from argon2 import PasswordHasher
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from jose import JWTError, jwt
from core.config import create_settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import logging

# Load variables from .env file
settings = create_settings()
timeTravelAmount = settings.timeTravelAmount

router = APIRouter()
subscription_whitelist_str: str = settings.SUBSCRIPTION_WHITELIST

subscription_whitelist: list[str] = (
    subscription_whitelist_str.split(",") if subscription_whitelist_str else []
)

SECRET_KEY = settings.SECRET_KEY  # make this os.getenv
ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
credential_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)
expiration_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Credentials expired",
    headers={"WWW-Authenticate": "Bearer"},
)


def generate_salt(length: int = 16):
    salt = urandom(length)
    return salt.hex()


def generate_hashed_pw(password: str, salt: str) -> str:
    ph = PasswordHasher()
    return ph.hash(password + salt)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


@router.post("/register")
def register_user(
    userInformation: userSignUpInformation, db: Session = Depends(get_db)
):
    username = userInformation.username
    email = userInformation.email_address
    password = userInformation.password
    if len(password) < 8 or len(password) > 32:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be between 8 and 32 characters.",
        )
    salt = generate_salt()
    hashedPassword = generate_hashed_pw(password, salt)

    try:
        create_user(
            db,
            username=username,
            email=email,
            hashed_password=hashedPassword,
            salt=salt,
        )
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists"
        )
    user = get_user_by_email(db, email)
    create_streak_user(db, user.id)
    create_daily_note(db, user.id)
    create_user_settings(db, user.id)
    create_subscription_user(db, user_id=user.id, subscription_tier="free")
    create_daily_allowances_user(db, user_id=user.id, default_allowances=True)

    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(days=1),
    )
    refresh_token = create_refresh_token(data={"sub": user.username})
    user.refresh_token = refresh_token
    db.add(user)
    db.commit()
    db.refresh(user)

    response = JSONResponse(content={"authenticated": True})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        expires=get_month_expiry(),  # too stupid to use refresh token properly atm
        path="/",
        samesite="strict",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True, 
        expires=get_month_expiry(),
        path="/api/v1/auth/refresh_token/",
        samesite="strict",
    )
    logging.info(f"User {username} created.")
    return response


@router.post("/login")
def authenticate_user(userLogin: userLoginInformation, db: Session = Depends(get_db)):
    email_address = userLogin.email_address
    password = userLogin.password
    result = get_user_by_email(db, email_address)
    try:  # handle user not found
        user = result
        dbHashedPassword = user.hashed_password
        dbSalt = user.salt
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    try:
        success = validate_pw(
            password, dbSalt, dbHashedPassword
        )  # throws exception if not valid
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(days=1),
    )
    refresh_token = create_refresh_token(data={"sub": user.username})
    user.refresh_token = refresh_token
    db.add(user)
    db.commit()
    db.refresh(user)

    response = JSONResponse(content={"authenticated": True})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        expires=get_month_expiry(),  # too stupid to use refresh token properly atm
        path="/",
        samesite="strict",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        expires=get_month_expiry(),
        path="/api/v1/auth/refresh_token/",
        samesite="strict",
    )

    return response


@router.post("/google/login")
def google_user_login(authCodeData: GoogleAuthCode, db: Session = Depends(get_db)):
    redirect_uri = ""
    if getattr(authCodeData, "scope", None):
        redirect_uri = "postmessage"
    data = {
        "code": authCodeData.code,
        "client_id": settings.GOOGLE_CLIENT_ID,  # client ID
        "client_secret": settings.GOOGLE_CLIENT_SECRET,  # client secret
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    response = requests.post("https://oauth2.googleapis.com/token", data=data)
    response_dict = response.json()
    if "id_token" not in response_dict:
        print(
            "id_token not in response_dict, you need desktop_secret.json from google api console."
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid google token."
        )
    token = response_dict["id_token"]
    request = google_requests.Request()
    id_info = id_token.verify_oauth2_token(
        token, request, settings.GOOGLE_CLIENT_ID, clock_skew_in_seconds=60
    )
    email = id_info["email"]

    result = get_user_by_email(db, email)
    try:  # handle user not found
        user = result
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User doesn't exist"
        )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User doesn't exist"
        )
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(days=7),
    )
    refresh_token = create_refresh_token(data={"sub": user.username})
    user.refresh_token = refresh_token
    db.add(user)
    db.commit()

    response = JSONResponse(content={"authenticated": True})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        expires=get_month_expiry(),  # too stupid to use refresh token properly atm
        path="/",
        samesite="strict",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        expires=get_month_expiry(),
        path="/api/v1/auth/refresh_token/",
        samesite="strict",
    )

    return response


@router.post("/google/signup")
def user_google_signup(authCodeData: GoogleAuthCode, db: Session = Depends(get_db)):
    redirect_uri = ""
    if getattr(authCodeData, "scope", None):
        redirect_uri = "postmessage"
    data = {
        "code": authCodeData.code,
        "client_id": settings.GOOGLE_CLIENT_ID,  # client ID
        "client_secret": settings.GOOGLE_CLIENT_SECRET,  # client secret
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    response = requests.post("https://oauth2.googleapis.com/token", data=data)
    response_dict = response.json()
    token = response_dict["id_token"]
    request = google_requests.Request()
    try:
        id_info = id_token.verify_oauth2_token(
            token, request, settings.GOOGLE_CLIENT_ID, clock_skew_in_seconds=60
        )
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid google token."
        )
    try:
        create_google_user(db, username=id_info["name"], email=id_info["email"])
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists"
        )
    user = get_user_by_email(db, id_info["email"])
    create_streak_user(db, user.id)
    create_daily_note(db, user.id)
    create_user_settings(db, user.id)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(days=1),
    )
    refresh_token = create_refresh_token(data={"sub": user.username})
    user.refresh_token = refresh_token
    db.add(user)
    db.commit()
    if user.email in subscription_whitelist:  # TODO check if user is in whitelist
        create_subscription_user(
            db,
            user_id=user.id,
            subscription_tier="Phaero Premium",
            subscription_status="active",
            customer_id="whitelist",
        )
    else:
        create_subscription_user(
            db,
            user_id=user.id,
            subscription_tier="Phaero Premium",
            subscription_status="active",
            customer_id="whitelist",
        )
        expires_on = (datetime.utcnow() + timedelta(days=7)).date()
        update_subscription_user(db, user_id=user.id, expires_on=expires_on)
    create_daily_allowances_user(db, user_id=user.id, default_allowances=True)
    response = JSONResponse(content={"authenticated": True})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        expires=get_month_expiry(),
        path="/",
        samesite="strict",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        expires=get_month_expiry(),
        path="/api/v1/auth/refresh_token/",
        samesite="strict",
    )
    return response


@router.post("/verify_token/")
def verify_access_token(
    access_token: Annotated[Union[str, None], Cookie()] = None,
    db: Session = Depends(get_db),
):
    print(access_token)
    if access_token is None:
        raise credential_exception
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        exp_date: datetime = datetime.fromtimestamp(payload.get("exp"))
        if exp_date <= datetime.utcnow():
            raise expiration_exception
        if username is None:
            raise credential_exception
    except JWTError:
        raise credential_exception

    user_id = crud.get_user_by_name(db, username).id
    return {"authenticated": True, "user_id": user_id}


@router.post("/refresh_token/")
def refresh_access_token(
    refresh_token: Annotated[Union[str, None], Cookie()] = None,
    db: Session = Depends(get_db),
):
    if refresh_token is None:
        raise credential_exception
    payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
    username: str = payload.get("sub")
    exp_date: datetime = datetime.fromtimestamp(payload.get("exp"))
    if exp_date <= datetime.utcnow():
        raise expiration_exception
    if username is None:
        raise credential_exception

    result = get_user_by_name(db, username)
    try:  # handle user not found
        user = result
        refresh_token = user.refresh_token
    except Exception:
        logging.info(f"User {username} couldn't refresh token.")
        print(f"User {username} couldn't refresh token.")
        raise credential_exception
    if refresh_token != refresh_token:
        logging.info(f"User {username} refresh token in db unequal sent token.")
        print(f"User {username} refresh token in db unequal sent token.")
        # raise credential_exception
        username_db = user.username
        if username_db != username:
            logging.info(
                f"User {username} username in db unequal sent username in refresh token."
            )
            print(
                f"User {username} username in db unequal sent username in refresh token."
            )
            raise credential_exception
    access_token = create_access_token(
        data={"sub": username},
        expires_delta=timedelta(days=1),
    )
    response = JSONResponse(content={"authenticated": True})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        expires=get_day_expiry(),
        path="/",
        samesite="strict",
    )
    return response


@router.get("/logout")
def logout():
    response = JSONResponse(content={"authenticated": False})
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    return response


def create_access_token(data: dict, expires_delta: timedelta or None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + timedelta(days=timeTravelAmount) + expires_delta
    else:
        expire = (
            datetime.utcnow() + timedelta(days=timeTravelAmount) + timedelta(minutes=15)
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=timeTravelAmount) + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def validate_pw(password: str, salt: str, hashedPw: str) -> bool:
    ph = PasswordHasher()
    return ph.verify(hashedPw, password + salt)  # raises exception or true


def get_week_expiry():
    expiry = datetime.utcnow()
    expiry += timedelta(seconds=60 * 60 * 24 * 7)
    return expiry.strftime("%a, %d-%b-%Y %T GMT")


def get_month_expiry():
    expiry = datetime.utcnow()
    expiry += timedelta(seconds=60 * 60 * 24 * 30)
    return expiry.strftime("%a, %d-%b-%Y %T GMT")


def get_day_expiry():
    expiry = datetime.utcnow()
    expiry += timedelta(seconds=60 * 60 * 24)
    return expiry.strftime("%a, %d-%b-%Y %T GMT")


def get_past_expiry():
    # Set expiration to a time in the past
    past_expiry = (
        datetime.utcnow() + timedelta(days=timeTravelAmount) - timedelta(days=100)
    )
    return past_expiry.strftime("%a, %d-%b-%Y %T GMT")
