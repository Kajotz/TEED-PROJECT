from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
import uuid

from core.models import Business


def is_uuid(value):
    try:
        uuid.UUID(str(value))
        return True
    except Exception:
        return False


class BusinessSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = str(request.GET.get("q", "")).strip()

        if not query:
            return Response([])

        if is_uuid(query):
            businesses = Business.objects.filter(id=query)
        else:
            businesses = Business.objects.filter(
                Q(name__icontains=query) |
                Q(slug__icontains=query)
            ).order_by("name")[:10]

        data = [
            {
                "id": str(business.id),
                "name": business.name,
            }
            for business in businesses
        ]
        return Response(data)