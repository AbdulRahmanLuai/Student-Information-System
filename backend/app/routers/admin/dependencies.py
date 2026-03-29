from fastapi import Depends, HTTPException
from ...models import Role
from ... import oauth2

def require_admin(current_user = Depends(oauth2.get_current_user)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="only admins can access this operation")