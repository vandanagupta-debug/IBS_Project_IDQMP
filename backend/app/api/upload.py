from fastapi import APIRouter, UploadFile, File
import json
from app.services.parser.postman_parser import parse_postman

router = APIRouter()

parsed_endpoints = []

@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    data = json.loads(await file.read())

    global parsed_endpoints
    parsed_endpoints = parse_postman(data)

    return {"endpoints": parsed_endpoints}