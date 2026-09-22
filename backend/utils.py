import bcrypt

def hash(password: str) -> str:
    """
    Hash a password using native bcrypt.
    Truncates to 72 bytes to conform to bcrypt specification.
    """
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify(plainPassword: str, hashedPassword: str) -> bool:
    """
    Verify a plain password against a bcrypt hashed password.
    Includes fallback for legacy plain text passwords.
    """
    try:
        pwd_bytes = plainPassword.encode("utf-8")[:72]
        hash_bytes = hashedPassword.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        # Fallback for plain-text legacy passwords if any exist
        return plainPassword == hashedPassword