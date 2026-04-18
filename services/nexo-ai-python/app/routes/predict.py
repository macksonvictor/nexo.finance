from __future__ import annotations

from fastapi import APIRouter

from app.schemas import AnalysisRequest, PredictResponse
from app.services.predict_service import predict_spending


router = APIRouter(tags=["predict"])


@router.post("/predict/spending", response_model=PredictResponse)
def post_predict(payload: AnalysisRequest) -> PredictResponse:
    return predict_spending(payload)
