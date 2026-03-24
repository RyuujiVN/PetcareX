import uuid
from sqlalchemy.orm import Session
import models

def _to_uuid(value):
    if isinstance(value, uuid.UUID):
        return value
    if not value:
        return None
    return uuid.UUID(str(value))


def get_history(db: Session, room_id: str):
    room_uuid = _to_uuid(room_id)
    if room_uuid is None:
        return []

    messages = (
        db.query(models.Message)
        .filter(models.Message.room_id == room_uuid)
        .order_by(models.Message.created_at.asc())
        .all()
    )
    history = []
    temp_user_msg = ""
    for msg in messages:
        role = (msg.send_by or "").strip().lower()
        if role == "USER":
            temp_user_msg = msg.content
        elif role in ("AI"):
            history.append((temp_user_msg, msg.content))
            temp_user_msg = ""
    return history

