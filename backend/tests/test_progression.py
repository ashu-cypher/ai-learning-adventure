"""Automated test suite verifying the complete Color World progression and AI Agent logic."""
import sys
import asyncio
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import init_db

async def run_tests():
    print("🚀 Initializing DB...")
    await init_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        print("Checking /api/health...")
        res = await client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("✓ Health check OK:", res.json())

        # 2. Reset child progress to ensure clean slate
        print("Resetting child progress for test...")
        res = await client.post("/api/progress/test-child/reset")
        assert res.status_code == 200

        # 3. Check Worlds
        print("Fetching /api/worlds...")
        res = await client.get("/api/worlds?child_id=test-child")
        assert res.status_code == 200
        worlds = res.json()
        assert len(worlds) >= 1
        colors_world = next(w for w in worlds if w["id"] == "colors")
        assert colors_world["stages"][0]["status"] == "unlocked"
        assert colors_world["stages"][1]["status"] == "locked"
        print(f"✓ World 1 loaded with {len(colors_world['stages'])} stages. Stage 1 unlocked, Stage 2 locked.")

        # 4. Fetch Stage 1 (Find Red) Lesson
        print("Fetching Stage 1 lesson plan...")
        res = await client.get("/api/stages/colors/colors-1?child_id=test-child")
        assert res.status_code == 200
        stage1 = res.json()
        assert stage1["concept"] == "red"
        assert len(stage1["teaching"]["see_objects"]) > 0
        assert "red" in stage1["teaching"]["hear_text"].lower()
        assert stage1["activity"]["visual_type"] == "object_selection"
        print("✓ Stage 1 Lesson generated cleanly by LearningAgent & sub-agents.")

        # 5. Test Incorrect Answer (Safety & Non-Shaming)
        print("Testing incorrect answer submission...")
        wrong_sub = {
            "child_id": "test-child",
            "world_id": "colors",
            "stage_id": "colors-1",
            "concept": "red",
            "selected_answer": "banana",
            "attempt_number": 1,
            "difficulty": 1
        }
        res = await client.post("/api/stages/colors/colors-1/submit", json=wrong_sub)
        assert res.status_code == 200
        assess_wrong = res.json()
        assert assess_wrong["is_correct"] is False
        # Check non-shaming language
        assert "wrong" not in assess_wrong["ai_reaction"].lower()
        assert "fail" not in assess_wrong["ai_reaction"].lower()
        print(f"✓ Non-shaming AI reaction received: '{assess_wrong['ai_reaction']}'")

        # 6. Test Repeated Struggle -> Adaptive Simplification
        print("Testing second mistake to trigger adaptive simplification...")
        wrong_sub["attempt_number"] = 2
        res = await client.post("/api/stages/colors/colors-1/submit", json=wrong_sub)
        assert res.status_code == 200
        assess_adapted = res.json()
        assert assess_adapted["next_action"] == "retry_simplified"
        assert assess_adapted["simplified_activity"] is not None
        assert len(assess_adapted["simplified_activity"]["objects"]) <= 2
        print(f"✓ Adaptation Agent simplified activity to {len(assess_adapted['simplified_activity']['objects'])} objects with glow assistance!")

        # 7. Test Correct Answer Submission
        print("Submitting correct answer (apple)...")
        correct_sub = {
            "child_id": "test-child",
            "world_id": "colors",
            "stage_id": "colors-1",
            "concept": "red",
            "selected_answer": "apple",
            "attempt_number": 3,
            "difficulty": 1
        }
        res = await client.post("/api/stages/colors/colors-1/submit", json=correct_sub)
        assert res.status_code == 200
        assess_correct = res.json()
        assert assess_correct["is_correct"] is True
        assert assess_correct["stage_completed"] is True
        assert assess_correct["stars_earned"] >= 1
        assert assess_correct["next_stage_id"] == "colors-2"
        print(f"✓ Correct answer celebrated! Stars earned: {assess_correct['stars_earned']}. Next stage unlocked: {assess_correct['next_stage_id']}")

        # 8. Check that Stage 2 is now unlocked
        res = await client.get("/api/worlds?child_id=test-child")
        colors_world = next(w for w in res.json() if w["id"] == "colors")
        assert colors_world["stages"][0]["status"] == "completed"
        assert colors_world["stages"][1]["status"] == "unlocked"
        print("✓ Verified Stage 1 is marked 'completed' and Stage 2 is now 'unlocked'!")

        # 9. Test Color Matching (Stage 5)
        print("Testing Color Matching (Stage 5)...")
        res = await client.get("/api/stages/colors/colors-5?child_id=test-child")
        assert res.status_code == 200
        stg5 = res.json()
        assert stg5["activity"]["visual_type"] == "color_match"
        assert len(stg5["activity"]["targets"]) >= 3
        print("✓ Color Matching stage configured with color target buckets.")

        # 10. Test Parent Dashboard
        print("Testing /api/progress/test-child/parent-dashboard...")
        res = await client.get("/api/progress/test-child/parent-dashboard")
        assert res.status_code == 200
        parent_data = res.json()
        assert parent_data["total_stars"] >= 1
        assert len(parent_data["concept_masteries"]) >= 1
        print("✓ Parent dashboard analytics verified. Stars:", parent_data["total_stars"], "Notes:", parent_data["ai_companion_notes"])

        print("\n🎉 ALL BACKEND PROGRESSION & AGENT TESTS PASSED SUCCESSFULLY! 🎉\n")

if __name__ == "__main__":
    asyncio.run(run_tests())
