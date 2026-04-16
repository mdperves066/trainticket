from passlib.context import CryptContext




pwdContext = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash(password:str):
    return pwdContext.hash(password)

def verify(plainPassword, hashedPassword):
    return pwdContext.verify(plainPassword,hash(hashedPassword))