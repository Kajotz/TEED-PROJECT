from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def hello(request):
    return Response({"message": "Welcome to TEED Hub API (test_views)"})


@api_view(['GET'])
def test_api(request):
    return Response({"status": "success", "message": "Django API test_views is working!"})
