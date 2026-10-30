import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.domain import ChatConversation, ChatMessage
from app.models.user import User
from app.services.chat_context_service import chat_context_service
from app.services.gemini_service import (
    gemini_service,
    GeminiConfigurationError,
    GeminiAuthenticationError,
    GeminiRateLimitError,
    GeminiTimeoutError,
    GeminiServiceError,
    GeminiEmptyResponseError,
)

logger = logging.getLogger(__name__)


class ChatService:
    @staticmethod
    def process_chat_message(
        db: Session,
        current_user: User,
        message: str,
        conversation_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Orchestrates conversation persistence, context injection, and Gemini AI response generation.
        Strictly enforces tenant isolation (current_user.id).
        """
        conversation: Optional[ChatConversation] = None
        if conversation_id:
            conversation = (
                db.query(ChatConversation)
                .filter(ChatConversation.id == conversation_id, ChatConversation.user_id == current_user.id)
                .first()
            )

        if not conversation:
            conversation = (
                db.query(ChatConversation)
                .filter(ChatConversation.user_id == current_user.id)
                .order_by(ChatConversation.updated_at.desc())
                .first()
            )
            if not conversation:
                conversation = ChatConversation(user_id=current_user.id)
                db.add(conversation)
                db.commit()
                db.refresh(conversation)

        recent_messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.conversation_id == conversation.id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
        history_list = [{"role": m.role, "content": m.content} for m in recent_messages]

        user_chat_msg = ChatMessage(
            conversation_id=conversation.id,
            role="user",
            content=message,
        )
        db.add(user_chat_msg)
        db.commit()

        context = chat_context_service.build_user_context(db=db, user_id=current_user.id)

        try:
            ai_reply = gemini_service.generate_chat_response(
                user_message=message,
                application_context=context,
                conversation_history=history_list,
            )
        except (GeminiConfigurationError, GeminiAuthenticationError) as e:
            logger.error("Gemini Auth/Config error: %s", e)
            ai_reply = "I'm having trouble connecting to my AI service (invalid or missing configuration). Please check the backend settings."
        except GeminiRateLimitError as e:
            logger.warning("Gemini rate limit: %s", e)
            ai_reply = "The AI service is currently busy or experiencing high traffic. Please try again in a few moments."
        except GeminiTimeoutError as e:
            logger.warning("Gemini timeout: %s", e)
            ai_reply = "The AI service timed out while processing your request. Please try asking again."
        except (GeminiServiceError, GeminiEmptyResponseError) as e:
            logger.error("Gemini service error: %s", e)
            ai_reply = "I couldn't reach the AI service right now. Please try again in a moment."
        except Exception as e:
            logger.exception("Unexpected chat processing error: %s", type(e).__name__)
            ai_reply = "An unexpected error occurred while processing your request. Please try again."

        ai_chat_msg = ChatMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=ai_reply,
        )
        db.add(ai_chat_msg)
        db.commit()

        suggested_actions = ["What can I cook tonight?", "What expires first?", "How should I store vegetables?"]
        if context.get("expiring_soon"):
            soonest = context["expiring_soon"][0]["name"]
            suggested_actions = [f"What can I cook with {soonest}?", "Show full inventory", "What else is expiring?"]

        return {
            "reply": ai_reply,
            "conversation_id": conversation.id,
            "suggested_actions": suggested_actions,
        }


chat_service = ChatService()

