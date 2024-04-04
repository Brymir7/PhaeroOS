from fastapi import Request, Response
from fastapi.responses import JSONResponse
from jose import JWTError, jwt, ExpiredSignatureError
from datetime import datetime, timedelta
import db.crud as crud
from db.database import get_db_context_managed


ALGORITHM = "HS256"
from core.config import create_settings

settings = create_settings()
SECRET_KEY = settings.SECRET_KEY  # make this os.getenv
timeTravelAmount = settings.timeTravelAmount

subscription_whitelist_str: str = settings.SUBSCRIPTION_WHITELIST

subscription_whitelist: list = (
    subscription_whitelist_str.split(",") if subscription_whitelist_str else []
)
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://localhost:7000",
    "https://test.phaero.net",
    "https://app.phaero.net",
    "https://phaero.net",
]


def create_error_response(request: Request, detail: str, status_code: int):
    request_origin = request.headers.get("Origin")
    response = JSONResponse(content={"detail": detail}, status_code=status_code)
    print(request_origin, allowed_origins, request_origin in allowed_origins)
    # Emulating CORSMiddleware behavior
    if request_origin and request_origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = request_origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        # Add other CORS headers as necessary
    else:
        # Handle non-allowed origins (could be omitted, set to 'null', or a default allowed origin)
        response.headers["Access-Control-Allow-Origin"] = "null"

    if status_code == 401:
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")

    return response


class AuthenticationChecker:
    async def __call__(self, request: Request, call_next):
        # do something with the request object
        excluded_paths = [
            "/api/v1/auth/login",
            "/api/v1/auth/google/login",
            "/api/v1/auth/google/signup",
            "/api/v1/auth/register",
            "/api/v1/auth/logout",
            "/api/v1/current_words_written/",
            "/api/v1/auth/verify_token/",
            "/api/v1/auth/refresh_token/",
            "/api/v1/webhook/",
        ]
        exclude_for_subscription = [
            "/api/v1/username/",
            "/api/v1/create-checkout-session/",
            # for user setup:
            "/api/v1/status/",
            "/api/v1/setup_user/check/",
            "/api/v1/settings/language/",
            "/api/v1/settings/timezone/",
            "/api/v1/setup_user/",
            "/api/v1/setup_user/goal/",
        ]
        subscription_whitelist = [
            "brymir7@gmail.com",
            "poiher014@gmail.com",
            "t.schoenbrodt1@gmail.com",
            "mcxavier@gmx.de",
            "neleins48@web.de",
        ]
        if request.url.path in excluded_paths:
            response = await call_next(request)
            request_origin = request.headers.get("Origin")
            if request_origin and request_origin in allowed_origins:
                response.headers["Access-Control-Allow-Origin"] = request_origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
            return response
        if request.method == "OPTIONS":  # handle preflight request
            response = await call_next(request)
            return response
        accessToken = request.cookies.get("access_token")
        if accessToken is None:
            return create_error_response(
                request=request, detail="No access token provided", status_code=401
            )
        try:
            payload = jwt.decode(accessToken, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            exp_date: datetime = datetime.fromtimestamp(payload.get("exp"))
            if username is None:
                return create_error_response(
                    request=request, detail="Invalid credentials", status_code=401
                )
            if (
                exp_date <= datetime.utcnow()
            ):  # this is possibly alrdy handled by jwt.decode
                return create_error_response(
                    request=request, detail="Expired token", status_code=401
                )
            request.state.username = username
            with get_db_context_managed() as db:
                user = crud.get_user_by_name(db, username)
                if request.url.path in exclude_for_subscription:
                    response = await call_next(request)
                    return response
                if True:  # TODO this is a temporary fix
                    response = await call_next(request)
                    return response

                subscription = crud.get_subscription(db, user.id)
                if not subscription:
                    return create_error_response(
                        request=request,
                        detail="No subscription active",
                        status_code=402,
                    )

                if not subscription.expires_on:
                    return create_error_response(
                        request=request,
                        detail="No subscription active",
                        status_code=402,
                    )

                if (
                    subscription.expires_on
                    < (datetime.utcnow() + timedelta(days=timeTravelAmount)).date()
                ):
                    if subscription.subscription_status == "active":
                        crud.update_subscription_user(db, user.id, "inactive")
                    return create_error_response(
                        request=request,
                        detail="No subscription active",
                        status_code=402,
                    )

        except ExpiredSignatureError:
            response = Response()
            response.status_code = 401
            return response
        except JWTError:
            response = Response()
            response.status_code = 401
            return response

        response = await call_next(request)
        return response
