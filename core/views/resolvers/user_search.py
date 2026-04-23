from django.contrib.auth import get_user_model
from django.db.models import Q
from uuid import UUID
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

User = get_user_model()


def is_uuid(value):
    try:
        UUID(str(value).strip())
        return True
    except (TypeError, ValueError, AttributeError):
        return False


class UserSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = str(request.GET.get("q", "")).strip()

        if not query:
            return Response([])

        if is_uuid(query):
            users = User.objects.filter(id=query)
        else:
            users = User.objects.filter(
                Q(username__icontains=query)
            ).order_by("username")[:10]

        data = [
            {
                "id": str(user.id),
                "username": user.username,
            }
            for user in users
        ]
        return Response(data)