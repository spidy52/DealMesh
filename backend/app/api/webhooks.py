from fastapi import APIRouter, Request, Header, HTTPException, Depends
from backend.app.payments.webhooks import RazorpayWebhookHandler

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/razorpay")
async def razorpay_webhook_endpoint(
    request: Request,
    x_razorpay_signature: str = Header(default="")
):
    """
    Receives and processes incoming Razorpay Webhooks (payment.captured, payment.failed, order.paid).
    Enforces idempotency and signature verification.
    """
    try:
        raw_body = (await request.body()).decode("utf-8")
        event_payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook JSON body")

    success, message = await RazorpayWebhookHandler.process_webhook_event(
        event_payload=event_payload,
        signature=x_razorpay_signature,
        raw_body=raw_body
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {"status": "ok", "message": message}
