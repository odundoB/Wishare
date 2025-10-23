from rest_framework_simplejwt.tokens import UntypedToken
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
from jwt import decode as jwt_decode

User = get_user_model()

def get_user_from_token(token):
    """
    Validate token and return user instance or None.
    Accepts access token (JWT).
    """
    try:
        # Validates token
        UntypedToken(token)
    except Exception as e:
        return None
    try:
        # decode token to get user id
        decoded = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = decoded.get("user_id")
        return User.objects.filter(id=user_id).first()
    except Exception:
        return None
