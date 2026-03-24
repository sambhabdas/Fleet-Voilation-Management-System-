import logging

from app.config import settings

logger = logging.getLogger(__name__)

_initialized = False


def _ensure_init():
    global _initialized
    if _initialized:
        return True
    if not settings.FCM_SERVICE_ACCOUNT_PATH:
        return False
    try:
        import firebase_admin
        from firebase_admin import credentials
        cred = credentials.Certificate(settings.FCM_SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
        _initialized = True
        logger.info("Firebase Admin SDK initialized successfully")
        return True
    except Exception as e:
        logger.warning(f"Firebase Admin SDK initialization failed: {e}")
        return False


def send_violation_notification(tokens: list[str], violation_data: dict):
    """Send FCM push notification for a new violation to given device tokens."""
    if not tokens:
        return
    if not _ensure_init():
        return

    try:
        from firebase_admin import messaging

        event_label = violation_data.get("event_type", "Violation").replace("_", " ").title()
        severity = violation_data.get("severity", "unknown")
        driver_name = violation_data.get("driver_name", "Unknown Driver")

        notification = messaging.Notification(
            title=f"Violation: {event_label}",
            body=f"Driver: {driver_name} | Severity: {severity}",
        )

        data_payload = {
            "type": "violation:new",
            "violation_id": str(violation_data.get("id", "")),
            "event_type": violation_data.get("event_type", ""),
            "severity": severity,
        }

        message = messaging.MulticastMessage(
            notification=notification,
            data=data_payload,
            tokens=tokens,
        )

        response = messaging.send_each_for_multicast(message)
        logger.info(
            f"FCM sent: {response.success_count} success, {response.failure_count} failure"
        )
    except Exception as e:
        logger.error(f"FCM send failed: {e}")
