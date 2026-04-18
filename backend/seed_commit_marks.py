import asyncio
from sqlalchemy import create_engine, text
from app.config import settings

DATABASE_URL = settings.DATABASE_URL

def commit_marks():
    engine = create_engine(DATABASE_URL)
    sql_update_enrollments = text("""
        UPDATE enrollments
        SET final_mark = floor(random() * 101)::int,
            status = 'completed'
        FROM course_offerings
        JOIN semesters ON semesters.id = course_offerings.semester_id
        WHERE enrollments.course_offering_id = course_offerings.id
          AND semesters.status = 'current'
          AND enrollments.status != 'completed';
    """)
    sql_update_course_offerings = text("""
        UPDATE course_offerings
        SET status = 'completed'
        FROM semesters
        WHERE course_offerings.semester_id = semesters.id
          AND semesters.status = 'current'
          AND course_offerings.status != 'completed';
    """)
    
    print("🚀 Connecting to database...")
    try:
        with engine.connect() as conn:
            # Check for current semester
            sem_check = conn.execute(text("SELECT id, number FROM semesters WHERE status = 'current' LIMIT 1"))
            current_sem = sem_check.fetchone()
            if not current_sem:
                print("⚠️ Aborted: No 'current' semester found.")
                return
            print(f"📝 Found active Semester {current_sem[1]}.")
            
            # Update enrollments
            result_enr = conn.execute(sql_update_enrollments)
            print(f"✅ {result_enr.rowcount} enrollments updated to completed.")
            
            # Update course offerings
            result_co = conn.execute(sql_update_course_offerings)
            print(f"✅ {result_co.rowcount} course offerings marked as completed.")
            
            conn.commit()
    except Exception as e:
        print(f"❌ Database Error: {e}")

if __name__ == "__main__":
    commit_marks()