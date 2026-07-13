from fastapi import APIRouter
from app.services.ai.test_generator import generate_test
from app.api.upload import parsed_endpoints

router = APIRouter()

generated_tests = []


@router.post("/generate")
def generate():
    global generated_tests
    generated_tests = [generate_test(e) for e in parsed_endpoints]

    return {"tests": generated_tests}
