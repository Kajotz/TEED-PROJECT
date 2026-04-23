from django.db import transaction
from rest_framework import serializers

from core.models.sales.inventory import (
    Product,
    ProductTrackingMode,
    ProductUnit,
    ProductUnitStatus,
    StockAdjustment,
    StockAdjustmentType,
)


class ProductSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.ReadOnlyField()
    is_out_of_stock = serializers.ReadOnlyField()
    stock_value = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            "id",
            "business",
            "name",
            "sku",
            "tracking_mode",
            "stock_quantity",
            "cost_price",
            "selling_price",
            "low_stock_threshold",
            "is_active",
            "is_low_stock",
            "is_out_of_stock",
            "stock_value",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "is_low_stock",
            "is_out_of_stock",
            "stock_value",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        instance = getattr(self, "instance", None)

        business = attrs.get("business")
        if business is None and instance is not None:
            business = instance.business

        tracking_mode = attrs.get("tracking_mode")
        if tracking_mode is None and instance is not None:
            tracking_mode = instance.tracking_mode
        if tracking_mode is None:
            tracking_mode = ProductTrackingMode.QUANTITY

        stock_quantity = attrs.get("stock_quantity")
        if stock_quantity is None and instance is not None:
            stock_quantity = instance.stock_quantity
        if stock_quantity is None:
            stock_quantity = 0

        cost_price = attrs.get("cost_price")
        if cost_price is None and instance is not None:
            cost_price = instance.cost_price

        selling_price = attrs.get("selling_price")
        if selling_price is None and instance is not None:
            selling_price = instance.selling_price

        low_stock_threshold = attrs.get("low_stock_threshold")
        if low_stock_threshold is None and instance is not None:
            low_stock_threshold = instance.low_stock_threshold
        if low_stock_threshold is None:
            low_stock_threshold = 0

        errors = {}

        if not attrs.get("name") and instance is None:
            errors["name"] = "Product name is required."

        if stock_quantity < 0:
            errors["stock_quantity"] = "Stock quantity cannot be negative."

        if cost_price is not None and cost_price < 0:
            errors["cost_price"] = "Cost price cannot be negative."

        if selling_price is not None and selling_price < 0:
            errors["selling_price"] = "Selling price cannot be negative."

        if low_stock_threshold < 0:
            errors["low_stock_threshold"] = "Low stock threshold cannot be negative."

        if tracking_mode == ProductTrackingMode.SERIALIZED and stock_quantity != 0:
            if instance is None:
                errors["stock_quantity"] = (
                    "Serialized products should start with stock quantity 0. "
                    "Add stock through ProductUnit records."
                )

        if errors:
            raise serializers.ValidationError(errors)

        attrs["business"] = business
        return attrs


class ProductListSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.ReadOnlyField()
    is_out_of_stock = serializers.ReadOnlyField()
    stock_value = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "tracking_mode",
            "stock_quantity",
            "cost_price",
            "selling_price",
            "low_stock_threshold",
            "is_active",
            "is_low_stock",
            "is_out_of_stock",
            "stock_value",
            "created_at",
            "updated_at",
        ]


class ProductUnitSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = ProductUnit
        fields = [
            "id",
            "business",
            "product",
            "product_name",
            "unique_id",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "product_name",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        instance = getattr(self, "instance", None)

        business = attrs.get("business")
        if business is None and instance is not None:
            business = instance.business

        product = attrs.get("product")
        if product is None and instance is not None:
            product = instance.product

        unique_id = attrs.get("unique_id")
        if unique_id is None and instance is not None:
            unique_id = instance.unique_id

        errors = {}

        if product is None:
            errors["product"] = "Product is required."

        if business is None:
            errors["business"] = "Business is required."

        if product is not None and business is not None and product.business_id != business.id:
            errors["product"] = "Product must belong to the selected business."

        if product is not None and product.tracking_mode != ProductTrackingMode.SERIALIZED:
            errors["product"] = "Units can only be created for serialized products."

        if not unique_id or not str(unique_id).strip():
            errors["unique_id"] = "Unique product ID is required."

        if errors:
            raise serializers.ValidationError(errors)

        attrs["unique_id"] = str(unique_id).strip()
        attrs["business"] = business
        return attrs


class ProductUnitListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = ProductUnit
        fields = [
            "id",
            "product",
            "product_name",
            "unique_id",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]


class StockAdjustmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    performed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StockAdjustment
        fields = [
            "id",
            "business",
            "product",
            "product_name",
            "adjustment_type",
            "quantity",
            "reason",
            "performed_by",
            "performed_by_name",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "product_name",
            "performed_by_name",
            "created_at",
        ]

    def get_performed_by_name(self, obj):
        user = obj.performed_by
        if not user:
            return None
        return getattr(user, "username", None) or getattr(user, "email", None) or str(user.pk)

    def validate(self, attrs):
        business = attrs.get("business")
        product = attrs.get("product")
        adjustment_type = attrs.get("adjustment_type")
        quantity = attrs.get("quantity")

        errors = {}

        if business is None:
            errors["business"] = "Business is required."

        if product is None:
            errors["product"] = "Product is required."

        if business is not None and product is not None and product.business_id != business.id:
            errors["product"] = "Product must belong to the selected business."

        if quantity is None:
            errors["quantity"] = "Quantity is required."
        elif quantity < 0:
            errors["quantity"] = "Quantity cannot be negative."

        if (
            adjustment_type in {StockAdjustmentType.ADD, StockAdjustmentType.REMOVE}
            and quantity == 0
        ):
            errors["quantity"] = "Quantity must be greater than zero."

        if product is not None and product.tracking_mode == ProductTrackingMode.SERIALIZED:
            errors["product"] = (
                "Manual stock adjustment is not allowed for serialized products. "
                "Manage stock through product units."
            )

        if (
            product is not None
            and adjustment_type == StockAdjustmentType.REMOVE
            and quantity is not None
            and product.stock_quantity < quantity
        ):
            errors["quantity"] = "Cannot remove more stock than available."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        return StockAdjustment.objects.create(**validated_data)


class InventorySummarySerializer(serializers.ModelSerializer):
    is_low_stock = serializers.ReadOnlyField()
    is_out_of_stock = serializers.ReadOnlyField()
    stock_value = serializers.ReadOnlyField()
    serialized_units_in_stock = serializers.SerializerMethodField()
    total_units = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "tracking_mode",
            "stock_quantity",
            "cost_price",
            "selling_price",
            "low_stock_threshold",
            "is_active",
            "is_low_stock",
            "is_out_of_stock",
            "stock_value",
            "serialized_units_in_stock",
            "total_units",
        ]

    def get_serialized_units_in_stock(self, obj):
        if obj.tracking_mode != ProductTrackingMode.SERIALIZED:
            return None
        return obj.units.filter(status=ProductUnitStatus.IN_STOCK).count()

    def get_total_units(self, obj):
        if obj.tracking_mode != ProductTrackingMode.SERIALIZED:
            return None
        return obj.units.count()