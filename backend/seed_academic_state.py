import httpx
import asyncio
from sqlalchemy import create_engine, text
from app.config import settings


# --- CONFIGURATION ---
DATABASE_URL = settings.DATABASE_URL
BASE_URL = "http://localhost:8000"
ADMIN_TOKEN = settings.ADMIN_TOKEN

async def run_full_automation():
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    engine = create_engine(DATABASE_URL)

    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            # --- CHECK CURRENT SEMESTER NUMBER ---
            with engine.connect() as conn:
                sem_result = conn.execute(text("SELECT number FROM semesters WHERE status = 'current' LIMIT 1"))
                current_sem_row = sem_result.fetchone()
                current_sem_number = current_sem_row[0] if current_sem_row else None
            
            if current_sem_number is None:
                print("🏁 No 'current' semester found. Transition complete.")
                break

            print(f"\n🔄 Processing Semester {current_sem_number}...")

            # 1. DIRECT DATABASE UPDATE (Bulk Marks)
            sql = text("""
                UPDATE enrollments
                SET final_mark = 99,
                    status = 'completed'
                FROM course_offerings
                JOIN semesters ON semesters.id = course_offerings.semester_id
                WHERE enrollments.course_offering_id = course_offerings.id
                  AND semesters.status = 'current';
            """)
            
            with engine.connect() as conn:
                result = conn.execute(sql)
                conn.commit()
                print(f"✅ SQL Executed: {result.rowcount} enrollments updated.")

            # 2. API: END SEMESTER (Always happens for 1, 2, and 3)
            print(f"🕒 Ending Semester {current_sem_number} via API...")
            end_res = await client.post(f"{BASE_URL}/admin/semesters/end", headers=headers)
            end_res.raise_for_status()

            # --- STOP LOGIC ---
            if current_sem_number == 3:
                print("🏁 Semester 3 ended. Skipping advancement as requested.")
                break

            # 3. API: ADVANCE SEMESTER (Only happens for 1 and 2)
            print(f"🚀 Advancing to next semester via API...")
            adv_res = await client.post(f"{BASE_URL}/admin/semesters/advance", headers=headers)
            adv_res.raise_for_status()
            
            await asyncio.sleep(0.5)

if __name__ == "__main__":
    try:
        asyncio.run(run_full_automation())
    except Exception as e:
        print(f"\n❌ ERROR: {e}")