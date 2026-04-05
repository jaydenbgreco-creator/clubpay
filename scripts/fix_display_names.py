from pymongo import MongoClient
import re

client = MongoClient("mongodb://localhost:27017")
db = client["test_database"]

# Fix display names - remove 'Mem-XXXXX - ' prefix
members = list(db.members.find({}, {"_id": 0, "member_id": 1, "display_name": 1, "first_name": 1, "last_name": 1}))
count = 0
for doc in members:
    dn = doc.get("display_name", "")
    if re.match(r"^Mem-\d+ - ", dn):
        clean_name = f"{doc['first_name']} {doc['last_name']}".strip()
        db.members.update_one(
            {"member_id": doc["member_id"]},
            {"$set": {"display_name": clean_name}}
        )
        count += 1

print(f"Fixed {count} display names")

# Verify
sample = db.members.find_one({"member_id": "Mem-05155"}, {"_id": 0, "member_id": 1, "display_name": 1})
print(f"Sample: {sample}")
sample2 = db.members.find_one({"member_id": "Mem-06275"}, {"_id": 0, "member_id": 1, "display_name": 1})
print(f"Sample2: {sample2}")
