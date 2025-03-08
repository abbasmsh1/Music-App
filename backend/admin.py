from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
from typing import Optional

# Admin API key header
ADMIN_KEY = "admin123"  # Should match Flask app's ADMIN_PASSWORD
X_ADMIN_KEY = APIKeyHeader(name="X-Admin-Key")

def verify_admin_key(api_key: str = Security(X_ADMIN_KEY)) -> bool:
    if api_key != ADMIN_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate admin credentials"
        )
    return True 