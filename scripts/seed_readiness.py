import random
from datetime import date, timedelta
from app.database import SessionLocal
from app.models.athlete import Athlete            #
from app.models.readiness import DailyReadiness, InferenceSnapshot

random.seed(7)
db = SessionLocal()
today = date.today()

db.query(DailyReadiness).filter_by(source="demo").delete()
db.query(InferenceSnapshot).filter_by(source="demo").delete()

for i, a in enumerate(db.query(Athlete).all()):
    hrv0, rhr0, slp0 = random.uniform(55, 90), random.uniform(46, 58), random.uniform(420, 480)

    for d in range(35, 0, -1):                      # 35 days of normal history
        db.add(DailyReadiness(
            athlete_id=a.id, day=today - timedelta(days=d), source="demo",
            hrv_rmssd=random.gauss(hrv0, 6), resting_hr=random.gauss(rhr0, 1.5),
            sleep_minutes=random.gauss(slp0, 25), sleep_efficiency=random.uniform(84, 94)))

    poor = i % 3 == 0                               # every third athlete has a bad night today
    db.add(DailyReadiness(
        athlete_id=a.id, day=today, source="demo",
        hrv_rmssd=hrv0 - 18 if poor else hrv0, resting_hr=rhr0 + 7 if poor else rhr0,
        sleep_minutes=slp0 - 95 if poor else slp0, sleep_efficiency=78 if poor else 90))

    acwr = random.choice([1.45, 1.1]) if poor else random.choice([0.72, 1.0, 1.1])
    prob = 0.55 if poor else 0.15
    db.add(InferenceSnapshot(
        athlete_id=a.id, acwr=acwr, hr_strain=random.uniform(0.4, 0.8),
        risk_probability=prob, risk_band="amber" if poor else "low",
        perf_drop=(i == 4), source="demo"))

db.commit()
db.close()
print("Seeded demo readiness and inference data")