from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.serializers.profile.account_completion import AccountCompletionSerializer
from core.services.account_state import get_post_auth_state


class AccountCompletionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(get_post_auth_state(request.user))

    def patch(self, request, *args, **kwargs):
        serializer = AccountCompletionSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        state = serializer.save()
        return Response({
            "detail": "Account completed successfully.",
            "post_auth": state,
        })