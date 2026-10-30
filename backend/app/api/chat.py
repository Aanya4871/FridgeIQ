import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.domain import ChatConversation, ChatMessage
from app.schemas.domain import ChatRequest, ChatResponse
from app.services.chat_service import chat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["AI Chat"])


@router.post("", response_model=ChatResponse)
def chat_with_assistant(
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Authenticated chat endpoint powered by Gemini 2.5/3.5 Flash and grounded in real-time user inventory.
    """
    cleaned_message = data.message.strip()
    if not cleaned_message:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message cannot be empty",
        )

    logger.info("Chat request from user_id=%s, length=%d", current_user.id, len(cleaned_message))

    result = chat_service.process_chat_message(
        db=db,
        current_user=current_user,
        message=cleaned_message,
        conversation_id=data.conversation_id,
    )

    return ChatResponse(
        reply=result["reply"],
        conversation_id=result.get("conversation_id"),
        suggested_actions=result.get("suggested_actions"),
    )


@router.get("/history")
def get_chat_history(
    conversation_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves recent chat history for the authenticated user's active conversation.
    """
    conv_query = db.query(ChatConversation).filter(ChatConversation.user_id == current_user.id)
    if conversation_id:
        conv_query = conv_query.filter(ChatConversation.id == conversation_id)
    
    conversation = conv_query.order_by(ChatConversation.updated_at.desc()).first()
    if not conversation:
        return {"conversation_id": None, "messages": []}

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conversation.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(30)
        .all()
    )

    return {
        "conversation_id": conversation.id,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
    }
