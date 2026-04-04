#!/usr/bin/env python3
"""Seed script to import members from Excel data"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime, timezone

load_dotenv('/app/backend/.env')

MEMBERS_DATA = [
  {"member_id": "Mem-05152", "first_name": "Reese", "last_name": "Hoban", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05152 | Membership: Annual"},
  {"member_id": "Mem-05155", "first_name": "Myra", "last_name": "Golden", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05155 | Membership: Annual"},
  {"member_id": "Mem-05157", "first_name": "Angelise", "last_name": "Garcia", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05157 | Membership: Annual"},
  {"member_id": "Mem-05226", "first_name": "Aubrey", "last_name": "Reyes", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05226 | Membership: Annual"},
  {"member_id": "Mem-05436", "first_name": "Alyssa", "last_name": "Pena", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05436 | Membership: Annual"},
  {"member_id": "Mem-05363", "first_name": "Kali", "last_name": "Flores Calderon", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05363 | Membership: Annual"},
  {"member_id": "Mem-05185", "first_name": "Colbie", "last_name": "Marshall", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05185 | Membership: Annual"},
  {"member_id": "Mem-05186", "first_name": "Nicholas", "last_name": "Lopez", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05186 | Membership: Annual"},
  {"member_id": "Mem-05191", "first_name": "Mason", "last_name": "Alvarez", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05191 | Membership: Annual"},
  {"member_id": "Mem-05401", "first_name": "Amelia", "last_name": "Troutman", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05401 | Membership: Annual"},
  {"member_id": "Mem-05215", "first_name": "Trebor", "last_name": "Garcia", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05215 | Membership: Annual"},
  {"member_id": "Mem-05225", "first_name": "Evangeline", "last_name": "Alvarado", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05225 | Membership: Annual"},
  {"member_id": "Mem-05258", "first_name": "Allison", "last_name": "Marquez", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05258 | Membership: Annual"},
  {"member_id": "Mem-05271", "first_name": "Everett", "last_name": "Levy", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05271 | Membership: Annual"},
  {"member_id": "Mem-05275", "first_name": "Jack", "last_name": "Froggett", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05275 | Membership: Annual"},
  {"member_id": "Mem-05276", "first_name": "Mikayla", "last_name": "Garza", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05276 | Membership: Annual"},
  {"member_id": "Mem-05291", "first_name": "Christopher", "last_name": "Hernandez", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05291 | Membership: Annual"},
  {"member_id": "Mem-05304", "first_name": "River", "last_name": "Hoffman-Harris", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05304 | Membership: Annual"},
  {"member_id": "Mem-05308", "first_name": "Malea", "last_name": "Inatsugu", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05308 | Membership: Annual"},
  {"member_id": "Mem-05319", "first_name": "Henry", "last_name": "Casa", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05319 | Membership: Annual"},
  {"member_id": "Mem-05322", "first_name": "Zayd", "last_name": "Sharif", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05322 | Membership: Annual"},
  {"member_id": "Mem-05498", "first_name": "Evie", "last_name": "Giordano", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05498 | Membership: Annual"},
  {"member_id": "Mem-05347", "first_name": "Aurora", "last_name": "Gonzalez", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05347 | Membership: Annual"},
  {"member_id": "Mem-05353", "first_name": "Elias", "last_name": "Gonzalez", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05353 | Membership: Annual"},
  {"member_id": "Mem-05593", "first_name": "Fiona", "last_name": "Bizzul-Rice", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05593 | Membership: Annual"},
  {"member_id": "Mem-05358", "first_name": "Malcolm", "last_name": "Bacon", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05358 | Membership: Annual"},
  {"member_id": "Mem-05408", "first_name": "Oliver Frost", "last_name": "Lorenzo", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05408 | Membership: Annual"},
  {"member_id": "Mem-05364", "first_name": "Georgie", "last_name": "Dixon-Harvey", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05364 | Membership: Annual"},
  {"member_id": "Mem-05368", "first_name": "Hazel", "last_name": "Carpenter", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05368 | Membership: Annual"},
  {"member_id": "Mem-05379", "first_name": "Emet", "last_name": "Ketai", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05379 | Membership: Annual"},
  {"member_id": "Mem-05403", "first_name": "Emma", "last_name": "Alvarez", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05403 | Membership: Annual"},
  {"member_id": "Mem-05387", "first_name": "Camryn", "last_name": "Washington", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05387 | Membership: Annual"},
  {"member_id": "Mem-05393", "first_name": "Victor", "last_name": "Scheuren", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05393 | Membership: Annual"},
  {"member_id": "Mem-05411", "first_name": "Olin", "last_name": "Carroll", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05411 | Membership: Annual"},
  {"member_id": "Mem-05438", "first_name": "William Olly", "last_name": "Sharp", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05438 | Membership: Annual"},
  {"member_id": "Mem-05442", "first_name": "Mara", "last_name": "Connolly-Gould", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05442 | Membership: Annual"},
  {"member_id": "Mem-05444", "first_name": "Niam", "last_name": "Pahwa", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05444 | Membership: Annual"},
  {"member_id": "Mem-05455", "first_name": "Antonio", "last_name": "Vega", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05455 | Membership: Annual"},
  {"member_id": "Mem-05458", "first_name": "Sydney", "last_name": "Harrington", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05458 | Membership: Annual"},
  {"member_id": "Mem-05482", "first_name": "Sebastian Robert", "last_name": "Coroy", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05482 | Membership: Annual"},
  {"member_id": "Mem-05501", "first_name": "Isaac", "last_name": "Saul", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05501 | Membership: Annual"},
  {"member_id": "Mem-05505", "first_name": "Andres", "last_name": "Fernandez", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05505 | Membership: Annual"},
  {"member_id": "Mem-05599", "first_name": "Robert", "last_name": "Roth", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05599 | Membership: Annual"},
  {"member_id": "Mem-05511", "first_name": "Thomas", "last_name": "Howard", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05511 | Membership: Annual"},
  {"member_id": "Mem-05548", "first_name": "Yara", "last_name": "Bruno", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05548 | Membership: Annual"},
  {"member_id": "Mem-05532", "first_name": "Emmett", "last_name": "Gibbons", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05532 | Membership: Annual"},
  {"member_id": "Mem-05553", "first_name": "Emmalie", "last_name": "Outland", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05553 | Membership: Annual"},
  {"member_id": "Mem-05583", "first_name": "Krishna", "last_name": "Aysola", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05583 | Membership: Annual"},
  {"member_id": "Mem-05598", "first_name": "Elizabeth", "last_name": "Roth", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05598 | Membership: Annual"},
  {"member_id": "Mem-05602", "first_name": "Viggo", "last_name": "Mason", "status": "Active", "starting_balance": 0, "notes": "Source ID: Mem-05602 | Membership: Annual"},
]

async def seed_members():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    imported = 0
    skipped = 0
    
    for member in MEMBERS_DATA:
        existing = await db.members.find_one({"member_id": member["member_id"]})
        if existing:
            skipped += 1
            continue
        
        display_name = f"{member['first_name']} {member['last_name']}".strip()
        qr_payload = f"CLUBPAY|{member['member_id']}|{display_name}"
        
        member_doc = {
            "id": str(uuid.uuid4()),
            "member_id": member["member_id"],
            "first_name": member["first_name"],
            "last_name": member["last_name"],
            "display_name": display_name,
            "status": member["status"],
            "starting_balance": member["starting_balance"],
            "earned": 0,
            "bonus": 0,
            "spent": 0,
            "adjustments": 0,
            "current_balance": member["starting_balance"],
            "qr_payload": qr_payload,
            "notes": member.get("notes", ""),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.members.insert_one(member_doc)
        imported += 1
    
    print(f"Imported: {imported}, Skipped (already exists): {skipped}")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_members())
