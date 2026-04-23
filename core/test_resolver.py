from django.contrib.auth import get_user_model
from django.db.models import Q
import uuid

User = get_user_model()

def is_uuid(value):
    try:
        uuid.UUID(str(value))
        return True
    except:
        return False


def search_users(query):
    query = query.strip()

    if not query:
        return []

    if is_uuid(query):
        users = User.objects.filter(id=query)
    else:
        users = User.objects.filter(
            Q(username__icontains=query)
        ).order_by("username")[:10]

    return [
        {
            "id": str(u.id),
            "username": u.username
        }
        for u in users
    ]