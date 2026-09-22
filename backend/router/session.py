import webbrowser
from fastapi import APIRouter, HTTPException
from services.watch_scheduler import scheduler

router = APIRouter(prefix="/api/session", tags=["Session & Browser"])


@router.get("/status")
async def get_session_status():
    """Check whether the persistent browser profile is authenticated on the official Railway portal."""
    status = await scheduler.get_session_status()
    return {
        "connected": status.connected,
        "status": status.status,  # ACTIVE, LOGIN_REQUIRED, CAPTCHA_REQUIRED, EXPIRED, OFFLINE
        "user_name": status.user_name,
        "message": status.message,
        "last_checked": status.last_checked,
        "mode": scheduler.mode,
    }


@router.post("/open-login")
async def open_login_window():
    """Launch a visible Chromium window with your persistent profile so you can log in manually."""
    adapter = scheduler.get_adapter()
    success = await adapter.open_login_window()
    if not success:
        # Fallback to system browser
        try:
            webbrowser.open("https://eticket.railway.gov.bd/login")
            return {
                "message": "Opened official login page in default browser. (Playwright worker could not open directly)",
                "success": True,
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to open login window: {str(e)}")

    return {
        "message": "Visible browser window launched for manual login. Session will be preserved in .browser-profile.",
        "success": True,
    }


@router.post("/open-official")
async def open_official_portal():
    """Open the official Bangladesh Railway portal."""
    import webbrowser
    try:
        webbrowser.open("https://eticket.railway.gov.bd/")
        return {"message": "Opened official portal in browser.", "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to open portal: {str(e)}")
