from fastapi import HTTPException


def validate_password(password):
    if (len(password) < 8 or not any(c.isupper() for c in password)
        or not any(c.islower() for c in password) or not any(c.isdecimal() for c in password)
        or not any(not c.isalnum() and not c.isspace() for c in password)
        or len(password.encode('utf-8')) > 72):
        raise HTTPException(422, 'password_policy')
