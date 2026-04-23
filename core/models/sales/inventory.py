from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from core.models.business.business import Business


class ProductTrackingMode(models.TextChoices):
    QUANTITY = "quantity", "Quantity"
    SERIALIZED = "serialized", "Serialized"


class ProductUnitStatus(models.TextChoices):
    IN_STOCK = "in_stock", "In Stock"
    SOLD = "sold", "Sold"
    RETURNED = "returned", "Returned"
    DAMAGED = "damaged", "Damaged"


class StockAdjustmentType(models.TextChoices):
    ADD = "add", "Add"
    REMOVE = "remove", "Remove"
    SET = "set", "Set"


class Product(models.Model):
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="products",
    )
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, blank=True)
    tracking_mode = models.CharField(
        max_length=20,
        choices=ProductTrackingMode.choices,
        default=ProductTrackingMode.QUANTITY,
    )
    stock_quantity = models.PositiveIntegerField(default=0)
    cost_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    selling_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    low_stock_threshold = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sales_product"
        ordering = ["name", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["business", "name"],
                name="unique_product_name_per_business",
            ),
            models.UniqueConstraint(
                fields=["business", "sku"],
                condition=~Q(sku=""),
                name="unique_product_sku_per_business_when_present",
            ),
        ]
        indexes = [
            models.Index(fields=["business", "name"]),
            models.Index(fields=["business", "tracking_mode"]),
            models.Index(fields=["business", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.business_id})"

    def clean(self):
        errors = {}

        if self.stock_quantity < 0:
            errors["stock_quantity"] = "Stock quantity cannot be negative."

        if self.cost_price is not None and self.cost_price < 0:
            errors["cost_price"] = "Cost price cannot be negative."

        if self.selling_price is not None and self.selling_price < 0:
            errors["selling_price"] = "Selling price cannot be negative."

        if self.low_stock_threshold < 0:
            errors["low_stock_threshold"] = "Low stock threshold cannot be negative."

        if self.tracking_mode == ProductTrackingMode.SERIALIZED and self.stock_quantity < 0:
            errors["stock_quantity"] = "Serialized products cannot have negative stock."

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold

    @property
    def is_out_of_stock(self):
        return self.stock_quantity == 0

    @property
    def stock_value(self):
        return (self.cost_price or Decimal("0.00")) * Decimal(self.stock_quantity)

    def recalculate_stock_from_units(self, commit=True):
        if self.tracking_mode != ProductTrackingMode.SERIALIZED:
            return self.stock_quantity

        actual_stock = self.units.filter(status=ProductUnitStatus.IN_STOCK).count()
        self.stock_quantity = actual_stock

        if commit:
            self.save(update_fields=["stock_quantity", "updated_at"])

        return actual_stock


class ProductUnit(models.Model):
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="product_units",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="units",
    )
    unique_id = models.CharField(max_length=150)
    status = models.CharField(
        max_length=20,
        choices=ProductUnitStatus.choices,
        default=ProductUnitStatus.IN_STOCK,
    )
    notes = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sales_product_unit"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["business", "unique_id"],
                name="unique_product_unit_id_per_business",
            ),
        ]
        indexes = [
            models.Index(fields=["business", "product"]),
            models.Index(fields=["business", "status"]),
            models.Index(fields=["product", "status"]),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.unique_id}"

    def clean(self):
        errors = {}

        if self.product_id and self.business_id and self.product.business_id != self.business_id:
            errors["product"] = "Product must belong to the same business as this unit."

        if self.product_id and self.product.tracking_mode != ProductTrackingMode.SERIALIZED:
            errors["product"] = "Product units can only be created for serialized products."

        if not self.unique_id or not self.unique_id.strip():
            errors["unique_id"] = "Unique product ID is required."

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.unique_id = (self.unique_id or "").strip()
        self.full_clean()
        result = super().save(*args, **kwargs)

        if self.product.tracking_mode == ProductTrackingMode.SERIALIZED:
            self.product.recalculate_stock_from_units(commit=True)

        return result

    def delete(self, *args, **kwargs):
        product = self.product
        result = super().delete(*args, **kwargs)

        if product.tracking_mode == ProductTrackingMode.SERIALIZED:
            product.recalculate_stock_from_units(commit=True)

        return result


class StockAdjustment(models.Model):
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="stock_adjustments",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="stock_adjustments",
    )
    adjustment_type = models.CharField(
        max_length=20,
        choices=StockAdjustmentType.choices,
    )
    quantity = models.PositiveIntegerField()
    reason = models.CharField(max_length=255, blank=True)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="performed_stock_adjustments",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sales_stock_adjustment"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["business", "product"]),
            models.Index(fields=["business", "adjustment_type"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.adjustment_type} ({self.quantity})"

    def clean(self):
        errors = {}

        if self.product_id and self.business_id and self.product.business_id != self.business_id:
            errors["product"] = "Product must belong to the same business as this adjustment."

        if self.quantity < 0:
            errors["quantity"] = "Adjustment quantity cannot be negative."

        if self.product_id and self.product.tracking_mode == ProductTrackingMode.SERIALIZED:
            errors["product"] = (
                "Manual stock adjustments are not allowed for serialized products. "
                "Manage serialized stock through ProductUnit records."
            )

        if self.adjustment_type in {
            StockAdjustmentType.ADD,
            StockAdjustmentType.REMOVE,
        } and self.quantity == 0:
            errors["quantity"] = "Quantity must be greater than zero."

        if (
            self.product_id
            and self.adjustment_type == StockAdjustmentType.REMOVE
            and self.product.stock_quantity < self.quantity
        ):
            errors["quantity"] = "Cannot remove more stock than is currently available."

        if errors:
            raise ValidationError(errors)

    def apply(self):
        product = self.product

        if self.adjustment_type == StockAdjustmentType.ADD:
            product.stock_quantity += self.quantity
        elif self.adjustment_type == StockAdjustmentType.REMOVE:
            product.stock_quantity -= self.quantity
        elif self.adjustment_type == StockAdjustmentType.SET:
            product.stock_quantity = self.quantity
        else:
            raise ValidationError({"adjustment_type": "Invalid adjustment type."})

        product.save(update_fields=["stock_quantity", "updated_at"])

    def save(self, *args, **kwargs):
        is_create = self.pk is None
        self.full_clean()
        result = super().save(*args, **kwargs)

        if is_create:
            self.apply()

        return result