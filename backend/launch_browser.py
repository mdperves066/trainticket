import asyncio
import os
import sys
from pathlib import Path

async def main():
    print("=" * 60)
    print("Bangladesh Railway Official Account Login Setup")
    print("Official Source: https://eticket.railway.gov.bd/")
    print("=" * 60)
    
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("\n[ERROR] Playwright is not installed in the virtualenv.")
        print("Please run: pip install playwright && python -m playwright install chromium")
        input("\nPress Enter to exit...")
        return

    profile_dir = Path(__file__).resolve().parent / ".browser-profile"
    os.makedirs(profile_dir, exist_ok=True)
    print(f"\nUsing persistent profile directory:\n  {profile_dir}")
    print("\nLaunching visible browser window...")
    print("Instructions:")
    print("1. Log in to your personal account on the official railway website.")
    print("2. If a CAPTCHA or OTP appears, complete it manually.")
    print("3. Once logged in, your session cookies will remain saved in this profile.")
    print("4. Close the browser window when finished.\n")

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir=str(profile_dir),
            headless=False,
            viewport={"width": 1280, "height": 800},
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = context.pages[0] if context.pages else await context.new_page()
        await page.goto("https://eticket.railway.gov.bd/login")

        print("[STATUS] Browser opened to https://eticket.railway.gov.bd/login")
        print("Waiting for browser to be closed...")
        
        # Wait until user closes the page/context
        try:
            while len(context.pages) > 0 and not page.is_closed():
                await asyncio.sleep(1)
        except Exception:
            pass

        print("\n[SUCCESS] Browser closed. Your session cookies are preserved.")

if __name__ == "__main__":
    asyncio.run(main())
