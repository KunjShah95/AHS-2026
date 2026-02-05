from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool


class PaginatedResponse(GenericModel, Generic[T]):
    data: List[T]
    meta: PaginationMeta


def paginate(
    items: List[Any], page: int, page_size: int, total_items: int
) -> PaginatedResponse[Any]:
    total_pages = (total_items + page_size - 1) // page_size if total_items > 0 else 0

    start = (page - 1) * page_size
    end = start + page_size
    data = items[start:end]

    return PaginatedResponse(
        data=data,
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        ),
    )
