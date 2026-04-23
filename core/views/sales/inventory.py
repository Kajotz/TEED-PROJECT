from django.db.models import Prefetch
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import BusinessMember
from core.models.sales.inventory import Product, ProductTrackingMode, ProductUnit, StockAdjustment
from core.rbac.decorators import require_business_permission
from core.rbac.permission_resolver import get_member
from core.serializers.sales.inventory import (
    InventorySummarySerializer,
    ProductListSerializer,
    ProductSerializer,
    ProductUnitListSerializer,
    ProductUnitSerializer,
    StockAdjustmentSerializer,
)


class InventoryBusinessAccessMixin:
    """
    Attaches request.business and request.business_member through RBAC decorator.
    Scopes all queries to the active business.
    """

    def get_business(self):
        return getattr(self.request, "business", None)

    def get_business_member(self):
        return getattr(self.request, "business_member", None)

    def get_business_queryset(self, queryset):
        business = self.get_business()
        return queryset.filter(business=business)


class ProductListCreateView(InventoryBusinessAccessMixin, APIView):
    @require_business_permission("inventory.view")
    def get(self, request, business_id):
        queryset = (
            self.get_business_queryset(Product.objects.all())
            .order_by("name", "-created_at")
        )

        tracking_mode = request.query_params.get("tracking_mode")
        is_active = request.query_params.get("is_active")
        low_stock_only = request.query_params.get("low_stock")
        search = (request.query_params.get("search") or "").strip()

        if tracking_mode in {ProductTrackingMode.QUANTITY, ProductTrackingMode.SERIALIZED}:
            queryset = queryset.filter(tracking_mode=tracking_mode)

        if is_active in {"true", "false"}:
            queryset = queryset.filter(is_active=(is_active == "true"))

        if search:
            queryset = queryset.filter(name__icontains=search)

        products = list(queryset)
        if low_stock_only == "true":
            products = [product for product in products if product.is_low_stock]

        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @require_business_permission("inventory.create")
    def post(self, request, business_id):
        payload = request.data.copy()
        payload["business"] = str(request.business.id)

        serializer = ProductSerializer(data=payload, context={"request": request})
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        response_serializer = ProductSerializer(product, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ProductDetailView(InventoryBusinessAccessMixin, APIView):
    @require_business_permission("inventory.view")
    def get(self, request, business_id, product_id):
        product = self.get_business_queryset(Product.objects.all()).filter(id=product_id).first()
        if not product:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(product, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @require_business_permission("inventory.update")
    def patch(self, request, business_id, product_id):
        product = self.get_business_queryset(Product.objects.all()).filter(id=product_id).first()
        if not product:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        payload = request.data.copy()
        payload["business"] = str(request.business.id)

        serializer = ProductSerializer(
            product,
            data=payload,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        response_serializer = ProductSerializer(product, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @require_business_permission("inventory.update")
    def put(self, request, business_id, product_id):
        product = self.get_business_queryset(Product.objects.all()).filter(id=product_id).first()
        if not product:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        payload = request.data.copy()
        payload["business"] = str(request.business.id)

        serializer = ProductSerializer(
            product,
            data=payload,
            partial=False,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        response_serializer = ProductSerializer(product, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class InventorySummaryView(InventoryBusinessAccessMixin, APIView):
    @require_business_permission("inventory.view")
    def get(self, request, business_id):
        queryset = self.get_business_queryset(
            Product.objects.prefetch_related(
                Prefetch("units", queryset=ProductUnit.objects.order_by("-created_at"))
            )
        ).order_by("name", "-created_at")

        serializer = InventorySummarySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProductUnitListCreateView(InventoryBusinessAccessMixin, APIView):
    @require_business_permission("inventory.view")
    def get(self, request, business_id, product_id=None):
        queryset = self.get_business_queryset(
            ProductUnit.objects.select_related("product")
        ).order_by("-created_at")

        if product_id:
            queryset = queryset.filter(product_id=product_id)

        status_filter = request.query_params.get("status")
        search = (request.query_params.get("search") or "").strip()

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        if search:
            queryset = queryset.filter(unique_id__icontains=search)

        serializer = ProductUnitListSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @require_business_permission("inventory.update")
    def post(self, request, business_id, product_id=None):
        payload = request.data.copy()
        payload["business"] = str(request.business.id)

        if product_id:
            payload["product"] = str(product_id)

        serializer = ProductUnitSerializer(data=payload, context={"request": request})
        serializer.is_valid(raise_exception=True)
        unit = serializer.save()

        response_serializer = ProductUnitSerializer(unit, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ProductUnitDetailView(InventoryBusinessAccessMixin, APIView):
    @require_business_permission("inventory.view")
    def get(self, request, business_id, unit_id):
        unit = self.get_business_queryset(
            ProductUnit.objects.select_related("product")
        ).filter(id=unit_id).first()

        if not unit:
            return Response({"detail": "Product unit not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductUnitSerializer(unit, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @require_business_permission("inventory.update")
    def patch(self, request, business_id, unit_id):
        unit = self.get_business_queryset(
            ProductUnit.objects.select_related("product")
        ).filter(id=unit_id).first()

        if not unit:
            return Response({"detail": "Product unit not found."}, status=status.HTTP_404_NOT_FOUND)

        payload = request.data.copy()
        payload["business"] = str(request.business.id)

        serializer = ProductUnitSerializer(
            unit,
            data=payload,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        unit = serializer.save()

        response_serializer = ProductUnitSerializer(unit, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @require_business_permission("inventory.update")
    def delete(self, request, business_id, unit_id):
        unit = self.get_business_queryset(
            ProductUnit.objects.select_related("product")
        ).filter(id=unit_id).first()

        if not unit:
            return Response({"detail": "Product unit not found."}, status=status.HTTP_404_NOT_FOUND)

        if unit.status == "sold":
            return Response(
                {"detail": "Sold product units cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        unit.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StockAdjustmentCreateView(InventoryBusinessAccessMixin, APIView):
    @require_business_permission("inventory.update")
    def post(self, request, business_id):
        payload = request.data.copy()
        payload["business"] = str(request.business.id)
        payload["performed_by"] = request.user.id

        serializer = StockAdjustmentSerializer(data=payload, context={"request": request})
        serializer.is_valid(raise_exception=True)
        adjustment = serializer.save()

        response_serializer = StockAdjustmentSerializer(adjustment, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ProductStockAdjustmentListView(InventoryBusinessAccessMixin, APIView):
    @require_business_permission("inventory.view")
    def get(self, request, business_id, product_id=None):
        queryset = self.get_business_queryset(
            StockAdjustment.objects.select_related("product", "performed_by")
        ).order_by("-created_at")

        if product_id:
            queryset = queryset.filter(product_id=product_id)

        adjustment_type = request.query_params.get("adjustment_type")
        if adjustment_type:
            queryset = queryset.filter(adjustment_type=adjustment_type)

        serializer = StockAdjustmentSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)