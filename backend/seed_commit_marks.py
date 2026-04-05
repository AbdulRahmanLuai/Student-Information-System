import asyncio
from sqlalchemy import create_engine, text
# Assuming your app structure is still accessible for settings
from app.config import settings

# --- CONFIGURATION ---
DATABASE_URL = settings.DATABASE_URL

def commit_marks():
    """
    Directly updates the database to set all student enrollments 
    in the current semester to 'completed' with a final mark.
    """
    engine = create_engine(DATABASE_URL)

    # SQL logic to target only the 'current' semester's enrollments
    sql = text("""
        UPDATE enrollments
        SET final_mark = 95,
            status = 'completed'
        FROM course_offerings
        JOIN semesters ON semesters.id = course_offerings.semester_id
        WHERE enrollments.course_offering_id = course_offerings.id
          AND semesters.status = 'current';
    """)
    
    print("🚀 Connecting to database to commit marks...")
    
    try:
        with engine.connect() as conn:
            # Check if there is even a current semester first
            sem_check = conn.execute(text("SELECT id, number FROM semesters WHERE status = 'current' LIMIT 1"))
            current_sem = sem_check.fetchone()
            
            if not current_sem:
                print("⚠️  Aborted: No 'current' semester found in the database.")
                return

            print(f"📝 Found active Semester {current_sem[1]}. Updating enrollments...")
            
            # Execute the update
            result = conn.execute(sql)
            conn.commit()
            
            print(f"✅ Success: {result.rowcount} enrollments have been marked as completed.")
            
    except Exception as e:
        print(f"❌ Database Error: {e}")

if __name__ == "__main__":
    commit_marks()