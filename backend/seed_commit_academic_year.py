import httpx
import asyncio
from sqlalchemy import create_engine, text
from app.config import settings

# --- CONFIGURATION ---
DATABASE_URL = settings.DATABASE_URL
BASE_URL = "http://localhost:8000"
ACADEMIC_BASE_URL = f"{BASE_URL}/admin/academic-year"
SEMESTER_BASE_URL = f"{BASE_URL}/admin/semesters" 

# Double check that settings.ADMIN_TOKEN is actually populated
ADMIN_TOKEN = settings.ADMIN_TOKEN

async def prepare_for_commit():
    if not ADMIN_TOKEN:
        print("❌ ERROR: ADMIN_TOKEN is empty. Check your .env file and Settings class.")
        return

    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    engine = create_engine(DATABASE_URL)

    async with httpx.AsyncClient(timeout=30.0) as client:
        # --- PHASE 1: CLOSE OUT THE CURRENT YEAR ---
        while True:
            with engine.connect() as conn:
                sem_result = conn.execute(text("SELECT number FROM semesters WHERE status = 'current' LIMIT 1"))
                row = sem_result.fetchone()
                current_num = row[0] if row else None
            
            if current_num is None:
                print("✨ No active semester found in DB. Proceeding to migration.")
                break

            print(f"🔄 Processing Semester {current_num}...")

            # 1. Bulk Update Marks
            with engine.connect() as conn:
                conn.execute(text("""
                    UPDATE enrollments SET 
                        final_mark = floor(random() * 101)::int, 
                        status = 'completed'
                    FROM course_offerings 
                    JOIN semesters ON semesters.id = course_offerings.semester_id
                    WHERE enrollments.course_offering_id = course_offerings.id 
                    AND semesters.status = 'current';
                """))
                conn.commit()
            print("  ✅ Database: All current enrollments set to 99.")

            # 2. End Semester
            # Added raise_for_status() to catch the 401s immediately
            end_res = await client.post(f"{SEMESTER_BASE_URL}/end", headers=headers)
            end_res.raise_for_status() 
            print(f"  ✅ API: Semester {current_num} ended successfully.")

            if current_num == 3:
                print("🏁 Year finalized.")
                break

            # 3. Advance (if 1 or 2)
            print(f"  🚀 API: Advancing to next semester...")
            adv_res = await client.post(f"{SEMESTER_BASE_URL}/advance", headers=headers)
            adv_res.raise_for_status()
            
            await asyncio.sleep(1.0) # Slightly longer sleep for DB consistency

        # --- PHASE 2: START MIGRATION ---
        print("\n🛠 Starting Academic Year Migration...")
        reset_res = await client.delete(f"{ACADEMIC_BASE_URL}/reset", headers=headers)
        # reset_res.raise_for_status() # Uncomment if you want to enforce reset success
        
        start_res = await client.post(f"{ACADEMIC_BASE_URL}/start", headers=headers)
        start_res.raise_for_status()
        print("✅ Migration started. Draft created.")

        # --- PHASE 3: AUTO-CONFIGURE DRAFT ---
        sections_res = await client.get(f"{ACADEMIC_BASE_URL}/sections", headers=headers)
        sections_res.raise_for_status()
        sections = sections_res.json()

        print(f"📋 Configuring {len(sections)} sections...")

        for sec in sections:
            sec_id = sec['id']
            detail_res = await client.get(f"{ACADEMIC_BASE_URL}/sections/{sec_id}", headers=headers)
            detail_res.raise_for_status()
            detail = detail_res.json()

            update_payload = {"courses": []}
            for course in detail['courses']:
                if course['teachers']:
                    update_payload["courses"].append({
                        "setup_course_id": course['setup_course_id'],
                        "teacher_id": course['teachers'][0]['id']
                    })

            if update_payload["courses"]:
                put_res = await client.put(f"{ACADEMIC_BASE_URL}/sections/{sec_id}", json=update_payload, headers=headers)
                put_res.raise_for_status()
                print(f"  ✅ Section {detail['section']} ready.")

        print("\n🚀 TARGET REACHED: Everything is ready for the /commit test.")

if __name__ == "__main__":
    try:
        asyncio.run(prepare_for_commit())
    except httpx.HTTPStatusError as e:
        print(f"\n❌ AUTH/API ERROR: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        print(f"\n❌ GENERAL ERROR: {e}")