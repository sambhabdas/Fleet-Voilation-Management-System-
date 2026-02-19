import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import User, Company, Vehicle, Driver, Violation, SafetyScore, Camera
from app.core.security import hash_password


def seed():
    # Drop and recreate
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # === Companies ===
        companies = [
            Company(name="Al-Futtaim Logistics", country="UAE"),
            Company(name="Aramex Fleet Services", country="Saudi Arabia"),
        ]
        db.add_all(companies)
        db.flush()
        print(f"Created {len(companies)} companies")

        # === Vehicles ===
        vehicle_models = [
            "Toyota Hilux", "Mitsubishi Canter", "Isuzu NPR",
            "Ford Transit", "MAN TGE", "Mercedes Sprinter",
            "Nissan Urvan", "Hyundai H-1", "Toyota HiAce",
            "Isuzu Elf",
        ]
        vehicles = []
        # 10 for Al-Futtaim (UAE)
        for i in range(10):
            v = Vehicle(
                plate_number=f"DXB-{chr(65 + i)}-{10000 + i * 1111}",
                model=vehicle_models[i],
                company_id=companies[0].id,
                status="active" if i < 9 else "maintenance",
            )
            vehicles.append(v)
        # 5 for Aramex (KSA)
        for i in range(5):
            v = Vehicle(
                plate_number=f"RUH-{chr(65 + i)}-{20000 + i * 2222}",
                model=vehicle_models[i],
                company_id=companies[1].id,
                status="active" if i < 4 else "retired",
            )
            vehicles.append(v)
        db.add_all(vehicles)
        db.flush()
        print(f"Created {len(vehicles)} vehicles")

        # === Users ===
        users = [
            User(
                username="admin",
                password_hash=hash_password("admin123"),
                full_name="System Admin",
                role="ADMIN",
                company_id=companies[0].id,
            ),
            User(
                username="manager",
                password_hash=hash_password("manager123"),
                full_name="Fleet Manager",
                role="MANAGER",
                company_id=companies[0].id,
            ),
            User(
                username="viewer",
                password_hash=hash_password("viewer123"),
                full_name="Report Viewer",
                role="VIEWER",
                company_id=companies[0].id,
            ),
        ]
        db.add_all(users)
        db.flush()
        print(f"Created {len(users)} users")

        # === Driver user + linked driver ===
        driver_user = User(
            username="driver1",
            password_hash=hash_password("driver123"),
            full_name="Ahmed Khan",
            role="DRIVER",
            company_id=companies[0].id,
        )
        db.add(driver_user)
        db.flush()

        demo_driver = Driver(
            name="Ahmed Khan",
            employee_id="EMP-001",
            country="UAE",
            active=True,
            vehicle_id=vehicles[0].id,
            user_id=driver_user.id,
        )
        db.add(demo_driver)
        db.flush()
        print("Created demo driver: Ahmed Khan (driver1/driver123)")

        # === Cameras ===
        cameras_data = [
            Camera(
                name="DXB-A Dashcam Front",
                camera_type="dashcam",
                location="Front windshield, DXB-A-10000",
                vehicle_id=vehicles[0].id,
                api_key="cam-dxb-a-front-" + "a" * 48,
                status="offline",
            ),
            Camera(
                name="DXB-A Cabin Camera",
                camera_type="cabin",
                location="Cabin interior, DXB-A-10000",
                vehicle_id=vehicles[0].id,
                api_key="cam-dxb-a-cabin-" + "b" * 48,
                status="offline",
            ),
            Camera(
                name="DXB-B Dashcam Front",
                camera_type="dashcam",
                location="Front windshield, DXB-B-11111",
                vehicle_id=vehicles[1].id,
                api_key="cam-dxb-b-front-" + "c" * 48,
                status="offline",
            ),
            Camera(
                name="Warehouse Entrance Camera",
                camera_type="external",
                location="Al-Futtaim Logistics Warehouse Gate",
                vehicle_id=None,
                api_key="cam-warehouse-ext-" + "d" * 46,
                status="offline",
            ),
            Camera(
                name="Demo Webcam",
                camera_type="webcam",
                location="Browser-based detection",
                vehicle_id=None,
                api_key="demo-webcam-api-key-for-testing-1234567890abcdef0123456789abcdef",
                status="offline",
            ),
        ]
        db.add_all(cameras_data)
        db.flush()
        print(f"Created {len(cameras_data)} cameras")

        db.commit()

        print("\n=== Seed Complete ===")
        print(f"Companies: {len(companies)}")
        print(f"Vehicles:  {len(vehicles)}")
        print(f"Drivers:   1 (Ahmed Khan)")
        print(f"Users:     {len(users) + 1}")
        print(f"Cameras:   {len(cameras_data)}")
        print(f"Violations: 0")
        print(f"Scores:     0")
        print("\n=== Login Credentials ===")
        print("admin   / admin123   (ADMIN)")
        print("manager / manager123 (MANAGER)")
        print("viewer  / viewer123  (VIEWER)")
        print("driver1 / driver123  (DRIVER)")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
