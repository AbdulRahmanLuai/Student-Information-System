from passlib.context import CryptContext

# Create a password context with bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain-text password.
    Returns a string suitable for storing in the database.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a hashed password.
    Returns True if they match, else False.
    """
    return pwd_context.verify(plain_password, hashed_password)
