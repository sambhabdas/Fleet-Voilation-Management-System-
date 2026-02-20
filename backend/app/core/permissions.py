from fastapi import Depends, HTTPException, status

from app.dependencies import get_current_user
from app.models.user import User


def require_roles(*allowed_roles):
    def dependency(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return dependency


require_admin = require_roles("ADMIN")
require_manager_or_above = require_roles("ADMIN", "MANAGER")
