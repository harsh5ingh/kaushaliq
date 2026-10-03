from src.config import settings


def allowed():
    return settings.environment.lower() == 'development' and settings.demo_account_enabled


def user_allowed(user):
    return not user['is_demo'] or allowed()
